import { beforeEach, describe, expect, it } from 'vitest';
import { Conf } from '../globals/globals';
import Filter from './Filter';

describe('Filter.values', () => {
  const post: any = {
    ID: 42,
    isReply: true,
    info: {
      name: 'Fixture anon',
      uniqueID: 'ABC123',
      subject: 'Fixture subject',
    },
    files: [{ name: 'fixture-image.jpg', dimensions: '800x600', size: '1 KB', MD5: 'fixture-md5' }],
  };

  it('returns filterable post fields and combined values', () => {
    expect(Filter.values('name', post)).toEqual(['Fixture anon']);
    expect(Filter.values('filename', post)).toEqual(['fixture-image.jpg']);
    expect(Filter.values('name+subject', post)).toEqual(['Fixture anon\nFixture subject']);
  });
});

describe('Filter.test', () => {
  beforeEach(() => Filter.filters.clear());

  const makePost = (name: string) => ({
    ID: 42,
    siteID: 'fixture',
    boardID: 'g',
    isReply: true,
    file: undefined,
    files: [],
    info: { name },
  } as any);

  it('returns hidden and stub results only for matching filters', () => {
    Filter.filters.set('name', [{
      regexp: /blocked/i,
      boards: false,
      excludes: false,
      mask: 0,
      hide: true,
      stub: false,
    }] as any);

    expect(Filter.test(makePost('blocked user'))).toMatchObject({ hide: true, stub: false });
    expect(Filter.test(makePost('visible user'))).toMatchObject({ hide: false, stub: true });
  });

  it('keeps a matched post visible when filtering is not allowed', () => {
    Filter.filters.set('name', [{
      regexp: /blocked/i,
      boards: false,
      excludes: false,
      mask: 0,
      hide: true,
      stub: true,
    }] as any);

    expect(Filter.test(makePost('blocked user'), false).hide).toBe(false);
  });

  it('allows thread highlighting to override hiding when Always Show Highlighted Threads is enabled', () => {
    Filter.filters.set('name', [
      {
        regexp: /target/i,
        boards: false,
        excludes: false,
        mask: 0,
        hide: true,
        stub: false,
      },
      {
        regexp: /highlight/i,
        boards: false,
        excludes: false,
        mask: 0,
        hide: false,
        stub: true,
        hl: 'highlight-red',
      },
    ] as any);

    // Disabled by default: hiding takes effect
    Conf['Always Show Highlighted Threads'] = false;
    expect(Filter.test(makePost('target highlight user'))).toMatchObject({
      hide: true,
      stub: false,
      hl: ['highlight-red'],
    });

    // Enabled: highlight overrides hide regardless of filter order
    delete (makePost as any).filterResults;
    const testPost1 = makePost('target highlight user');
    Conf['Always Show Highlighted Threads'] = true;
    expect(Filter.test(testPost1)).toMatchObject({
      hide: false,
      hl: ['highlight-red'],
    });

    // Reversed filter order (highlight before hide)
    Filter.filters.set('name', [
      {
        regexp: /highlight/i,
        boards: false,
        excludes: false,
        mask: 0,
        hide: false,
        stub: true,
        hl: 'highlight-red',
      },
      {
        regexp: /target/i,
        boards: false,
        excludes: false,
        mask: 0,
        hide: true,
        stub: false,
      },
    ] as any);

    const testPost2 = makePost('target highlight user');
    expect(Filter.test(testPost2)).toMatchObject({
      hide: false,
      hl: ['highlight-red'],
    });
  });

  it('marks thread.isHighlighted when a post is highlighted in Filter.node', () => {
    Filter.filters.set('name', [{
      regexp: /special/i,
      boards: false,
      excludes: false,
      mask: 0,
      hide: false,
      stub: true,
      hl: 'highlight-special',
    }] as any);

    const threadObj: any = { isHighlighted: false, nodes: { root: document.createElement('div') } };
    const rootEl = document.createElement('div');
    const post: any = {
      ID: 100,
      siteID: 'fixture',
      boardID: 'g',
      isReply: false,
      thread: threadObj,
      nodes: { root: rootEl, quotelinks: [] },
      info: { name: 'special admin' },
      files: [],
    };

    Filter.node.call(post);
    expect(threadObj.isHighlighted).toBe(true);
    expect(rootEl.classList.contains('highlight-special')).toBe(true);
  });
});
