import { beforeEach, describe, expect, it } from 'vitest';
import SimpleDict from '../classes/SimpleDict';
import DataBoard from '../classes/DataBoard';
import { Conf, g } from '../globals/globals';
import { threadFixture } from '../test/fixtures/posts';
import PostHiding from './PostHiding';

describe('PostHiding', () => {
  beforeEach(() => {
    for (const key in Conf) delete Conf[key];
    Conf['Quote Backlinks'] = false;
    g.SITE = { regexp: { quotelink: /.*/ } };
    g.posts = new SimpleDict();
    g.SITE = { ID: 'fixture', urls: {} };
  });

  it('hides a post and marks its quote links, then restores both', () => {
    const thread = threadFixture();
    const root = thread.querySelector<HTMLElement>('.post')!;
    const quote = thread.querySelector<HTMLAnchorElement>('.quotelink')!;
    Object.assign(quote.dataset, { boardID: 'g', postID: '2' });
    document.body.append(thread);

    const target: any = {
      ID: 2,
      fullID: 'g.2',
      board: { ID: 'g' },
      isHidden: false,
      quotes: [],
      clones: [],
      nodes: { root },
    };
    const source: any = {
      fullID: 'g.1',
      quotes: ['g.2'],
      clones: [],
      nodes: { quotelinks: [quote] },
    };
    g.posts!.push(source.fullID, source);
    g.posts!.push(target.fullID, target);

    PostHiding.hide(target, false, false, 'Hidden manually');
    expect(target.isHidden).toBe(true);
    expect(root.hidden).toBe(true);
    expect(quote.classList.contains('filtered')).toBe(true);

    PostHiding.show(target, false);
    expect(target.isHidden).toBe(false);
    expect(root.hidden).toBe(false);
    expect(quote.classList.contains('filtered')).toBe(false);
  });

  it('persists explicit hide and unhide state through the public API', () => {
    Conf.hiddenPosts = {};
    PostHiding.db = new DataBoard('hiddenPosts', undefined, true);
    const post: any = { board: { ID: 'g' }, thread: { ID: 1 }, ID: 2 };

    PostHiding.saveHiddenState(post, true, true, false, true, true);
    expect(PostHiding.isHidden('g', 1, 2)).toBe(true);

    PostHiding.saveHiddenState(post, false);
    expect(PostHiding.isHidden('g', 1, 2)).toBe(false);
    PostHiding.db = undefined;
  });
});
