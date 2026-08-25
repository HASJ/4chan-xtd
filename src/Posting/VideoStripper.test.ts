import { describe, expect, it } from 'vitest';
import { VideoStripper } from './VideoStripper';

// --- EBML / WebM Test Helpers ---

function vint(val: number): Uint8Array {
  if (val < 0x80) {
    return new Uint8Array([0x80 | val]);
  } else if (val < 0x4000) {
    return new Uint8Array([0x40 | (val >> 8), val & 0xff]);
  } else if (val < 0x200000) {
    return new Uint8Array([0x20 | (val >> 16), (val >> 8) & 0xff, val & 0xff]);
  } else {
    return new Uint8Array([
      0x10 | (val >> 24),
      (val >> 16) & 0xff,
      (val >> 8) & 0xff,
      val & 0xff,
    ]);
  }
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

function ebmlElement(idBytes: Uint8Array, data: Uint8Array): Uint8Array {
  return concat(idBytes, vint(data.length), data);
}

function createSimpleBlock(trackNumber: number, payload: Uint8Array): Uint8Array {
  // SimpleBlock: ID 0xA3, trackNumber (vint), timecode (2 bytes), flags (1 byte), payload
  const blockData = concat(vint(trackNumber), new Uint8Array([0x00, 0x00, 0x80]), payload);
  return ebmlElement(new Uint8Array([0xa3]), blockData);
}

function createBlockGroup(trackNumber: number, payload: Uint8Array): Uint8Array {
  // BlockGroup: ID 0xA0, containing Block: ID 0xA1
  const blockData = concat(vint(trackNumber), new Uint8Array([0x00, 0x00, 0x80]), payload);
  const blockEl = ebmlElement(new Uint8Array([0xa1]), blockData);
  return ebmlElement(new Uint8Array([0xa0]), blockEl);
}

function createWebm(
  tracks: Array<{ number: number; type: number }>,
  clusters: Uint8Array[][] = []
): Uint8Array {
  // EBML Header (0x1A45DFA3)
  const ebmlHeader = ebmlElement(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]), new Uint8Array(0));

  // Track entries
  const trackEntries: Uint8Array[] = [];
  for (const t of tracks) {
    const trackNumEl = ebmlElement(new Uint8Array([0xd7]), new Uint8Array([t.number]));
    const trackTypeEl = ebmlElement(new Uint8Array([0x83]), new Uint8Array([t.type]));
    const trackEntryEl = ebmlElement(new Uint8Array([0xae]), concat(trackNumEl, trackTypeEl));
    trackEntries.push(trackEntryEl);
  }

  // Tracks: ID 0x1654AE6B
  const tracksEl = ebmlElement(new Uint8Array([0x16, 0x54, 0xae, 0x6b]), concat(...trackEntries));

  // Clusters: ID 0x1F43B675
  const clusterEls: Uint8Array[] = [];
  for (const blocks of clusters) {
    const timecodeEl = ebmlElement(new Uint8Array([0xe7]), new Uint8Array([0x00]));
    const clusterEl = ebmlElement(new Uint8Array([0x1f, 0x43, 0xb6, 0x75]), concat(timecodeEl, ...blocks));
    clusterEls.push(clusterEl);
  }

  // Segment: ID 0x18538067
  const segmentEl = ebmlElement(new Uint8Array([0x18, 0x53, 0x80, 0x67]), concat(tracksEl, ...clusterEls));

  return concat(ebmlHeader, segmentEl);
}

// --- MP4 Test Helpers ---

function mp4Box(type: string, data: Uint8Array): Uint8Array {
  const size = 8 + data.length;
  const header = new Uint8Array(8);
  const view = new DataView(header.buffer);
  view.setUint32(0, size, false);
  for (let i = 0; i < 4; i++) {
    header[4 + i] = type.charCodeAt(i);
  }
  return concat(header, data);
}

function createMp4Hdlr(handlerType: string): Uint8Array {
  // hdlr box: 4 bytes version/flags, 4 bytes pre_defined, 4 bytes handler_type
  const payload = new Uint8Array(16);
  for (let i = 0; i < 4; i++) {
    payload[8 + i] = handlerType.charCodeAt(i);
  }
  return mp4Box('hdlr', payload);
}

function createMp4(handlerTypes: string[]): Uint8Array {
  const ftyp = mp4Box('ftyp', new Uint8Array(8));
  const traks: Uint8Array[] = [];

  for (const ht of handlerTypes) {
    const hdlr = createMp4Hdlr(ht);
    const mdia = mp4Box('mdia', hdlr);
    const trak = mp4Box('trak', mdia);
    traks.push(trak);
  }

  const moov = mp4Box('moov', concat(...traks));
  return concat(ftyp, moov);
}

