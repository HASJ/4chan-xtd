import { beforeEach, describe, expect, it, vi } from 'vitest';
import SimpleDict from '../classes/SimpleDict';
import { g } from '../globals/globals';
import { archivePost } from '../test/fixtures/posts';

vi.mock('../classes/Post', () => ({
  default: class Post {
    resurrected = false;
    fromArchive = false;
    file: unknown;

    constructor(public root: any) {}

    resurrect() { this.resurrected = true; }
    markAsFromArchive() { this.fromArchive = true; }
  },
}));

import parseArchivePost from './Parse';

describe('parseArchivePost', () => {
  beforeEach(() => {
    g.SITE = { ID: 'fixture', Build: { post: (post: any) => post } };
    g.boards = Object.create(null);
    g.threads = new SimpleDict();
  });

  it('builds an archived post from the reusable archive fixture', () => {
    const post = parseArchivePost(archivePost() as any, 'https://archive.example') as any;

    expect(post.resurrected).toBe(true);
    expect(post.fromArchive).toBe(true);
    expect(post.root.info.commentHTML.innerHTML).toContain('deadlink');
    expect(g.threads?.get('g.300')).toBeDefined();
  });

  it('rejects malformed archive identifiers before building a post', () => {
    expect(() => parseArchivePost({ ...archivePost(), num: 'invalid' } as any, 'https://archive.example'))
      .toThrow('Invalid post or thread ID from archive');
  });
});
