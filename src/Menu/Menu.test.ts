import { beforeEach, describe, expect, it, vi } from 'vitest';
import DataBoard from '../classes/DataBoard';
import { Conf, g } from '../globals/globals';
import IndexState from '../globals/IndexState';
import ThreadHiding from '../Filtering/ThreadHiding';
import CopyThreadURL from './CopyThreadURL';
import Menu from './Menu';

describe('catalog copy thread URL button', () => {
  beforeEach(() => {
    for (const key in Conf) delete Conf[key];
    Conf.Menu = true;
    Conf['Copy Thread URL Button'] = true;
    Conf['Hide Thread After Copying'] = false;
    Conf.hiddenThreads = {};
    g.VIEW = 'index';
    g.SITE = { ID: 'fixture', software: 'tinyboard', urls: {} };
    IndexState.root = document.body;
    ThreadHiding.db = new DataBoard('hiddenThreads', undefined, true);
    (document as any).execCommand = vi.fn(() => true);
    Menu.init();
    CopyThreadURL.init();
  });

  function makeCatalogThread() {
    const root = document.createElement('article');
    root.innerHTML = '<a class="catalog-link" href="/g/thread/123"></a><span class="catalog-icons"></span>';
    document.body.append(root);

    const threadRoot = document.createElement('section');
    document.body.append(threadRoot);
    const thread: any = {
      ID: 123,
      board: { ID: 'g' },
      nodes: { root: threadRoot },
      isHidden: false,
    };
    const catalogThread: any = {
      thread,
      nodes: {
        root,
        icons: root.querySelector('.catalog-icons'),
      },
    };
    thread.catalogView = catalogThread;
    Menu.catalogNode.call(catalogThread);
    CopyThreadURL.catalogNode.call(catalogThread);
    return { root, thread };
  }

  it('copies the absolute thread URL without hiding by default', () => {
    const { root, thread } = makeCatalogThread();
    const button = root.querySelector('.copy-thread-url-button') as HTMLElement;
    let copied = '';
    vi.mocked((document as any).execCommand).mockImplementation(() => {
      copied = (document.querySelector('.copy-text-element') as HTMLTextAreaElement).value;
      return true;
    });

    expect(button.nextElementSibling?.classList.contains('menu-button')).toBe(true);
    button.click();

    expect(copied).toBe('https://boards.4chan.org/g/thread/123');
    expect(thread.isHidden).toBe(false);
    expect(root.isConnected).toBe(true);
  });

  it('hides and persists the thread after a successful copy when enabled', () => {
    Conf['Hide Thread After Copying'] = true;
    const { root, thread } = makeCatalogThread();

    (root.querySelector('.copy-thread-url-button') as HTMLElement).click();

    expect(thread.isHidden).toBe(true);
    expect(root.isConnected).toBe(false);
    expect(ThreadHiding.isHidden('g', 123)).toBe(true);
  });
});
