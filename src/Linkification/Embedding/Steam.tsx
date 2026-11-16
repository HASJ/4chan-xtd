import $ from '../../platform/$';
import Icon from '../../Icons/icon';
import h, { type EscapedHtml, hFragment } from '../../globals/jsx';
import CrossOrigin from '../../platform/CrossOrigin';

interface SteamMovie {
  id?: number;
  name?: string;
  thumbnail?: string;
  webm?: { 480?: string; max?: string };
  mp4?: { 480?: string; max?: string };
  hls_h264?: string;
  dash_h264?: string;
  dash_av1?: string;
}

interface SteamScreenshot {
  id?: number;
  path_thumbnail?: string;
  path_full?: string;
}

interface SteamAppData {
  name?: string;
  short_description?: string;
  header_image?: string;
  release_date?: { coming_soon?: boolean; date?: string };
  developers?: string[];
  publishers?: string[];
  movies?: SteamMovie[];
  screenshots?: SteamScreenshot[];
}

interface MediaItem {
  type: 'video' | 'screenshot';
  title: string;
  thumb: string;
  url: string;
  isHls?: boolean;
}

const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

function decodeEntities(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|#39|apos);/g, m => ENTITY_MAP[m] ?? m);
}

/**
 * Detect a 2-letter country code from the browser's language tag (e.g. `pt-BR` -> `BR`).
 * Falls back to `US` when no region subtag is present.
 */
export function detectCountryCode(lang?: string): string {
  const tag = lang ?? (typeof navigator !== 'undefined' ? (navigator.languages?.[0] || navigator.language || '') : '');
  const parts = tag.split(/[-_]/);
  for (let i = 1; i < parts.length; i++) {
    if (/^[a-zA-Z]{2}$/.test(parts[i])) {
      return parts[i].toUpperCase();
    }
  }
  return 'US';
}

function buildMediaItems(data: SteamAppData): MediaItem[] {
  const items: MediaItem[] = [];

  for (const movie of data.movies ?? []) {
    const directUrl = movie.mp4?.max || movie.mp4?.['480'] || movie.webm?.max || movie.webm?.['480'];
    const hlsUrl = movie.hls_h264;
    const url = directUrl || hlsUrl;
    if (!url) continue;
    items.push({
      type: 'video',
      title: movie.name || 'Trailer',
      thumb: movie.thumbnail || '',
      url,
      isHls: !directUrl && Boolean(hlsUrl),
    });
  }

  for (const [idx, ss] of (data.screenshots ?? []).entries()) {
    const url = ss.path_full || ss.path_thumbnail;
    if (!url) continue;
    items.push({
      type: 'screenshot',
      title: `Screenshot ${idx + 1}`,
      thumb: ss.path_thumbnail || url,
      url,
    });
  }

  return items;
}

async function fetchText(url: string): Promise<string> {
  const req = await CrossOrigin.ajaxPromise(url, { responseType: 'text' });
  if (!req || !req.status || req.status >= 400 || typeof req.response !== 'string') {
    throw new Error(`HTTP ${req?.status || 0} for ${url}`);
  }
  return req.response;
}

function fetchBinary(url: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    CrossOrigin.binary(url, (data: Uint8Array | null) => {
      if (!data) {
        reject(new Error(`Failed to fetch binary ${url}`));
      } else {
        resolve(data);
      }
    });
  });
}

function parseAttributes(line: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of line.matchAll(/([A-Z0-9-]+)=("([^"]*)"|([^,]*))/g)) {
    attrs[match[1]] = match[3] ?? match[4] ?? '';
  }
  return attrs;
}

function parseMediaPlaylist(text: string, baseUrl: string): string[] {
  const segments: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#EXT-X-MAP:')) {
      const attrs = parseAttributes(line);
      if (attrs.URI) segments.push(new URL(attrs.URI, baseUrl).href);
    } else if (!line.startsWith('#')) {
      segments.push(new URL(line, baseUrl).href);
    }
  }
  return segments;
}

