import { beforeEach, describe, expect, it } from 'vitest';
import { Conf } from '../globals/globals';
import Redirect from './Redirect';

const archive = {
  uid: 'fixture-archive',
  name: 'archive.example',
  domain: 'archive.example',
  software: 'foolfuuka',
  boards: ['g'],
  files: ['g'],
  https: true,
};

describe('Redirect', () => {
  beforeEach(() => {
    for (const key in Conf) delete Conf[key];
    Conf.archives = [{ ...archive }];
    Conf.selectedArchives = {};
    Redirect.data = null;
  });

  it('selects compatible archives and generates archive URLs', () => {
    Redirect.selectArchives();

    expect(Redirect.to('thread', { boardID: 'g', threadID: 100, postID: 101 }))
      .toBe('https://archive.example/g/thread/100/#101');
    expect(Redirect.to('post', { boardID: 'g', postID: 101 }))
      .toBe('https://archive.example/_/api/chan/post/?board=g&num=101');
  });

  it('ignores unsupported archives and skips commented archive-list entries', () => {
    Conf.archives = [{ ...archive, software: 'asagi' }];
    Conf.archiveLists = '  # disabled\n\n https://one.example/list.json \nhttps://two.example/list.json';
    Redirect.selectArchives();

    expect(Redirect.to('thread', { boardID: 'g', threadID: 100 })).toBe('');
    expect(Redirect.collectArchiveListUrls()).toEqual([
      'https://one.example/list.json',
      'https://two.example/list.json',
    ]);
  });

  it('ignores malformed archive records and selections', () => {
    Conf.archives = [null, { ...archive, boards: 'g', files: null }, archive] as any;
    Conf.selectedArchives = { g: null, f: { thread: 'missing' } } as any;

    expect(() => Redirect.selectArchives()).not.toThrow();
    expect(Redirect.to('thread', { boardID: 'g', threadID: 100 })).toBe('https://archive.example/g/thread/100/');
  });
});
