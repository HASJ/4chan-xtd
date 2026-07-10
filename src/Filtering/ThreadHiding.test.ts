import { beforeEach, describe, expect, it } from 'vitest';
import DataBoard from '../classes/DataBoard';
import { Conf, g } from '../globals/globals';
import ThreadHiding from './ThreadHiding';

describe('ThreadHiding', () => {
  beforeEach(() => {
    for (const key in Conf) delete Conf[key];
    Conf.hiddenThreads = {};
    g.SITE = { ID: 'fixture', software: 'tinyboard', urls: {} };
    ThreadHiding.db = new DataBoard('hiddenThreads', undefined, true);
  });

  it('hides, restores, and persists a thread through public APIs', () => {
    const thread: any = {
      ID: 1,
      board: { ID: 'g' },
      nodes: { root: document.createElement('section') },
      isHidden: false,
    };
    document.body.append(thread.nodes.root);

    ThreadHiding.hide(thread, false);
    expect(thread.isHidden).toBe(true);
    expect(thread.nodes.root.hidden).toBe(true);

    ThreadHiding.saveHiddenState(thread, false);
    expect(ThreadHiding.isHidden('g', 1)).toBe(true);

    ThreadHiding.show(thread);
    expect(thread.isHidden).toBe(false);
    expect(thread.nodes.root.hidden).toBe(false);

    ThreadHiding.saveHiddenState(thread, false);
    expect(ThreadHiding.isHidden('g', 1)).toBe(false);
  });
});
