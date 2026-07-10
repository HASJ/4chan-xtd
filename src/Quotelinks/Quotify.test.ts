import { describe, expect, it, vi } from 'vitest';
import Redirect from '../Archive/Redirect';
import QuoteInline from './QuoteInline';
import Quotify from './Quotify';

describe('Quotify archive links', () => {
  it('turns a supported archive thread link into a quote link', () => {
    vi.spyOn(Redirect, 'to').mockReturnValue('https://archive.example/_/api/chan/post/?board=g&num=456');
    const link = document.createElement('a');
    link.href = 'https://archive.example/g/thread/123/#p456';
    const post: any = { nodes: { archivelinks: [] } };

    Quotify.parseArchivelink.call(post, link);

    expect(link.classList.contains('quotelink')).toBe(true);
    expect(link.dataset).toMatchObject({ boardID: 'g', threadID: '123', postID: '456' });
    expect(post.nodes.archivelinks).toEqual([link]);
  });

  it('leaves native board links unchanged', () => {
    const redirect = vi.spyOn(Redirect, 'to');
    const link = document.createElement('a');
    link.href = 'https://boards.4chan.org/g/thread/123/#p456';
    const post: any = { nodes: { archivelinks: [] } };

    Quotify.parseArchivelink.call(post, link);

    expect(redirect).not.toHaveBeenCalled();
    expect(post.nodes.archivelinks).toEqual([]);
  });

  it('builds an observable hash-navigation link for a quote', () => {
    const link = document.createElement('a');
    link.href = 'https://boards.4chan.org/g/thread/123#p456';

    const hashLink = QuoteInline.qiQuote(link, true);

    expect(hashLink).toMatchObject({ textContent: '#', href: link.href });
    expect(hashLink.className).toBe('hashlink filtered');
  });
});