function parseMasterPlaylist(text: string, masterUrl: string): {
  videoUrl: string;
  audioUrl?: string;
  videoCodec: string;
  audioCodec: string;
} {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let audioUri: string | undefined;
  let bestBandwidth = -1;
  let bestVideoUri = '';
  let bestCodecs = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXT-X-MEDIA:') && line.includes('TYPE=AUDIO')) {
      const attrs = parseAttributes(line);
      if (attrs.URI && (!audioUri || attrs.DEFAULT === 'YES')) {
        audioUri = attrs.URI;
      }
    } else if (line.startsWith('#EXT-X-STREAM-INF:')) {
      const attrs = parseAttributes(line);
      const next = lines[i + 1];
      if (!next || next.startsWith('#')) continue;
      const bw = Number(attrs.BANDWIDTH || 0);
      if (bw > bestBandwidth) {
        bestBandwidth = bw;
        bestVideoUri = next;
        bestCodecs = attrs.CODECS || '';
      }
    }
  }

  if (!bestVideoUri) {
    throw new Error('No video stream found in HLS master playlist');
  }

  const codecList = bestCodecs.split(',').map(c => c.trim()).filter(Boolean);
  const videoCodec = codecList.find(c => !c.startsWith('mp4a')) || 'avc1.640029';
  const audioCodec = codecList.find(c => c.startsWith('mp4a')) || 'mp4a.40.2';

  return {
    videoUrl: new URL(bestVideoUri, masterUrl).href,
    audioUrl: audioUri ? new URL(audioUri, masterUrl).href : undefined,
    videoCodec,
    audioCodec,
  };
}

function appendSegment(sb: SourceBuffer, data: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    const onEnd = () => {
      sb.removeEventListener('updateend', onEnd);
      sb.removeEventListener('error', onErr);
      resolve();
    };
    const onErr = () => {
      sb.removeEventListener('updateend', onEnd);
      sb.removeEventListener('error', onErr);
      reject(new Error('SourceBuffer append error'));
    };
    sb.addEventListener('updateend', onEnd);
    sb.addEventListener('error', onErr);
    sb.appendBuffer(data as unknown as BufferSource);
  });
}

async function pumpTrack(sb: SourceBuffer, urls: string[], signal: AbortSignal): Promise<void> {
  for (const url of urls) {
    if (signal.aborted) return;
    const data = await fetchBinary(url);
    if (signal.aborted) return;
    await appendSegment(sb, data);
  }
}

async function playHlsWithMse(masterUrl: string, video: HTMLVideoElement, signal: AbortSignal): Promise<void> {
  const masterText = await fetchText(masterUrl);
  if (signal.aborted) return;

  const { videoUrl, audioUrl, videoCodec, audioCodec } = parseMasterPlaylist(masterText, masterUrl);
  const [videoPlaylist, audioPlaylist] = await Promise.all([
    fetchText(videoUrl),
    audioUrl ? fetchText(audioUrl) : Promise.resolve(''),
  ]);
  if (signal.aborted) return;

  const videoSegments = parseMediaPlaylist(videoPlaylist, videoUrl);
  const audioSegments = audioUrl ? parseMediaPlaylist(audioPlaylist, audioUrl) : [];

  const ms = new MediaSource();
  const objectUrl = URL.createObjectURL(ms);
  video.src = objectUrl;

  const cleanup = () => URL.revokeObjectURL(objectUrl);
  signal.addEventListener('abort', cleanup, { once: true });

  await new Promise<void>(resolve => {
    ms.addEventListener('sourceopen', () => resolve(), { once: true });
  });
  if (signal.aborted) return;

  const videoSb = ms.addSourceBuffer(`video/mp4; codecs="${videoCodec}"`);
  const tasks: Promise<void>[] = [pumpTrack(videoSb, videoSegments, signal)];

  if (audioSegments.length > 0) {
    const audioSb = ms.addSourceBuffer(`audio/mp4; codecs="${audioCodec}"`);
    tasks.push(pumpTrack(audioSb, audioSegments, signal));
  }

  await Promise.all(tasks);
  if (!signal.aborted && ms.readyState === 'open') {
    ms.endOfStream();
  }
}

