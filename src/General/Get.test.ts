import { beforeEach, describe, expect, it } from 'vitest';
import { g } from '../globals/globals';
import Get from './Get';

describe('Get.postDataFromLink', () => {
  beforeEach(() => {
    g.SITE = {
      regexp: {
        quotelink: /^https?:\/\/boards\.4chan(?:nel)?\.org\/+([^/]+)\/+thread\/+([0-9]+)(?:[/?][^#]*)?(?:#p([0-9]+))?$/,
      },
    };
  });

  it('parses same-board post links and defaults the post to the thread', () => {
    const link = document.createElement('a');
    link.href = 'https://boards.4chan.org/g/thread/123';
    expect(Get.postDataFromLink(link)).toEqual({ boardID: 'g', threadID: 123, postID: 123 });

    link.href = 'https://boards.4chan.org/g/thread/123#p456';
    expect(Get.postDataFromLink(link)).toEqual({ boardID: 'g', threadID: 123, postID: 456 });
  });

  it('parses cross-board links and ignores non-post URLs', () => {
    const link = document.createElement('a');
    link.href = 'https://boards.4channel.org/p/thread/789?page=2#p801';
    expect(Get.postDataFromLink(link)).toEqual({ boardID: 'p', threadID: 789, postID: 801 });

    link.href = 'https://boards.4chan.org/g/catalog';
    expect(Get.postDataFromLink(link)).toBeUndefined();
  });
});
