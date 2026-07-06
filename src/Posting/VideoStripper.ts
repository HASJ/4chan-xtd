/**
 * Lightweight, zero-dependency video container patchers to remove audio tracks.
 * Modifies the underlying ArrayBuffer in-place.
 */

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
        patched = this.stripWebm(uint8, dataView);
      }

      if (patched) {
        return new File([buffer], file.name, { type: file.type });
      }
    } catch (e) {
      console.warn('Failed to strip audio from video:', e);
    }
    return file; // If parsing fails or audio not found, return original file
  }

  private static stripMp4(uint8: Uint8Array, view: DataView): boolean {
    let offset = 0;
    let stripped = false;
    const utf8Decoder = new TextDecoder('utf8');

    while (offset < uint8.length) {
      if (offset + 8 > uint8.length) break;
      let size = view.getUint32(offset, false);
      let boxOffset = offset;
      
      if (size === 1) {
        if (offset + 16 > uint8.length) break;
        // 64-bit size, we only read the lower 32 bits since MP4 files on 4chan aren't that huge
        size = view.getUint32(offset + 12, false);
        boxOffset += 8;
      }
      
      if (size === 0) {
        // Box extends to end of file
        size = uint8.length - offset;
      }

      const type = utf8Decoder.decode(uint8.subarray(boxOffset + 4, boxOffset + 8));
      
      if (type === 'moov') {
        let moovOffset = boxOffset + 8;
        let moovEnd = offset + size;
        
        while (moovOffset < moovEnd) {
          if (moovOffset + 8 > moovEnd) break;
          let boxSize = view.getUint32(moovOffset, false);
          if (boxSize === 0) boxSize = moovEnd - moovOffset;
          
          let boxType = utf8Decoder.decode(uint8.subarray(moovOffset + 4, moovOffset + 8));
          if (boxType === 'trak') {
            let isAudio = false;
            let trakOffset = moovOffset + 8;
            let trakEnd = moovOffset + boxSize;
            
            while (trakOffset < trakEnd) {
              if (trakOffset + 8 > trakEnd) break;
              let tBoxSize = view.getUint32(trakOffset, false);
              if (tBoxSize === 0) tBoxSize = trakEnd - trakOffset;
              
              let tBoxType = utf8Decoder.decode(uint8.subarray(trakOffset + 4, trakOffset + 8));
              if (tBoxType === 'mdia') {
                let mdiaOffset = trakOffset + 8;
                let mdiaEnd = trakOffset + tBoxSize;
                
                while (mdiaOffset < mdiaEnd) {
                  if (mdiaOffset + 8 > mdiaEnd) break;
                  let mBoxSize = view.getUint32(mdiaOffset, false);
                  if (mBoxSize === 0) mBoxSize = mdiaEnd - mdiaOffset;
                  
                  let mBoxType = utf8Decoder.decode(uint8.subarray(mdiaOffset + 4, mdiaOffset + 8));
                  if (mBoxType === 'hdlr') {
                    if (mdiaOffset + 20 <= mdiaEnd) {
                      let handlerType = utf8Decoder.decode(uint8.subarray(mdiaOffset + 16, mdiaOffset + 20));
                      if (handlerType === 'soun') {
                        isAudio = true;
                      }
                    }
                  }
                  mdiaOffset += mBoxSize;
                }
              }
              trakOffset += tBoxSize;
            }
            if (isAudio) {
              // Overwrite 'trak' with 'free'
              uint8[moovOffset + 4] = 0x66; // 'f'
              uint8[moovOffset + 5] = 0x72; // 'r'
              uint8[moovOffset + 6] = 0x65; // 'e'
              uint8[moovOffset + 7] = 0x65; // 'e'
              stripped = true;
            }
          }
          moovOffset += boxSize;
        }
      }
      offset += size;
    }
    return stripped;
  }

  private static stripWebm(uint8: Uint8Array, view: DataView): boolean {
    let offset = 0;
    let stripped = false;
    
    function readVint(off: number) {
      if (off >= uint8.length) return { val: 0, length: 1 };
      let byte = uint8[off];
      let mask = 0x80;
      let length = 1;
      while (!(byte & mask) && length < 8) {
        mask >>= 1;
        length++;
      }
      let val = byte & ~mask;
      for (let i = 1; i < length; i++) {
        if (off + i >= uint8.length) break;
        val = (val << 8) | uint8[off + i];
      }
      // Handle unknown size
      if (length === 8 && val === 0xFFFFFFFFFFFFFF) val = -1;
      return { val, length };
    }

    while (offset < uint8.length) {
      if (offset + 3 >= uint8.length) break;
      // EBML header
      if (uint8[offset] === 0x1A && uint8[offset+1] === 0x45 && uint8[offset+2] === 0xDF && uint8[offset+3] === 0xA3) {
        let sizeInfo = readVint(offset + 4);
        offset += 4 + sizeInfo.length + sizeInfo.val;
        continue;
      }
      // Segment
      if (uint8[offset] === 0x18 && uint8[offset+1] === 0x53 && uint8[offset+2] === 0x80 && uint8[offset+3] === 0x67) {
        let sizeInfo = readVint(offset + 4);
        offset += 4 + sizeInfo.length;
        let segEnd = sizeInfo.val === -1 ? uint8.length : offset + sizeInfo.val;
        
        while (offset < segEnd) {
          if (offset + 3 >= uint8.length) break;
          // Tracks
          if (uint8[offset] === 0x16 && uint8[offset+1] === 0x54 && uint8[offset+2] === 0xAE && uint8[offset+3] === 0x6B) {
            let tSizeInfo = readVint(offset + 4);
            let tracksOffset = offset + 4 + tSizeInfo.length;
            let tracksEnd = tracksOffset + tSizeInfo.val;
            
            while (tracksOffset < tracksEnd) {
              if (tracksOffset >= uint8.length) break;
              if (uint8[tracksOffset] === 0xAE) { // TrackEntry
                let entryStart = tracksOffset;
                let entrySizeInfo = readVint(tracksOffset + 1);
                let entryDataOffset = tracksOffset + 1 + entrySizeInfo.length;
                let entryEnd = entryDataOffset + entrySizeInfo.val;
                
                let isAudio = false;
                let curr = entryDataOffset;
                while (curr < entryEnd) {
                  if (curr >= uint8.length) break;
                  if (uint8[curr] === 0x83) { // TrackType
                    let typeSizeInfo = readVint(curr + 1);
                    let typeValInfo = readVint(curr + 1 + typeSizeInfo.length);
                    if (typeValInfo.val === 2) isAudio = true; // Audio
                    curr += 1 + typeSizeInfo.length + typeSizeInfo.val;
                  } else {
                    // Variable length ID
                    let idLength = 1;
                    while (!(uint8[curr] & (0x80 >> (idLength - 1))) && idLength < 8) idLength++;
                    let eSizeInfo = readVint(curr + idLength);
                    curr += idLength + eSizeInfo.length + eSizeInfo.val;
                  }
                }
                if (isAudio) {
                  // Overwrite 'TrackEntry' (AE) with 'Void' (EC)
                  uint8[entryStart] = 0xEC;
                  stripped = true;
                }
                tracksOffset = entryEnd;
              } else {
                let idLength = 1;
                while (!(uint8[tracksOffset] & (0x80 >> (idLength - 1))) && idLength < 8) idLength++;
                let teSizeInfo = readVint(tracksOffset + idLength);
                tracksOffset += idLength + teSizeInfo.length + teSizeInfo.val;
              }
            }
            offset = tracksEnd;
          } else {
            // Skip other segment elements
            let idLength = 1;
            while (!(uint8[offset] & (0x80 >> (idLength - 1))) && idLength < 8) idLength++;
            let eSizeInfo = readVint(offset + idLength);
            offset += idLength + eSizeInfo.length + eSizeInfo.val;
          }
        }
      } else {
        break;
      }
    }
    return stripped;
  }
}
