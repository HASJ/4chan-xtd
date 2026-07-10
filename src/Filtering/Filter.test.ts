import { beforeEach, describe, expect, it } from 'vitest';
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
});
