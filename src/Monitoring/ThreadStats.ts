import Callbacks from "../classes/Callbacks";
import UIState from "../globals/UIState";
import UI from "../General/UI";
import { g, Conf, E, doc, d } from "../globals/globals";
import $ from "../platform/$";
import { MINUTE, SECOND } from "../platform/helpers";

interface ThreadStatsType {
  postCount: number;
  fileCount: number;
  postIndex: number;
  showPurgePos?: boolean;
  showPage?: boolean;
  dialog: HTMLElement;
  postCountEl: HTMLElement;
  fileCountEl: HTMLElement;
  ipCountEl: HTMLElement | null;
  pageCountEl: HTMLElement | null;
  thread: any;
  timeout?: any;
  lastPageUpdate?: Date;
  init(): void;
  node(this: any): void;
  count(): void;
  onUpdate(e: Event): void;
  onPostsInserted(): void;
  update(): void;
  fetchPage(): void;
  onThreadsLoad(this: any): void;
  retry(): void;
  [key: string]: any;
}

const ThreadStats: ThreadStatsType = {
  postCount: 0,
  fileCount: 0,
  postIndex: 0,
  showPurgePos: undefined,
  showPage: undefined,
  dialog: null as any,
  postCountEl: null as any,
  fileCountEl: null as any,
  ipCountEl: null,
  pageCountEl: null,
  thread: null,
  timeout: undefined,
  lastPageUpdate: undefined,

  init() {
    if ((g.VIEW !== 'thread') || !Conf['Thread Stats']) { return; }

    if (Conf['Page Count in Stats']) {
      this[(g.SITE as any).isPrunedByAge?.(g.BOARD) ? 'showPurgePos' : 'showPage'] = true;
    }

    const statsHTML = {
      innerHTML: `<span id="post-count">?</span> / <span id="file-count">?</span>${(Conf["IP Count in Stats"] && (g.SITE as any).hasIPCount) ? " / <span id=\"ip-count\">?</span>" : ""}${(Conf["Page Count in Stats"]) ? " / <span id=\"page-count\">?</span>" : ""}`
    };
    const statsTitle = ThreadStats.buildStatsTitle();
    const sc = ThreadStats.buildDialog(statsHTML, statsTitle);

    this.postCountEl = $('#post-count', sc) as HTMLElement;
    this.fileCountEl = $('#file-count', sc) as HTMLElement;
    this.ipCountEl   = $('#ip-count',   sc) as HTMLElement | null;
    this.pageCountEl = $('#page-count', sc) as HTMLElement | null;

    if (this.pageCountEl) { $.on(this.pageCountEl, 'click', ThreadStats.fetchPage); }

    Callbacks.Thread.push({
      name: 'Thread Stats',
      cb:   this.node
    });
  },

  buildStatsTitle() {
    let statsTitle = 'Posts / Files';
    if (Conf['IP Count in Stats'] && (g.SITE as any).hasIPCount) { statsTitle += ' / IPs'; }
    if (Conf['Page Count in Stats']) {
      if (ThreadStats.showPurgePos) {
        statsTitle += ' / Purge Position';
      } else {
        statsTitle += ' / Page';
        if (Conf['Purge Position']) statsTitle += ' (Purge Position)';
      }
    }
    return statsTitle;
  },

  buildDialog(statsHTML: { innerHTML: string }, statsTitle: string) {
    let sc: HTMLElement;
    if (Conf['Updater and Stats in Header']) {
      ThreadStats.dialog = (sc = $.el('span', {
        id:    'thread-stats',
        title: statsTitle
      }));
      $.extend(sc, statsHTML);
      UIState.addShortcut('stats', sc, 200);
    } else {
      ThreadStats.dialog = (sc = UI.dialog('thread-stats', {
        innerHTML: `<div class="move" title="${E(statsTitle) as string}">${statsHTML.innerHTML}</div>`
      }));
      $.addClass(doc, 'float');
      $.ready(() => $.add(d.body, sc));
    }
    return sc;
  },

  node(this: any) {
    ThreadStats.thread = this;
    ThreadStats.count();
    ThreadStats.update();
    ThreadStats.fetchPage();
    $.on(d, 'PostsInserted', () => $.queueTask(ThreadStats.onPostsInserted));
    $.on(d, 'ThreadUpdate', ThreadStats.onUpdate);
  },

  count() {
    const { posts } = ThreadStats.thread;
    const n = posts.keys.length;
    for (let i = ThreadStats.postIndex, end = n; i < end; i++) {
      const post = posts.get(posts.keys[i]);
      if (post && !post.isFetchedQuote) {
        ThreadStats.postCount++;
        ThreadStats.fileCount += post.files.length;
      }
    }
    ThreadStats.postIndex = n;
  },

  onUpdate(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail?.[404]) { return; }
    const { postCount, fileCount } = detail;
    $.extend(ThreadStats, { postCount, fileCount });
    ThreadStats.postIndex = ThreadStats.thread.posts.keys.length;
    ThreadStats.update();
    if (ThreadStats.showPage && ThreadStats.pageCountEl && (ThreadStats.pageCountEl.textContent !== '1')) {
      ThreadStats.fetchPage();
    }
  },

  onPostsInserted() {
    if (ThreadStats.thread.posts.keys.length <= ThreadStats.postIndex) { return; }
    ThreadStats.count();
    ThreadStats.update();
    if (ThreadStats.showPage && ThreadStats.pageCountEl && (ThreadStats.pageCountEl.textContent !== '1')) {
      ThreadStats.fetchPage();
    }
  },

  update() {
    const { thread, postCountEl, fileCountEl, ipCountEl } = ThreadStats;
    postCountEl.textContent = String(ThreadStats.postCount);
    fileCountEl.textContent = String(ThreadStats.fileCount);
    if (ipCountEl) {
      if (thread.ipCount) {
        ipCountEl.textContent = String(thread.ipCount);
      } else if (g.BOARD?.config?.user_ids) {
        const IDs = new Set();
        g.posts!.forEach((post: any) => {
          if (post.info?.uniqueID) {
            IDs.add(post.info.uniqueID);
          }
        });
        ipCountEl.textContent = String(IDs.size);
      } else {
        ipCountEl.textContent = '?';
      }
    }
    postCountEl.classList.toggle('warning', !!(thread.postLimit && !thread.isSticky));
    fileCountEl.classList.toggle('warning', !!(thread.fileLimit && !thread.isSticky));
  },

  fetchPage() {
    if (!ThreadStats.pageCountEl) { return; }
    clearTimeout(ThreadStats.timeout);
    if (ThreadStats.thread.isDead) {
      ThreadStats.pageCountEl.textContent = 'Dead';
      $.addClass(ThreadStats.pageCountEl, 'warning');
      return;
    }
    ThreadStats.timeout = setTimeout(
      ThreadStats.fetchPage,
      Conf['Purge Position'] && ThreadStats.pageCountEl.classList.contains('warning')
        ? (5 * SECOND) : (2 * MINUTE)
    );
    $.whenModified(
      g.SITE.urls.threadsListJSON(ThreadStats.thread),
      'ThreadStats',
      ThreadStats.onThreadsLoad
    );
  },

  onThreadsLoad(this: any) {
    if (this.status === 200) {
      if (ThreadStats.showPurgePos && ThreadStats.pageCountEl) {
        ThreadStats.updatePurgePosition(this.response);
      } else if (ThreadStats.pageCountEl) {
        ThreadStats.updatePageNumber(this.response);
      }
    } else if (this.status === 304) {
      ThreadStats.retry();
    }
  },

  updatePurgePosition(response: any[]) {
    let purgePos = 1;
    for (const page of response) {
      for (const thread of page.threads) {
        if (thread.no < ThreadStats.thread.ID) {
          purgePos++;
        }
      }
    }
    ThreadStats.pageCountEl!.textContent = String(purgePos);
    ThreadStats.pageCountEl!.classList.toggle('warning', (purgePos === 1));
  },

  updatePageNumber(response: any[]) {
    let nThreads = 0;
    for (const page of response) {
      nThreads += page.threads.length;
    }
    let i = 0;
    for (let pageNum = 0; pageNum < response.length; pageNum++) {
      const page = response[pageNum];
      for (const thread of page.threads) {
        if (thread.no === ThreadStats.thread.ID) {
          ThreadStats.finishPageUpdate(pageNum, thread, i, nThreads, response[0].threads.length);
          return;
        }
        i++;
      }
    }
  },

  finishPageUpdate(pageNum: number, thread: any, i: number, nThreads: number, firstPageLength: number) {
    const pageCountEl = ThreadStats.pageCountEl!;
    pageCountEl.textContent = String(pageNum + 1);
    const hasWarning = (i >= (nThreads - firstPageLength));
    pageCountEl.classList.toggle('warning', hasWarning);
    if (hasWarning && Conf['Purge Position']) {
      pageCountEl.textContent += ` (${nThreads - i - 1})`;
    }
    ThreadStats.lastPageUpdate = new Date(thread.last_modified * SECOND);
    ThreadStats.retry();
  },

  retry() {
    // If thread data is stale (modification date given < time of last post), try again.
    // Skip this on vichan sites due to sage posts not updating modification time in signatures.
    if (
      !ThreadStats.showPage ||
      !ThreadStats.pageCountEl ||
      (ThreadStats.pageCountEl.textContent === '1') ||
      !!(g.SITE as any).threadModTimeIgnoresSage ||
      (ThreadStats.thread.posts.get(ThreadStats.thread.lastPost).info.date <= ThreadStats.lastPageUpdate!)
    ) { return; }
    clearTimeout(ThreadStats.timeout);
    ThreadStats.timeout = setTimeout(ThreadStats.fetchPage, 5 * SECOND);
  }
};

export default ThreadStats;
