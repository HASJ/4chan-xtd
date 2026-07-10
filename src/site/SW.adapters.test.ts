import { beforeEach, describe, expect, it } from 'vitest';
import { g } from '../globals/globals';
import { tinyboardPost, tinyboardThread, yotsubaPost, yotsubaThread } from '../test/fixtures/posts';
import SWTinyboard from './SW.tinyboard';
import SWYotsuba from './SW.yotsuba';

const site = {
  urls: {
    file: ({ boardID }: { boardID: string }, filename: string) => `https://files.example/${boardID}/${filename}`,
    thumb: ({ boardID }: { boardID: string }, filename: string) => `https://thumbs.example/${boardID}/${filename}`,
  },
};

describe('site adapter JSON fixtures', () => {
  beforeEach(() => {
    g.sites = Object.create(null);
    g.sites.fixture = { ...site, software: 'yotsuba' };
  });

  it('normalizes a Yotsuba reply fixture', () => {
    const post: any = SWYotsuba.Build.parseJSON(yotsubaPost(), { siteID: 'fixture', boardID: 'g' });

    expect(post).toMatchObject({ ID: 101, threadID: 100, boardID: 'g', isReply: true });
    expect(post.info).toMatchObject({ name: 'Fixture anon', uniqueID: 'ABC123' });
    expect(post.file).toMatchObject({ name: 'fixture-image.jpg', dimensions: '800x600' });
  });

  it('normalizes a Tinyboard reply fixture through its adapter', () => {
    g.sites.fixture.software = 'tinyboard';
    const post: any = SWTinyboard.Build.parseJSON(tinyboardPost(), { siteID: 'fixture', boardID: 'tech' });

    expect(post).toMatchObject({ ID: 201, threadID: 200, boardID: 'tech', isReply: true });
    expect(post.file?.url).toBe('https://files.example/tech/1700000000001.jpg');
    expect(SWTinyboard.Build.parseComment(tinyboardPost().com)).toBe('>tinyboard fixture\nreply');
  });

  it('parses fresh Yotsuba thread fixtures with OP, reply, file, quote, and poster data', () => {
    const posts = yotsubaThread().posts.map(data => SWYotsuba.Build.parseJSON(data, { siteID: 'fixture', boardID: 'g' })) as any[];

    expect(posts[0]).toMatchObject({ isReply: false, ID: 100 });
    expect(posts[1]).toMatchObject({ isReply: true, threadID: 100, file: { MD5: 'fixture-md5' } });
    expect(posts[1].info).toMatchObject({ uniqueID: 'ABC123' });
    expect(posts[0].info.commentHTML.innerHTML).toContain('>>101');
  });

  it('parses fresh Tinyboard thread fixtures with equivalent post data', () => {
    g.sites.fixture.software = 'tinyboard';
    const posts = tinyboardThread().posts.map(data => SWTinyboard.Build.parseJSON(data, { siteID: 'fixture', boardID: 'tech' })) as any[];

    expect(posts[0]).toMatchObject({ isReply: false, ID: 200 });
    expect(posts[1]).toMatchObject({ isReply: true, threadID: 200, file: { MD5: 'fixture-md5' } });
    expect(posts[1].info).toMatchObject({ uniqueID: 'ABC123' });
    expect(posts[0].info.commentHTML.innerHTML).toContain('>>201');
  });
});
