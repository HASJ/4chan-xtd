/**
 * Lightweight, zero-dependency video container patchers to remove audio tracks.
 * Modifies the underlying ArrayBuffer in-place.
 */

interface Mp4BoxHeader {
  size: number;
  boxOffset: number;
}

interface Vint {
  val: number;
  length: number;
}

export class VideoStripper {
  static async stripAudio(file: File): Promise<File> {
    try {
      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      const dataView = new DataView(buffer);

      let patched = false;
      if (file.type === 'video/mp4' || file.name.endsWith('.mp4')) {
        patched = this.stripMp4(uint8, dataView);
      } else if (file.type === 'video/webm' || file.name.endsWith('.webm')) {
        patched = this.stripWebm(uint8);
      }

      if (patched) {
        return new File([buffer], file.name, { type: file.type });
      }
    } catch (e) {
      console.warn('Failed to strip audio from video:', e);
    }
    return file; // If parsing fails or audio not found, return original file
  }

  // --- MP4 (ISO BMFF) ---

  private static readMp4BoxHeader(uint8: Uint8Array, view: DataView, offset: number): Mp4BoxHeader | null {
    if (offset + 8 > uint8.length) return null;
    let size = view.getUint32(offset, false);
    let boxOffset = offset;

    if (size === 1) {
      if (offset + 16 > uint8.length) return null;
      // 64-bit size, we only read the lower 32 bits since MP4 files on 4chan aren't that huge
      size = view.getUint32(offset + 12, false);
      boxOffset += 8;
    }

    if (size === 0) {
      // Box extends to end of file
      size = uint8.length - offset;
    }

    return { size, boxOffset };
  }

  private static mdiaHasAudioHandler(
    uint8: Uint8Array,
    view: DataView,
    mdiaOffset: number,
    mdiaEnd: number,
    decoder: TextDecoder
  ): boolean {
    while (mdiaOffset < mdiaEnd) {
      if (mdiaOffset + 8 > mdiaEnd) break;
      let boxSize = view.getUint32(mdiaOffset, false);
      if (boxSize === 0) boxSize = mdiaEnd - mdiaOffset;

      const boxType = decoder.decode(uint8.subarray(mdiaOffset + 4, mdiaOffset + 8));
      if (boxType === 'hdlr' && mdiaOffset + 20 <= mdiaEnd) {
        const handlerType = decoder.decode(uint8.subarray(mdiaOffset + 16, mdiaOffset + 20));
        if (handlerType === 'soun') return true;
      }
      mdiaOffset += boxSize;
    }
    return false;
  }

  private static isAudioTrak(
    uint8: Uint8Array,
    view: DataView,
    trakOffset: number,
    trakEnd: number,
    decoder: TextDecoder
  ): boolean {
    while (trakOffset < trakEnd) {
      if (trakOffset + 8 > trakEnd) break;
      let boxSize = view.getUint32(trakOffset, false);
      if (boxSize === 0) boxSize = trakEnd - trakOffset;

      const boxType = decoder.decode(uint8.subarray(trakOffset + 4, trakOffset + 8));
      if (boxType === 'mdia' && this.mdiaHasAudioHandler(uint8, view, trakOffset + 8, trakOffset + boxSize, decoder)) {
        return true;
      }
      trakOffset += boxSize;
    }
    return false;
  }

  private static stripAudioTraks(
    uint8: Uint8Array,
    view: DataView,
    moovOffset: number,
    moovEnd: number,
    decoder: TextDecoder
  ): boolean {
    let stripped = false;
    while (moovOffset < moovEnd) {
      if (moovOffset + 8 > moovEnd) break;
      let boxSize = view.getUint32(moovOffset, false);
      if (boxSize === 0) boxSize = moovEnd - moovOffset;

      const boxType = decoder.decode(uint8.subarray(moovOffset + 4, moovOffset + 8));
      if (boxType === 'trak' && this.isAudioTrak(uint8, view, moovOffset + 8, moovOffset + boxSize, decoder)) {
        // Overwrite 'trak' with 'free'
        uint8[moovOffset + 4] = 0x66; // 'f'
        uint8[moovOffset + 5] = 0x72; // 'r'
        uint8[moovOffset + 6] = 0x65; // 'e'
        uint8[moovOffset + 7] = 0x65; // 'e'
        stripped = true;
      }
      moovOffset += boxSize;
    }
    return stripped;
  }

  private static stripMp4(uint8: Uint8Array, view: DataView): boolean {
    let offset = 0;
    let stripped = false;
    const decoder = new TextDecoder('utf8');

    while (offset < uint8.length) {
      const header = this.readMp4BoxHeader(uint8, view, offset);
      if (!header) break;
      const { size, boxOffset } = header;

      const type = decoder.decode(uint8.subarray(boxOffset + 4, boxOffset + 8));
      if (type === 'moov' && this.stripAudioTraks(uint8, view, boxOffset + 8, offset + size, decoder)) {
        stripped = true;
      }
      offset += size;
    }
    return stripped;
  }

  // --- WebM (EBML/Matroska) ---