function renderStageContent(item: MediaItem): EscapedHtml {
  if (item.type === 'video') {
    return (
      <div class="steam-video-preview">
        {item.thumb
          ? <img class="steam-stage-img" src={item.thumb} alt={item.title} referrerpolicy="no-referrer" />
          : ''}
        <button type="button" class="steam-play-btn" aria-label={`Play ${item.title}`} title={`Play ${item.title}`}>
          &#9654;
        </button>
        <div class="steam-video-label">{item.title}</div>
      </div>
    );
  }

  return <a class="steam-stage-link" href={item.url} target="_blank" referrerpolicy="no-referrer" title={item.title}>
    <img class="steam-stage-img" src={item.url} alt={item.title} referrerpolicy="no-referrer" />
  </a>;
}

/**
 * Render an interactive Steam Store embed card for a linkified Steam app URL.
 */
export default function EmbedSteam(a: HTMLAnchorElement): HTMLElement {
  const appid = a.dataset.uid || '';
  const storeUrl = a.dataset.href || `https://store.steampowered.com/app/${appid}/`;
  const el = $.el('div', { className: 'steam-embed' });
  el.innerHTML = '<div class="steam-card steam-loading">Loading Steam app&hellip;</div>';

  const cc = detectCountryCode();
  const apiUrl = `https://store.steampowered.com/api/appdetails?appids=${encodeURIComponent(appid)}&cc=${encodeURIComponent(cc)}&l=english`;

  CrossOrigin.cachePromise(apiUrl).then(req => {
    if (!req || !req.status || req.status >= 400) {
      el.innerHTML = (
        <div class="steam-card steam-error">
          Failed to load Steam app ({String(req?.status || 'network error')}).{' '}
          <a href={storeUrl} target="_blank" referrerpolicy="no-referrer">Open on Steam</a>
        </div>
      ).innerHTML;
      return;
    }

    const entry = req.response?.[appid];
    if (!entry?.success || !entry?.data) {
      el.innerHTML = (
        <div class="steam-card steam-error">
          Steam app not found.{' '}
          <a href={storeUrl} target="_blank" referrerpolicy="no-referrer">Open on Steam</a>
        </div>
      ).innerHTML;
      return;
    }

    const data: SteamAppData = entry.data;
    const title = decodeEntities(data.name || `Steam App ${appid}`);
    const description = data.short_description ? decodeEntities(data.short_description) : '';
    const releaseDate = data.release_date?.date || (data.release_date?.coming_soon ? 'Coming Soon' : 'Unknown');
    const developers = data.developers?.length ? data.developers.join(', ') : 'Unknown';
    const publishers = data.publishers?.length ? data.publishers.join(', ') : 'Unknown';
    const mediaItems = buildMediaItems(data);

    let selectedIndex = 0;
    let activeAbort: AbortController | null = null;

    const card = (
      <div class="steam-card">
        <div class="steam-header">
          <a class="steam-title" href={storeUrl} target="_blank" referrerpolicy="no-referrer">{title}</a>
          <a class="steam-store-link" href={storeUrl} title="Open on Steam" target="_blank" referrerpolicy="no-referrer">
            {Icon.raw('link')}
          </a>
        </div>
        <div class="steam-top">
          {data.header_image
            ? <img class="steam-capsule" src={data.header_image} alt={title} referrerpolicy="no-referrer" />
            : ''}
          <div class="steam-summary">
            {description ? <p class="steam-description">{description}</p> : ''}
            <dl class="steam-meta">
              <dt>Release Date</dt>
              <dd class="steam-release-date">{releaseDate}</dd>
              <dt>Developer</dt>
              <dd class="steam-developer">{developers}</dd>
              <dt>Publisher</dt>
              <dd class="steam-publisher">{publishers}</dd>
            </dl>
          </div>
        </div>
        {mediaItems.length > 0 ? (
          <div class="steam-gallery">
            <div class="steam-stage">
              <div class="steam-stage-content">{renderStageContent(mediaItems[0])}</div>
              {mediaItems.length > 1 ? (
                <>
                  <button type="button" class="steam-nav steam-nav-prev" aria-label="Previous media">&#8249;</button>
                  <button type="button" class="steam-nav steam-nav-next" aria-label="Next media">&#8250;</button>
                  <span class="steam-counter">1 / {mediaItems.length}</span>
                </>
              ) : ''}
            </div>
            <div class="steam-thumbs" role="tablist" aria-label="Videos and screenshots">
              {...mediaItems.map((item, idx) => (
                <button
                  type="button"
                  class={`steam-thumb ${idx === 0 ? 'active' : ''}`}
                  data-index={String(idx)}
                  title={item.title}
                  role="tab"
                  aria-selected={idx === 0 ? 'true' : 'false'}
                >
                  {item.thumb ? <img src={item.thumb} alt={item.title} referrerpolicy="no-referrer" /> : ''}
                  {item.type === 'video' ? <span class="steam-thumb-badge" aria-hidden="true">&#9654;</span> : ''}
                </button>
              ))}
            </div>
          </div>
        ) : ''}
      </div>
    );

    el.innerHTML = card.innerHTML;

    if (mediaItems.length > 0) {
      const stageContent = el.querySelector('.steam-stage-content') as HTMLElement | null;
      const counter = el.querySelector('.steam-counter') as HTMLElement | null;
      const thumbButtons = Array.from(el.querySelectorAll('.steam-thumb')) as HTMLButtonElement[];

      const bindPlayButton = (item: MediaItem) => {
        if (!stageContent || item.type !== 'video') return;
        const playBtn = stageContent.querySelector('.steam-play-btn') as HTMLButtonElement | null;
        if (!playBtn) return;

        $.on(playBtn, 'click', () => {
          activeAbort?.abort();
          activeAbort = new AbortController();
          const { signal } = activeAbort;

          const video = document.createElement('video');
          video.className = 'steam-stage-video';
          video.controls = true;
          video.autoplay = true;
          video.playsInline = true;
          video.setAttribute('referrerpolicy', 'no-referrer');
          if (item.thumb) video.poster = item.thumb;

          stageContent.innerHTML = '';
          stageContent.appendChild(video);

          if (!item.isHls || video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = item.url;
          } else if (typeof MediaSource !== 'undefined') {
            playHlsWithMse(item.url, video, signal).catch(err => {
              if (!signal.aborted) {
                console.warn('Steam HLS playback failed:', err);
              }
            });
          }
        });
      };

      const selectMedia = (nextIndex: number) => {
        activeAbort?.abort();
        activeAbort = null;
        selectedIndex = ((nextIndex % mediaItems.length) + mediaItems.length) % mediaItems.length;
        const item = mediaItems[selectedIndex];
        if (stageContent) {
          stageContent.innerHTML = renderStageContent(item).innerHTML;
          bindPlayButton(item);
        }
        if (counter) {
          counter.textContent = `${selectedIndex + 1} / ${mediaItems.length}`;
        }
        thumbButtons.forEach((btn, idx) => {
          const isActive = idx === selectedIndex;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
      };

      bindPlayButton(mediaItems[0]);

      thumbButtons.forEach((btn, idx) => {
        $.on(btn, 'click', () => selectMedia(idx));
      });

      const prevBtn = el.querySelector('.steam-nav-prev');
      const nextBtn = el.querySelector('.steam-nav-next');
      if (prevBtn) $.on(prevBtn, 'click', () => selectMedia(selectedIndex - 1));
      if (nextBtn) $.on(nextBtn, 'click', () => selectMedia(selectedIndex + 1));
    }
  });

  return el;
}
