import { describe, expect, it, vi, beforeEach } from 'vitest';
import EmbedSteam, { detectCountryCode } from './Steam';
import CrossOrigin from '../../platform/CrossOrigin';

describe('EmbedSteam', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detects country code from language tag with US fallback', () => {
    expect(detectCountryCode('pt-BR')).toBe('BR');
    expect(detectCountryCode('en-GB')).toBe('GB');
    expect(detectCountryCode('en-Latn-ca')).toBe('CA');
    expect(detectCountryCode('en')).toBe('US');
    expect(detectCountryCode('')).toBe('US');
  });

  it('renders video preview without autoplaying and plays only on play button click', async () => {
    const mockResponse = {
      '413150': {
        success: true,
        data: {
          name: 'Stardew Valley',
          short_description: 'You&apos;ve inherited your grandfather&apos;s old farm plot.',
          header_image: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/413150/header.jpg',
          release_date: { coming_soon: false, date: '26 Feb, 2016' },
          developers: ['ConcernedApe'],
          publishers: ['ConcernedApe'],
          movies: [
            {
              id: 256815967,
              name: 'Stardew Valley Trailer 1080p',
              thumbnail: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/256815967/movie.293x165.jpg',
              hls_h264: 'https://video.akamai.steamstatic.com/store_trailers/413150/336433/hls_264_master.m3u8',
            },
            {
              id: 256660296,
              name: 'Legacy MP4 Trailer',
              thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/256660296/movie.293x165.jpg',
              mp4: {
                max: 'https://video.fastly.steamstatic.com/store_trailers/256660296/movie_max.mp4',
              },
            },
          ],
          screenshots: [
            {
              id: 0,
              path_thumbnail: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/413150/ss_1.600x338.jpg',
              path_full: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/413150/ss_1.1920x1080.jpg',
            },
          ],
        },
      },
    };

    vi.spyOn(CrossOrigin, 'cachePromise').mockResolvedValueOnce({
      status: 200,
      response: mockResponse,
    } as any);
    const ajaxSpy = vi.spyOn(CrossOrigin, 'ajaxPromise').mockResolvedValue({
      status: 200,
      response: '',
    } as any);

    const anchor = document.createElement('a');
    anchor.dataset.uid = '413150';
    anchor.dataset.href = 'https://store.steampowered.com/app/413150/Stardew_Valley/';

    const el = EmbedSteam(anchor);
    expect(el.textContent).toContain('Loading Steam app');

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(el.querySelector('.steam-title')?.textContent).toBe('Stardew Valley');
    expect(el.querySelector('.steam-description')?.textContent).toBe("You've inherited your grandfather's old farm plot.");
    expect(el.querySelector('.steam-release-date')?.textContent).toBe('26 Feb, 2016');
    expect(el.querySelector('.steam-developer')?.textContent).toBe('ConcernedApe');
    expect(el.querySelector('.steam-publisher')?.textContent).toBe('ConcernedApe');

    // Initial media item shows video preview (thumbnail + play button), NOT <video>
    expect(el.querySelector('.steam-stage video')).toBeNull();
    const previewImg = el.querySelector('.steam-video-preview img.steam-stage-img') as HTMLImageElement | null;
    expect(previewImg).not.toBeNull();
    expect(previewImg?.getAttribute('src')).toBe('https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/256815967/movie.293x165.jpg');
    expect(el.querySelector('.steam-play-btn')).not.toBeNull();
    expect(el.querySelector('.steam-counter')?.textContent).toBe('1 / 3');
    expect(ajaxSpy).not.toHaveBeenCalled();

    const thumbs = el.querySelectorAll('.steam-thumb');
    expect(thumbs).toHaveLength(3);
    expect(thumbs[0].classList.contains('active')).toBe(true);
    expect(thumbs[0].querySelector('.steam-thumb-badge')).not.toBeNull();

    // Selecting screenshot (index 2) renders full screenshot
    (thumbs[2] as HTMLButtonElement).click();
    expect(el.querySelector('.steam-counter')?.textContent).toBe('3 / 3');
    expect(thumbs[2].classList.contains('active')).toBe(true);
    const stageImg = el.querySelector('.steam-stage img.steam-stage-img') as HTMLImageElement | null;
    expect(stageImg?.getAttribute('src')).toBe('https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/413150/ss_1.1920x1080.jpg');

    // Selecting MP4 video (index 1) shows preview without autoplaying
    (thumbs[1] as HTMLButtonElement).click();
    expect(el.querySelector('.steam-stage video')).toBeNull();
    expect(el.querySelector('.steam-play-btn')).not.toBeNull();

    // Clicking play button starts playback
    (el.querySelector('.steam-play-btn') as HTMLButtonElement).click();
    const videoEl = el.querySelector('.steam-stage video.steam-stage-video') as HTMLVideoElement | null;
    expect(videoEl).not.toBeNull();
    expect(videoEl?.getAttribute('src')).toBe('https://video.fastly.steamstatic.com/store_trailers/256660296/movie_max.mp4');

    // Switching back to HLS video (index 0) returns to preview state (no autoplay)
    (el.querySelector('.steam-nav-prev') as HTMLButtonElement).click();
    expect(el.querySelector('.steam-stage video')).toBeNull();
    expect(el.querySelector('.steam-play-btn')).not.toBeNull();
    expect(ajaxSpy).not.toHaveBeenCalled();

    // Clicking play on HLS video triggers HLS playlist fetch
    (globalThis as any).MediaSource = class {};
    try {
      (el.querySelector('.steam-play-btn') as HTMLButtonElement).click();
      expect(el.querySelector('.steam-stage video.steam-stage-video')).not.toBeNull();
      expect(ajaxSpy).toHaveBeenCalledWith(
        'https://video.akamai.steamstatic.com/store_trailers/413150/336433/hls_264_master.m3u8',
        { responseType: 'text' },
      );
    } finally {
      delete (globalThis as any).MediaSource;
    }
  });

  it('renders not-found message when Steam appdetails returns success: false', async () => {
    vi.spyOn(CrossOrigin, 'cachePromise').mockResolvedValueOnce({
      status: 200,
      response: { '999999999': { success: false } },
    } as any);

    const anchor = document.createElement('a');
    anchor.dataset.uid = '999999999';

    const el = EmbedSteam(anchor);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(el.textContent).toContain('Steam app not found.');
  });
});