  private static readVint(uint8: Uint8Array, off: number): Vint {
    if (off >= uint8.length) return { val: 0, length: 1 };
    const byte = uint8[off];
    let mask = 0x80;
    let length = 1;
    while (!(byte & mask) && length < 8) {
      mask >>= 1;
      length++;
    }
    let val = byte & ~mask;
    let allOnes = val === mask - 1; // all data bits in the marker byte are 1
    for (let i = 1; i < length; i++) {
      if (off + i >= uint8.length) break;
      const next = uint8[off + i];
      if (next !== 0xff) allOnes = false;
      // Use arithmetic instead of `<<`/`|`: bitwise ops coerce to 32-bit signed
      // integers, so vints of length >= 5 (up to 8 for EBML) would silently
      // wrap/go negative. Multiplication stays exact up to Number.MAX_SAFE_INTEGER.
      val = (val * 256) + next;
    }
    // Handle unknown size (all data bits across the vint are 1)
    if (allOnes) val = -1;
    return { val, length };
  }

  private static skipVintElement(uint8: Uint8Array, offset: number): number {
    let idLength = 1;
    while (!(uint8[offset] & (0x80 >> (idLength - 1))) && idLength < 8) idLength++;
    const sizeInfo = this.readVint(uint8, offset + idLength);
    return offset + idLength + sizeInfo.length + sizeInfo.val;
  }

  private static isAudioTrackEntry(uint8: Uint8Array, entryDataOffset: number, entryEnd: number): boolean {
    let curr = entryDataOffset;
    while (curr < entryEnd) {
      if (curr >= uint8.length) break;
      if (uint8[curr] === 0x83) {
        // TrackType
        const typeSizeInfo = this.readVint(uint8, curr + 1);
        const typeValInfo = this.readVint(uint8, curr + 1 + typeSizeInfo.length);
        if (typeValInfo.val === 2) return true; // Audio
        curr += 1 + typeSizeInfo.length + typeSizeInfo.val;
      } else {
        curr = this.skipVintElement(uint8, curr);
      }
    }
    return false;
  }

  private static processTracks(uint8: Uint8Array, tracksOffset: number, tracksEnd: number): boolean {
    let stripped = false;
    while (tracksOffset < tracksEnd) {
      if (tracksOffset >= uint8.length) break;
      if (uint8[tracksOffset] === 0xae) {
        // TrackEntry
        const entryStart = tracksOffset;
        const entrySizeInfo = this.readVint(uint8, tracksOffset + 1);
        const entryDataOffset = tracksOffset + 1 + entrySizeInfo.length;
        const entryEnd = entryDataOffset + entrySizeInfo.val;

        if (this.isAudioTrackEntry(uint8, entryDataOffset, entryEnd)) {
          // Overwrite 'TrackEntry' (AE) with 'Void' (EC)
          uint8[entryStart] = 0xec;
          stripped = true;
        }
        tracksOffset = entryEnd;
      } else {
        tracksOffset = this.skipVintElement(uint8, tracksOffset);
      }
    }
    return stripped;
  }

  private static processSegment(uint8: Uint8Array, segStart: number, segEnd: number): { stripped: boolean; offset: number } {
    let stripped = false;
    let offset = segStart;

    while (offset < segEnd) {
      if (offset + 3 >= uint8.length) break;
      // Tracks
      if (uint8[offset] === 0x16 && uint8[offset + 1] === 0x54 && uint8[offset + 2] === 0xae && uint8[offset + 3] === 0x6b) {
        const tSizeInfo = this.readVint(uint8, offset + 4);
        const tracksOffset = offset + 4 + tSizeInfo.length;
        const tracksEnd = tracksOffset + tSizeInfo.val;
        if (this.processTracks(uint8, tracksOffset, tracksEnd)) stripped = true;
        offset = tracksEnd;
      } else {
        offset = this.skipVintElement(uint8, offset);
      }
    }
    return { stripped, offset };
  }

  // Returns the offset past the EBML header if uint8 at offset starts with one, else null.
  private static tryReadEbmlHeader(uint8: Uint8Array, offset: number): number | null {
    if (!(uint8[offset] === 0x1a && uint8[offset + 1] === 0x45 && uint8[offset + 2] === 0xdf && uint8[offset + 3] === 0xa3)) {
      return null;
    }
    const sizeInfo = this.readVint(uint8, offset + 4);
    return offset + 4 + sizeInfo.length + sizeInfo.val;
  }

  // Returns the processed Segment result if uint8 at offset starts with one, else null.
  private static tryProcessSegment(uint8: Uint8Array, offset: number): { stripped: boolean; offset: number } | null {
    if (!(uint8[offset] === 0x18 && uint8[offset + 1] === 0x53 && uint8[offset + 2] === 0x80 && uint8[offset + 3] === 0x67)) {
      return null;
    }
    const sizeInfo = this.readVint(uint8, offset + 4);
    const segStart = offset + 4 + sizeInfo.length;
    const segEnd = sizeInfo.val === -1 ? uint8.length : segStart + sizeInfo.val;
    return this.processSegment(uint8, segStart, segEnd);
  }

  private static stripWebm(uint8: Uint8Array): boolean {
    let offset = 0;
    let stripped = false;

    while (offset < uint8.length) {
      if (offset + 3 >= uint8.length) break;

      const ebmlEnd = this.tryReadEbmlHeader(uint8, offset);
      if (ebmlEnd !== null) {
        offset = ebmlEnd;
        continue;
      }

      const result = this.tryProcessSegment(uint8, offset);
      if (!result) break;
      if (result.stripped) stripped = true;
      offset = result.offset;
    }
    return stripped;
  }
}