describe('VideoStripper', () => {
  describe('WebM audio stripping', () => {
    it('strips audio TrackEntry and audio cluster blocks from WebM', async () => {
      // Track 1 = video, Track 2 = audio
      const tracks = [
        { number: 1, type: 1 },
        { number: 2, type: 2 },
      ];
      // Cluster with video SimpleBlock, audio SimpleBlock, and audio BlockGroup
      const videoBlock = createSimpleBlock(1, new Uint8Array([0xde, 0xad]));
      const audioBlock = createSimpleBlock(2, new Uint8Array([0xbe, 0xef]));
      const audioBlockGroup = createBlockGroup(2, new Uint8Array([0xca, 0xfe]));

      const webmBytes = createWebm(tracks, [[videoBlock, audioBlock, audioBlockGroup]]);
      const file = new File([webmBytes], 'test.webm', { type: 'video/webm' });

      const stripped = await VideoStripper.stripAudio(file);
      expect(stripped).not.toBe(file);

      const buffer = new Uint8Array(await stripped.arrayBuffer());

      // Track 1 (video 0xAE) preserved
      let hasVideoTrack = false;
      let hasVoidTrack = false;
      let hasVideoBlock = false;
      let hasVoidBlock = false;

      for (let i = 0; i < buffer.length - 6; i++) {
        // TrackEntry: 0xAE, size 0x86, 0xD7 0x81 0x01 (TrackNumber 1), 0x83 0x81 0x01 (TrackType 1)
        if (buffer[i] === 0xae && buffer[i + 2] === 0xd7 && buffer[i + 4] === 0x01 && buffer[i + 5] === 0x83 && buffer[i + 7] === 0x01) {
          hasVideoTrack = true;
        }
        // Audio TrackEntry converted to 0xEC (Void)
        if (buffer[i] === 0xec && buffer[i + 2] === 0xd7 && buffer[i + 4] === 0x02 && buffer[i + 5] === 0x83 && buffer[i + 7] === 0x02) {
          hasVoidTrack = true;
        }
        // Video SimpleBlock (0xA3) with payload 0xDE 0xAD
        if (buffer[i] === 0xa3 && buffer[i + 6] === 0xde && buffer[i + 7] === 0xad) {
          hasVideoBlock = true;
        }
        // Audio SimpleBlock converted to 0xEC (Void) with payload 0xBE 0xEF
        if (buffer[i] === 0xec && buffer[i + 6] === 0xbe && buffer[i + 7] === 0xef) {
          hasVoidBlock = true;
        }
      }

      expect(hasVideoTrack).toBe(true);
      expect(hasVoidTrack).toBe(true);
      expect(hasVideoBlock).toBe(true);
      expect(hasVoidBlock).toBe(true);
    });

    it('leaves video-only WebM untouched', async () => {
      const tracks = [{ number: 1, type: 1 }];
      const videoBlock = createSimpleBlock(1, new Uint8Array([0xde, 0xad]));
      const webmBytes = createWebm(tracks, [[videoBlock]]);
      const file = new File([webmBytes], 'test.webm', { type: 'video/webm' });

      const result = await VideoStripper.stripAudio(file);
      expect(result).toBe(file);
    });

    it('handles uppercase file extension (.WEBM)', async () => {
      const tracks = [
        { number: 1, type: 1 },
        { number: 2, type: 2 },
      ];
      const webmBytes = createWebm(tracks);
      const file = new File([webmBytes], 'TEST.WEBM', { type: '' });

      const stripped = await VideoStripper.stripAudio(file);
      expect(stripped).not.toBe(file);
    });
  });

  describe('MP4 audio stripping', () => {
    it('strips audio tracks from MP4 with video and audio', async () => {
      const mp4Bytes = createMp4(['vide', 'soun']);
      const file = new File([mp4Bytes], 'test.mp4', { type: 'video/mp4' });

      const stripped = await VideoStripper.stripAudio(file);
      expect(stripped).not.toBe(file);

      const buffer = new Uint8Array(await stripped.arrayBuffer());
      const text = new TextDecoder('latin1').decode(buffer);

      // 'vide' trak should remain, 'soun' trak should be converted to 'free'
      expect(text).toContain('vide');
      expect(text).toContain('soun');
      expect(text).toContain('free');

      // The 'trak' preceding 'soun' should have been replaced with 'free'
      const moovIndex = text.indexOf('moov');
      const moovSection = text.slice(moovIndex);
      const trakMatches = moovSection.match(/trak/g);
      const freeMatches = moovSection.match(/free/g);

      expect(trakMatches?.length).toBe(1); // Only 1 trak remaining (vide)
      expect(freeMatches?.length).toBe(1); // Audio trak converted to free
    });

    it('leaves video-only MP4 untouched', async () => {
      const mp4Bytes = createMp4(['vide']);
      const file = new File([mp4Bytes], 'test.mp4', { type: 'video/mp4' });

      const result = await VideoStripper.stripAudio(file);
      expect(result).toBe(file);
    });

    it('handles uppercase file extension (.MP4)', async () => {
      const mp4Bytes = createMp4(['vide', 'soun']);
      const file = new File([mp4Bytes], 'SAMPLE.MP4', { type: '' });

      const stripped = await VideoStripper.stripAudio(file);
      expect(stripped).not.toBe(file);
    });
  });

  describe('Non-video files', () => {
    it('leaves image files untouched', async () => {
      const imgBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const file = new File([imgBytes], 'image.png', { type: 'image/png' });

      const result = await VideoStripper.stripAudio(file);
      expect(result).toBe(file);
    });
  });
});
