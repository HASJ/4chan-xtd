/**
 * Lightweight, zero-dependency video container patchers to remove audio tracks.
 * Modifies the underlying ArrayBuffer in-place.
 */

interface EbmlElement {
  id: number;
  idLength: number;
  dataOffset: number;
  dataSize: number;
  totalSize: number;
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
      const lowerName = file.name.toLowerCase();
      if (file.type === 'video/mp4' || lowerName.endsWith('.mp4')) {
        patched = this.stripMp4(uint8, dataView);
      } else if (file.type === 'video/webm' || lowerName.endsWith('.webm')) {
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

  private static readMp4BoxHeader(
    uint8: Uint8Array,
    view: DataView,
    offset: number
  ): { size: number; headerSize: number } | null {
    if (offset + 8 > uint8.length) return null;
    let size = view.getUint32(offset, false);
    let headerSize = 8;

    if (size === 1) {
      if (offset + 16 > uint8.length) return null;
      // 64-bit size, lower 32 bits since MP4 files on 4chan aren't that huge
      size = view.getUint32(offset + 12, false);
      headerSize = 16;
    } else if (size === 0) {
      // Box extends to end of file
      size = uint8.length - offset;
    }

    if (size < headerSize) return null;
    return { size, headerSize };
  }

  private static minfHasSoundHeader(
    uint8: Uint8Array,
    view: DataView,
    minfOffset: number,
    minfEnd: number,
    decoder: TextDecoder
  ): boolean {
    let offset = minfOffset;
    while (offset < minfEnd) {
      const header = this.readMp4BoxHeader(uint8, view, offset);
      if (!header) break;
      const { size } = header;
      if (offset + size > minfEnd) break;

      const boxType = decoder.decode(uint8.subarray(offset + 4, offset + 8));
      if (boxType === 'smhd') return true;
      offset += size;
    }
    return false;
  }

  private static mdiaHasAudioHandler(
    uint8: Uint8Array,
    view: DataView,
    mdiaOffset: number,
    mdiaEnd: number,
    decoder: TextDecoder
  ): boolean {
    let offset = mdiaOffset;
    while (offset < mdiaEnd) {
      const header = this.readMp4BoxHeader(uint8, view, offset);
      if (!header) break;
      const { size, headerSize } = header;
      if (offset + size > mdiaEnd) break;

      const boxType = decoder.decode(uint8.subarray(offset + 4, offset + 8));
      if (boxType === 'hdlr' && offset + 20 <= mdiaEnd) {
        const handlerType = decoder.decode(uint8.subarray(offset + 16, offset + 20));
        if (handlerType === 'soun') return true;
      } else if (boxType === 'minf' && this.minfHasSoundHeader(uint8, view, offset + headerSize, offset + size, decoder)) {
        return true;
      }
      offset += size;
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
    let offset = trakOffset;
    while (offset < trakEnd) {
      const header = this.readMp4BoxHeader(uint8, view, offset);
      if (!header) break;
      const { size, headerSize } = header;
      if (offset + size > trakEnd) break;

      const boxType = decoder.decode(uint8.subarray(offset + 4, offset + 8));
      if (boxType === 'mdia' && this.mdiaHasAudioHandler(uint8, view, offset + headerSize, offset + size, decoder)) {
        return true;
      }
      offset += size;
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
    let offset = moovOffset;
    while (offset < moovEnd) {
      const header = this.readMp4BoxHeader(uint8, view, offset);
      if (!header) break;
      const { size, headerSize } = header;
      if (offset + size > moovEnd) break;

      const boxType = decoder.decode(uint8.subarray(offset + 4, offset + 8));
      if (boxType === 'trak' && this.isAudioTrak(uint8, view, offset + headerSize, offset + size, decoder)) {
        // Overwrite 'trak' with 'free'
        uint8[offset + 4] = 0x66; // 'f'
        uint8[offset + 5] = 0x72; // 'r'
        uint8[offset + 6] = 0x65; // 'e'
        uint8[offset + 7] = 0x65; // 'e'
        stripped = true;
      }
      offset += size;
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
      const { size, headerSize } = header;

      const type = decoder.decode(uint8.subarray(offset + 4, offset + 8));
      if (type === 'moov' && this.stripAudioTraks(uint8, view, offset + headerSize, offset + size, decoder)) {
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
    if (byte === 0) return { val: 0, length: 1 };
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
      val = (val * 256) + next;
    }
    // Handle unknown size (all data bits across the vint are 1)
    if (allOnes) val = -1;
    return { val, length };
  }

  private static readUint(uint8: Uint8Array, offset: number, size: number): number {
    let val = 0;
    for (let i = 0; i < size; i++) {
      if (offset + i >= uint8.length) break;
      val = (val * 256) + uint8[offset + i];
    }
    return val;
  }

  private static readEbmlElement(uint8: Uint8Array, offset: number, end: number): EbmlElement | null {
    if (offset >= end || offset >= uint8.length) return null;
    const firstByte = uint8[offset];
    if (firstByte === 0) return null;

    let mask = 0x80;
    let idLength = 1;
    while (!(firstByte & mask) && idLength < 8) {
      mask >>= 1;
      idLength++;
    }

    if (offset + idLength > end || offset + idLength > uint8.length) return null;

    let id = 0;
    for (let i = 0; i < idLength; i++) {
      id = (id * 256) + uint8[offset + i];
    }

    const sizeInfo = this.readVint(uint8, offset + idLength);
    const dataOffset = offset + idLength + sizeInfo.length;
    if (dataOffset > end && sizeInfo.val !== -1) return null;

    const dataSize = sizeInfo.val;
    const totalSize = dataSize === -1 ? (end - offset) : (idLength + sizeInfo.length + dataSize);

    return { id, idLength, dataOffset, dataSize, totalSize };
  }

  private static parseTrackEntry(
    uint8: Uint8Array,
    entryOffset: number,
    entryEnd: number
  ): { trackNumber: number; trackType: number } {
    let curr = entryOffset;
    let trackNumber = 1;
    let trackType = 0;

    while (curr < entryEnd) {
      const el = this.readEbmlElement(uint8, curr, entryEnd);
      if (!el || el.totalSize <= 0) break;
      if (el.id === 0xd7) { // TrackNumber
        trackNumber = this.readUint(uint8, el.dataOffset, el.dataSize);
      } else if (el.id === 0x83) { // TrackType
        trackType = this.readUint(uint8, el.dataOffset, el.dataSize);
      }
      curr += el.totalSize;
    }
    return { trackNumber, trackType };
  }

  private static findAudioTracks(
    uint8: Uint8Array,
    tracksOffset: number,
    tracksEnd: number,
    audioTrackNumbers: Set<number>
  ): void {
    let curr = tracksOffset;
    while (curr < tracksEnd) {
      const el = this.readEbmlElement(uint8, curr, tracksEnd);
      if (!el || el.totalSize <= 0) break;
      if (el.id === 0xae) { // TrackEntry
        const entryEnd = el.dataSize === -1 ? tracksEnd : el.dataOffset + el.dataSize;
        const { trackNumber, trackType } = this.parseTrackEntry(uint8, el.dataOffset, entryEnd);
        if (trackType === 2) { // 2 = Audio
          audioTrackNumbers.add(trackNumber);
          // Overwrite 'TrackEntry' (0xAE) with 'Void' (0xEC)
          uint8[curr] = 0xec;
        }
      }
      curr += el.totalSize;
    }
  }

  private static isAudioBlockGroup(
    uint8: Uint8Array,
    groupStart: number,
    groupEnd: number,
    audioTrackNumbers: Set<number>
  ): boolean {
    let curr = groupStart;
    while (curr < groupEnd) {
      const el = this.readEbmlElement(uint8, curr, groupEnd);
      if (!el || el.totalSize <= 0) break;
      if (el.id === 0xa1) { // Block
        const tn = this.readVint(uint8, el.dataOffset);
        if (audioTrackNumbers.has(tn.val)) return true;
      }
      curr += el.totalSize;
    }
    return false;
  }

  private static processCluster(
    uint8: Uint8Array,
    clusterStart: number,
    clusterEnd: number,
    audioTrackNumbers: Set<number>
  ): void {
    let curr = clusterStart;
    while (curr < clusterEnd) {
      const el = this.readEbmlElement(uint8, curr, clusterEnd);
      if (!el || el.totalSize <= 0) break;

      if (el.id === 0xa3) { // SimpleBlock
        const tn = this.readVint(uint8, el.dataOffset);
        if (audioTrackNumbers.has(tn.val)) {
          uint8[curr] = 0xec; // Overwrite 'SimpleBlock' (0xA3) with 'Void' (0xEC)
        }
      } else if (el.id === 0xa0) { // BlockGroup
        const groupEnd = el.dataSize === -1 ? clusterEnd : el.dataOffset + el.dataSize;
        if (this.isAudioBlockGroup(uint8, el.dataOffset, groupEnd, audioTrackNumbers)) {
          uint8[curr] = 0xec; // Overwrite 'BlockGroup' (0xA0) with 'Void' (0xEC)
        }
      }
      curr += el.totalSize;
    }
  }

  private static isAudioCueTrackPositions(
    uint8: Uint8Array,
    posStart: number,
    posEnd: number,
    audioTrackNumbers: Set<number>
  ): boolean {
    let curr = posStart;
    while (curr < posEnd) {
      const el = this.readEbmlElement(uint8, curr, posEnd);
      if (!el || el.totalSize <= 0) break;
      if (el.id === 0xf7) { // CueTrack
        const trackNum = this.readUint(uint8, el.dataOffset, el.dataSize);
        if (audioTrackNumbers.has(trackNum)) return true;
      }
      curr += el.totalSize;
    }
    return false;
  }

  private static processCuePoint(
    uint8: Uint8Array,
    pointStart: number,
    pointEnd: number,
    audioTrackNumbers: Set<number>
  ): void {
    let curr = pointStart;
    while (curr < pointEnd) {
      const el = this.readEbmlElement(uint8, curr, pointEnd);
      if (!el || el.totalSize <= 0) break;
      if (el.id === 0xb7) { // CueTrackPositions
        const posEnd = el.dataSize === -1 ? pointEnd : el.dataOffset + el.dataSize;
        if (this.isAudioCueTrackPositions(uint8, el.dataOffset, posEnd, audioTrackNumbers)) {
          uint8[curr] = 0xec; // Overwrite 'CueTrackPositions' (0xB7) with 'Void' (0xEC)
        }
      }
      curr += el.totalSize;
    }
  }

  private static processCues(
    uint8: Uint8Array,
    cuesStart: number,
    cuesEnd: number,
    audioTrackNumbers: Set<number>
  ): void {
    let curr = cuesStart;
    while (curr < cuesEnd) {
      const el = this.readEbmlElement(uint8, curr, cuesEnd);
      if (!el || el.totalSize <= 0) break;
      if (el.id === 0xbb) { // CuePoint
        const pointEnd = el.dataSize === -1 ? cuesEnd : el.dataOffset + el.dataSize;
        this.processCuePoint(uint8, el.dataOffset, pointEnd, audioTrackNumbers);
      }
      curr += el.totalSize;
    }
  }

  private static stripSegment(
    uint8: Uint8Array,
    segStart: number,
    segEnd: number,
    audioTrackNumbers: Set<number>
  ): void {
    let curr = segStart;
    while (curr < segEnd) {
      const el = this.readEbmlElement(uint8, curr, segEnd);
      if (!el || el.totalSize <= 0) break;

      if (el.id === 0x1f43b675) { // Cluster
        const clusterEnd = el.dataSize === -1 ? segEnd : el.dataOffset + el.dataSize;
        this.processCluster(uint8, el.dataOffset, clusterEnd, audioTrackNumbers);
      } else if (el.id === 0x1c53bb6b) { // Cues
        const cuesEnd = el.dataSize === -1 ? segEnd : el.dataOffset + el.dataSize;
        this.processCues(uint8, el.dataOffset, cuesEnd, audioTrackNumbers);
      }
      curr += el.totalSize;
    }
  }

  private static stripWebm(uint8: Uint8Array): boolean {
    const audioTrackNumbers = new Set<number>();
    let offset = 0;

    // Pass 1: Scan for Tracks and collect audio track numbers, converting audio TrackEntry to Void
    while (offset < uint8.length) {
      const el = this.readEbmlElement(uint8, offset, uint8.length);
      if (!el || el.totalSize <= 0) break;

      if (el.id === 0x18538067) { // Segment
        const segEnd = el.dataSize === -1 ? uint8.length : el.dataOffset + el.dataSize;
        let segCurr = el.dataOffset;
        while (segCurr < segEnd) {
          const childEl = this.readEbmlElement(uint8, segCurr, segEnd);
          if (!childEl || childEl.totalSize <= 0) break;
          if (childEl.id === 0x1654ae6b) { // Tracks
            const tracksEnd = childEl.dataSize === -1 ? segEnd : childEl.dataOffset + childEl.dataSize;
            this.findAudioTracks(uint8, childEl.dataOffset, tracksEnd, audioTrackNumbers);
          }
          segCurr += childEl.totalSize;
        }
      }
      offset += el.totalSize;
    }

    if (audioTrackNumbers.size === 0) {
      return false; // No audio tracks found
    }

    // Pass 2: Void audio SimpleBlocks/BlockGroups in Clusters and audio CueTrackPositions in Cues
    offset = 0;
    while (offset < uint8.length) {
      const el = this.readEbmlElement(uint8, offset, uint8.length);
      if (!el || el.totalSize <= 0) break;

      if (el.id === 0x18538067) { // Segment
        const segEnd = el.dataSize === -1 ? uint8.length : el.dataOffset + el.dataSize;
        this.stripSegment(uint8, el.dataOffset, segEnd, audioTrackNumbers);
      }
      offset += el.totalSize;
    }

    return true;
  }
}
