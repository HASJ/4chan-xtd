import { beforeEach, describe, expect, it } from 'vitest';
import Gallery from './Gallery';
import { Conf, g } from '../globals/globals';

describe('Gallery Image Resolution', () => {
  beforeEach(() => {
    Conf['Image Resolution'] = false;
    Gallery.createDialog();
  });

  it('binds gal-dimensions node in createDialog', () => {
    expect(Gallery.nodes.dimensions).toBeDefined();
    expect(Gallery.nodes.dimensions.className).toBe('gal-dimensions');
  });

  it('displays image dimensions when Image Resolution is enabled', () => {
    const postMock: any = {
      files: [{ dimensions: '1920x1080' }],
    };
    g.posts = new Map<string, any>([['123', postMock]]) as any;

    const file = document.createElement('img');
    file.dataset.post = '123';
    file.dataset.file = '0';
    file.dataset.id = '0';

    const thumb = document.createElement('a');
    thumb.title = 'test.jpg';
    thumb.href = 'https://example.com/test.jpg';
    thumb.dataset.id = '0';
    thumb.dataset.post = '123';
    thumb.dataset.file = '0';

    Gallery.images = [thumb];
    Gallery.nodes.current.dataset.id = '0';

    // When disabled, dimensions stay blank
    Conf['Image Resolution'] = false;
    Gallery.open(thumb);
    expect(Gallery.nodes.dimensions.textContent).toBe('');

    // When enabled, dimensions are formatted as "W x H px"
    Conf['Image Resolution'] = true;
    Gallery.open(thumb);
    expect(Gallery.nodes.dimensions.textContent).toBe('1920 x 1080 px');
  });
});

