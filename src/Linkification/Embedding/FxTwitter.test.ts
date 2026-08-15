import { describe, expect, it, vi, beforeEach } from 'vitest';
import EmbedFxTwitter from './FxTwitter';
import CrossOrigin from '../../platform/CrossOrigin';
import { Conf } from '../../globals/globals';

describe('EmbedFxTwitter', () => {
  beforeEach(() => {
    Conf.fxtUrl = 'https://api.fxtwitter.com';
    Conf.fxtLang = '';
    Conf.fxtMaxReplies = '0';
  });

  it('renders video media with referrerpolicy="no-referrer" and direct src', async () => {
    const mockTweet = {
      tweet: {
        url: 'https://x.com/TheGameVerse/status/2087922701197615135',
        id: '2087922701197615135',
        text: 'Sentinel Boss fight in ‘WOLVERINE’ 👀',
        author: {
          name: 'GameVerse',
          screen_name: 'TheGameVerse',
          avatar_url: 'https://pbs.twimg.com/profile_images/2083822157470240768/XSkJ5RUi_200x200.jpg',
          url: 'https://x.com/TheGameVerse',
        },
        media: {
          all: [
            {
              type: 'video',
              url: 'https://video.twimg.com/amplify_video/2087055470985150464/vid/avc1/3840x2160/UCf_yV3Ps9CRjOu0.mp4?tag=29',
              thumbnail_url: 'https://pbs.twimg.com/amplify_video_thumb/2087055470985150464/img/08MO4bvkrEGZSxIm.jpg',
              format: 'video/mp4',
              width: 3840,
              height: 2160,
            }
          ]
        },
        replies: 263,
        retweets: 158,
        likes: 3005,
        created_at: 'Thu Aug 13 15:22:18 +0000 2026',
      }
    };

    vi.spyOn(CrossOrigin, 'cachePromise').mockResolvedValueOnce({
      status: 200,
      response: mockTweet,
    } as any);

    const anchor = document.createElement('a');
    anchor.dataset.uid = 'TheGameVerse/status/2087922701197615135';

    const el = EmbedFxTwitter(anchor);
    expect(el.innerHTML).toContain('Loading');

    await new Promise(resolve => setTimeout(resolve, 0));

    // Video should be rendered inside an iframe with Blob/data URL
    const iframe = el.querySelector('.fxt-media iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('allow')).toBe('autoplay; fullscreen');
    expect(iframe?.getAttribute('allowfullscreen')).toBe('true');
    expect(iframe?.getAttribute('title')).toBe('Twitter video');
    expect(iframe?.getAttribute('src')).toBeTruthy();

    // Avatar image should have referrerpolicy="no-referrer"
    const avatar = el.querySelector('.fxt-meta_avatar img');
    expect(avatar).not.toBeNull();
    expect(avatar?.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(avatar?.getAttribute('src')).toBe(mockTweet.tweet.author.avatar_url);
  });

  it('renders photo and animated_gif media with referrerpolicy="no-referrer"', async () => {
    const mockTweet = {
      tweet: {
        url: 'https://x.com/example/status/123456',
        id: '123456',
        text: 'Photo test',
        author: {
          name: 'Example',
          screen_name: 'example',
          avatar_url: 'https://pbs.twimg.com/profile_images/avatar.jpg',
        },
        media: {
          all: [
            {
              type: 'photo',
              url: 'https://pbs.twimg.com/media/test1.jpg',
              altText: 'Sample photo',
              width: 800,
              height: 600,
            },
            {
              type: 'animated_gif',
              url: 'https://video.twimg.com/tweet_video/test.mp4',
              thumbnail_url: 'https://pbs.twimg.com/tweet_video_thumb/test.jpg',
              format: 'video/mp4',
            }
          ]
        },
        replies: 10,
        retweets: 5,
        likes: 20,
        created_at: 'Thu Aug 13 15:22:18 +0000 2026',
      }
    };

    vi.spyOn(CrossOrigin, 'cachePromise').mockResolvedValueOnce({
      status: 200,
      response: mockTweet,
    } as any);

    const anchor = document.createElement('a');
    anchor.dataset.uid = 'example/status/123456';

    const el = EmbedFxTwitter(anchor);
    await new Promise(resolve => setTimeout(resolve, 0));

    const img = el.querySelector('.fxt-media img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(img?.getAttribute('src')).toBe('https://pbs.twimg.com/media/test1.jpg');

    const gifIframe = el.querySelectorAll('.fxt-media iframe')[0];
    expect(gifIframe).not.toBeNull();
    expect(gifIframe?.getAttribute('title')).toBe('Twitter GIF');
    expect(gifIframe?.getAttribute('src')).toBeTruthy();
  });

  it('handles 404 tweet responses', async () => {
    vi.spyOn(CrossOrigin, 'cachePromise').mockResolvedValueOnce({
      status: 404,
      response: null,
    } as any);

    const anchor = document.createElement('a');
    anchor.dataset.uid = 'example/status/999999';

    const el = EmbedFxTwitter(anchor);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(el.textContent).toBe('404: tweet not found');
  });
});
