import { beforeEach, describe, expect, it } from 'vitest';
import Embedding from './Embedding';
import Linkify from './Linkify';
import { Conf, g } from '../globals/globals';

describe('Embedding & Linkify for YouTube', () => {
  beforeEach(() => {
    g.VIEW = 'thread';
    Conf['Linkify'] = true;
    Conf['Embedding'] = true;
    Conf['Link Title'] = true;
    Conf['Cover Preview'] = true;
    Embedding.init();
  });

  describe('Embedding.services', () => {
    it('matches standard youtube watch url', () => {
      const a = document.createElement('a');
      a.href = 'https://www.youtube.com/watch?v=QT1BD8bP9-E';
      const data = Embedding.services(a);
      expect(data).toBeDefined();
      expect(data?.key).toBe('YouTube');
      expect(data?.uid).toBe('QT1BD8bP9-E');
    });

    it('matches youtu.be url with timestamp query param', () => {
      const a = document.createElement('a');
      a.href = 'https://youtu.be/QT1BD8bP9-E?t=128';
      const data = Embedding.services(a);
      expect(data).toBeDefined();
      expect(data?.key).toBe('YouTube');
      expect(data?.uid).toBe('QT1BD8bP9-E');
      expect(data?.options).toBe('?t=128');

      const embedder = document.createElement('a');
      embedder.dataset.key = data!.key;
      embedder.dataset.uid = data!.uid;
      embedder.dataset.options = data!.options;
      const el = (Embedding as any).types.YouTube.el(embedder);
      expect(el.src).toContain('/embed/QT1BD8bP9-E');
      expect(el.src).toContain('&start=128');
    });

    it('matches www.youtu.be and http youtu.be urls', () => {
      const a = document.createElement('a');
      a.href = 'https://www.youtu.be/QT1BD8bP9-E';
      const data = Embedding.services(a);
      expect(data).toBeDefined();
      expect(data?.key).toBe('YouTube');
      expect(data?.uid).toBe('QT1BD8bP9-E');
    });

    it('calculates complex timestamp formats (e.g. 1h2m3s, 1m20s, 128s)', () => {
      const testCases = [
        { options: '?t=128s', expectedStart: '128' },
        { options: '?t=1m20s', expectedStart: '80' },
        { options: '?t=1h2m3s', expectedStart: '3723' },
        { options: '?si=xyz&t=45', expectedStart: '45' },
      ];

      for (const { options, expectedStart } of testCases) {
        const embedder = document.createElement('a');
        embedder.dataset.key = 'YouTube';
        embedder.dataset.uid = 'QT1BD8bP9-E';
        embedder.dataset.options = options;
        const el = (Embedding as any).types.YouTube.el(embedder);
        expect(el.src).toContain(`&start=${expectedStart}`);
      }
    });

    it('matches shorts, live, and embed urls', () => {
      const urls = [
        'https://www.youtube.com/shorts/QT1BD8bP9-E',
        'https://www.youtube.com/live/QT1BD8bP9-E',
        'https://www.youtube.com/embed/QT1BD8bP9-E',
      ];
      for (const url of urls) {
        const a = document.createElement('a');
        a.href = url;
        const data = Embedding.services(a);
        expect(data?.key).toBe('YouTube');
        expect(data?.uid).toBe('QT1BD8bP9-E');
      }
    });
  });

  describe('Linkify.process with youtu.be URLs', () => {
    it('linkifies and embeds youtu.be without protocol', () => {
      const div = document.createElement('div');
      div.textContent = 'youtu.be/QT1BD8bP9-E?t=128';
      document.body.appendChild(div);
      const links = Linkify.process(div);
      expect(links.length).toBe(1);
      const a = links[0];
      expect(a.href).toBe('http://youtu.be/QT1BD8bP9-E?t=128');
      const data = Embedding.services(a);
      expect(data).toBeDefined();
      expect(data?.key).toBe('YouTube');
      expect(data?.uid).toBe('QT1BD8bP9-E');
      div.remove();
    });

    it('linkifies and embeds https://youtu.be in full sentence', () => {
      const div = document.createElement('div');
      div.textContent = 'Look at this https://youtu.be/QT1BD8bP9-E?t=128 it is great';
      document.body.appendChild(div);
      const links = Linkify.process(div);
      expect(links.length).toBe(1);
      const a = links[0];
      expect(a.href).toBe('https://youtu.be/QT1BD8bP9-E?t=128');
      expect(a.textContent).toBe('https://youtu.be/QT1BD8bP9-E?t=128');
      const data = Embedding.services(a);
      expect(data).toBeDefined();
      expect(data?.key).toBe('YouTube');
      expect(data?.uid).toBe('QT1BD8bP9-E');
      div.remove();
    });

    it('processes multiple links across text nodes and line breaks', () => {
      const div = document.createElement('div');
      div.innerHTML = 'Line 1: https://youtu.be/QT1BD8bP9-E?t=128<br>Line 2: https://www.youtube.com/watch?v=QT1BD8bP9-E';
      document.body.appendChild(div);
      const links = Linkify.process(div);
      expect(links.length).toBe(2);
      expect(links[0].href).toBe('https://youtu.be/QT1BD8bP9-E?t=128');
      expect(links[1].href).toBe('https://www.youtube.com/watch?v=QT1BD8bP9-E');
      div.remove();
    });
  });
});
