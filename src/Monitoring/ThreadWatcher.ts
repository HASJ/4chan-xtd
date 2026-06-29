import ThreadWatcherPage from './ThreadWatcher/ThreadWatcher.html';
import $ from "../platform/$";
import Board from '../classes/Board';
import Callbacks from '../classes/Callbacks';
import DataBoard from '../classes/DataBoard';
import Thread from '../classes/Thread';
import Filter from '../Filtering/Filter';
import $$ from '../platform/$$';
import Config from '../config/Config';
import CrossOrigin from '../platform/CrossOrigin';
import PostRedirect from '../Posting/PostRedirect';
import QuoteYou from '../Quotelinks/QuoteYou';
import Unread from './Unread';
import UnreadIndex from './UnreadIndex';
import Header from '../General/Header';
import Index from '../General/Index';
import { Conf, d, doc, g } from '../globals/globals';
import Menu from '../Menu/Menu';
import UI from '../General/UI';
import Get from '../General/Get';
import { dict, HOUR, MINUTE } from '../platform/helpers';
import Icon from '../Icons/icon';
import { registerThreadWatcherLookup, registerThreadWatcherUpdate } from './ThreadWatcherBridge';

interface ThreadWatcherType {
  enabled?: boolean;
  shortcut: HTMLElement;
  db: DataBoard;
  dbLM: DataBoard;
  dialog: HTMLElement;
  status: HTMLElement;
  list: HTMLElement;
  refreshButton: HTMLElement;
  menuButton: HTMLElement;
  closeButton: HTMLElement;
  unreaddb: any;
  unreadEnabled: boolean;
  requests: any[];
  fetched: number;
  prefixes: Record<string, string>;
  syncing?: boolean;
  timeout?: any;
  lastPageUpdate?: Date;
  init(): void;
  isWatched(thread: any): boolean;
  isWatchedRaw(boardID: string, threadID: number): boolean;
  setToggler(toggler: HTMLElement, isWatched: boolean): string;
  node(this: any): void;
  catalogNode(this: any): void;
  addDialog(): void;
  toggleWatcher(): void;
  cb: {
    openAll(this: HTMLElement): void;
    openUnread(this: HTMLElement): void;
    openDeads(this: HTMLElement): void;
    clear(): void;
    pruneDeads(this: HTMLElement): void;
    pruneReadDeads(this: HTMLElement): void;
    dismiss(): void;
    toggle(this: HTMLElement): void;
    rm(this: HTMLElement): void;
    post(e: Event): void;
    onIndexUpdate(e: Event): void;
    onThreadRefresh(e: Event): void;
  };
  clearRequests(): void;
  abort(): void;
  initLastModified(): void;
  fetchAuto(): void;
  buttonFetchAll(): void;
  fetchAllStatus(interval?: number): any[];
  fetchBoard(board: any, deep?: boolean): void;
  parseBoard(this: any, board: any, url: string): void;
  fetchStatus(thread: any): void;
  parseStatus(this: any, thread: any, isArchiveURL?: boolean): void;
  getAll(groupByBoard?: boolean): any[];
  makeLine(siteID: string, boardID: string, threadID: number, data: any): HTMLElement;
  setPrefixes(threads: any[]): Record<string, string>;
  build(): void;
  refresh(manual?: boolean): void;
  refreshIcon(): void;
  update(siteID: string, boardID: string, threadID: number, newData: any): void;
  set404(boardID: string, threadID: number, cb: () => void): void;
  toggle(thread: any, manual?: boolean): void;
  add(thread: any, cb?: () => void, manual?: boolean): void;
  addRaw(boardID: string, threadID: number, data: any, cb?: () => void, manual?: boolean): void;
  rm(siteID: string, boardID: string, threadID: number, cb?: () => void, manual?: boolean): void;
  menu: {
    menu: any;
    init(): void;
    addHeaderMenuEntry(): void;
    addMenuEntries(): void;
    addCheckbox(name: string, desc: string): void;
  };
  [key: string]: any;
}

const ThreadWatcher: ThreadWatcherType = {
  shortcut: null as any,
  db: null as any,
  dbLM: null as any,
  dialog: null as any,
  status: null as any,
  list: null as any,
  refreshButton: null as any,
  menuButton: null as any,
  closeButton: null as any,
  unreaddb: null,
  unreadEnabled: false,
  requests: [],
  fetched: 0,
  prefixes: {},

  init() {
    let sc: HTMLElement;
    if (!(this.enabled = Conf['Thread Watcher'])) { return; }

    this.shortcut = (sc = $.el('a', {
      id:    'watcher-link',
      title: 'Thread Watcher',
      href:  'javascript:;',
    }));
    (Icon as any).set(this.shortcut, 'eye', 'Watcher');

    this.db     = new DataBoard('watchedThreads', this.refresh, true);
    this.dbLM   = new DataBoard('watcherLastModified', null, true);
    this.dialog = UI.dialog('thread-watcher', { innerHTML: ThreadWatcherPage });
    this.status = $('#watcher-status', this.dialog) as HTMLElement;
    this.list   = this.dialog.lastElementChild as HTMLElement;
    this.refreshButton = $('.refresh', this.dialog) as HTMLElement;
    this.menuButton = $('.menu-button', this.dialog) as HTMLElement;
    this.closeButton = $('.move > .close', this.dialog) as HTMLElement;
    this.unreaddb = (Unread as any).db || (UnreadIndex as any).db || new DataBoard('lastReadPosts');
    this.unreadEnabled = Conf['Remember Last Read Post'];

    (Icon as any).set(this.refreshButton, 'refresh');
    (Icon as any).set(this.menuButton, 'caretDown');
    (Icon as any).set(this.closeButton, 'xmark');

    $.on(d, 'QRPostSuccessful',   this.cb.post);
    $.on(sc, 'click', this.toggleWatcher);
    $.on(this.refreshButton, 'click', this.buttonFetchAll);
    $.on(this.closeButton, 'click', this.toggleWatcher);

    this.menu.addHeaderMenuEntry();
    $.onExists(doc, 'body', this.addDialog);

    switch (g.VIEW) {
      case 'index':
        $.on(d, 'IndexUpdate', this.cb.onIndexUpdate);
        break;
      case 'thread':
        $.on(d, 'ThreadUpdate', this.cb.onThreadRefresh);
        break;
    }

    if (Conf['Fixed Thread Watcher']) {
      $.addClass(doc, 'fixed-watcher');
    }
    if (!Conf['Persistent Thread Watcher']) {
      $.addClass(ThreadWatcher.shortcut, 'disabled');
      this.dialog.hidden = true;
    }

    Header.addShortcut('watcher', sc, 510);

    ThreadWatcher.initLastModified();
    ThreadWatcher.fetchAuto();
    $.on(window, 'visibilitychange focus', () => $.queueTask(ThreadWatcher.fetchAuto));

    if (Conf['Menu'] && Index.enabled) {
      Menu.menu.addEntry({
        el: $.el('a', {
          href:      'javascript:;',
          className: 'has-shortcut-text'
        }, { innerHTML: '<span></span><span class="shortcut-text">Alt+click</span>' }),
        order: 6,
        open(this: any, { thread }: any) {
          if (Conf['Index Mode'] !== 'catalog') { return false; }
          this.el.firstElementChild.textContent = ThreadWatcher.isWatched(thread) ?
            'Unwatch'
          :
            'Watch';
          if (this.cb) { $.off(this.el, 'click', this.cb); }
          this.cb = () => {
            $.event('CloseMenu', undefined);
            ThreadWatcher.toggle(thread, true);
          };
          $.on(this.el, 'click', this.cb);
          return true;
        }
      });
    }

    if (!['index', 'thread'].includes(g.VIEW)) { return; }

    Callbacks.Post.push({
      name: 'Thread Watcher',
      cb:   this.node
    });
    Callbacks.CatalogThread.push({
      name: 'Thread Watcher',
      cb:   this.catalogNode
    });
  },

  isWatched(thread: any) {
    return !!ThreadWatcher.db?.get({ boardID: thread.board.ID, threadID: thread.ID });
  },

  isWatchedRaw(boardID: string, threadID: number) {
    return !!ThreadWatcher.db?.get({ boardID, threadID });
  },

  setToggler(toggler: HTMLElement, isWatched: boolean) {
    toggler.classList.toggle('watched', isWatched);
    return toggler.title = `${isWatched ? 'Unwatch' : 'Watch'} Thread`;
  },

  node(this: any) {
    let toggler: HTMLElement;
    if (this.isReply) { return; }
    if (this.isClone) {
      toggler = $('.watch-thread-link', this.nodes.info) as HTMLElement;
    } else {
      toggler = $.el('button', {
        type: 'button',
        className: 'watch-thread-link'
      });
      (Icon as any).set(toggler, 'heart');
      $.before($('input', this.nodes.info) as HTMLElement, toggler);
    }
    const siteID = g.SITE.ID;
    const boardID = this.board.ID;
    const threadID = this.thread.ID;
    const data = ThreadWatcher.db.get({ siteID, boardID, threadID });
    ThreadWatcher.setToggler(toggler, !!data);
    $.on(toggler, 'click', ThreadWatcher.cb.toggle);
    // Add missing excerpt for threads added by Auto Watch
    if (data && (data.excerpt == null)) {
      $.queueTask(() => {
        ThreadWatcher.update(siteID, boardID, threadID, { excerpt: Get.threadExcerpt(this.thread) });
      });
    }
  },

  catalogNode(this: any) {
    if (ThreadWatcher.isWatched(this.thread)) { $.addClass(this.nodes.root, 'watched'); }
    $.on(this.nodes.root, 'mousedown click', (e: MouseEvent) => {
      if ((e.button !== 0) || !e.altKey) return;
      if (e.type === 'click') ThreadWatcher.toggle(this.thread, true);
      e.preventDefault();
    });
  },

  addDialog() {
    if (!((g.SITE as any).isThisPageLegit ? (g.SITE as any).isThisPageLegit() : !!$.id('postForm'))) { return; }
    ThreadWatcher.build();
    $.prepend(d.body, ThreadWatcher.dialog);
  },

  toggleWatcher() {
    $.toggleClass(ThreadWatcher.shortcut, 'disabled');
    ThreadWatcher.dialog.hidden = !ThreadWatcher.dialog.hidden;
  },

  cb: {
    openAll(this: HTMLElement) {
      if ($.hasClass(this, 'disabled')) return;
      for (const a of $$('a.watcher-link', ThreadWatcher.list) as HTMLAnchorElement[]) {
        $.open(a.href);
      }
      $.event('CloseMenu', undefined);
    },
    openUnread(this: HTMLElement) {
      if ($.hasClass(this, 'disabled')) return;
      for (const a of $$('.replies-unread > a.watcher-link', ThreadWatcher.list) as HTMLAnchorElement[]) {
        $.open(a.href);
      }
      $.event('CloseMenu', undefined);
    },
    openDeads(this: HTMLElement) {
      if ($.hasClass(this, 'disabled')) return;
      for (const a of $$('.dead-thread.replies-unread > a.watcher-link', ThreadWatcher.list) as HTMLAnchorElement[]) {
        $.open(a.href);
      }
      $.event('CloseMenu', undefined);
    },
    clear() {
      if (!confirm("Delete ALL threads from watcher?")) return;
      const ref = ThreadWatcher.getAll();
      for (let i = 0, len = ref.length; i < len; i++) {
        const { siteID, boardID, threadID } = ref[i];
        ThreadWatcher.db.delete({ siteID, boardID, threadID });
      }
      ThreadWatcher.refresh(true);
      $.event('CloseMenu', undefined);
    },
    pruneDeads(this: HTMLElement) {
      if ($.hasClass(this, 'disabled')) return;
      for (const { siteID, boardID, threadID, data } of ThreadWatcher.getAll()) {
        if (data.isDead) {
          ThreadWatcher.db.delete({ siteID, boardID, threadID });
        }
      }
      ThreadWatcher.refresh(true);
      $.event('CloseMenu', undefined);
    },
    pruneReadDeads(this: HTMLElement) {
      if ($.hasClass(this, 'disabled')) return;
      for (const { siteID, boardID, threadID, data } of ThreadWatcher.getAll()) {
        if (data.isDead && !data.unread) {
          ThreadWatcher.db.delete({ siteID, boardID, threadID });
        }
      }
      ThreadWatcher.refresh(true);
      $.event('CloseMenu', undefined);
    },
    dismiss() {
      for (const { siteID, boardID, threadID, data } of ThreadWatcher.getAll()) {
        if (data.quotingYou) {
          ThreadWatcher.update(siteID, boardID, threadID, { dismiss: data.quotingYou || 0 });
        }
      }
      $.event('CloseMenu', undefined);
    },
    toggle(this: HTMLElement) {
      const { thread } = Get.postFromNode(this) as any;
      ThreadWatcher.toggle(thread, true);
    },
    rm(this: HTMLElement) {
      const parent = this.parentNode as HTMLElement;
      const siteID = parent.dataset.siteID!;
      const [boardID, threadID] = parent.dataset.fullID!.split('.');
      ThreadWatcher.rm(siteID, boardID, +threadID, undefined, true);
    },
    post(e: Event) {
      const detail = (e as CustomEvent).detail;
      const { boardID, threadID, postID } = detail;
      const cb = PostRedirect.delay();
      if (postID === threadID) {
        if (Conf['Auto Watch']) {
          ThreadWatcher.addRaw(boardID, threadID, {}, cb, true);
        }
      } else if (Conf['Auto Watch Reply']) {
        ThreadWatcher.add(
          (g.threads.get(boardID + '.' + threadID) || new Thread(threadID, (g.boards[boardID] as any) || new Board(boardID))),
          cb, true);
      }
    },
    onIndexUpdate(e: Event) {
      const detail = (e as CustomEvent).detail;
      const { db }    = ThreadWatcher;
      const siteID  = g.SITE.ID;
      const boardID = g.BOARD.ID;
      let nKilled = 0;
      const boardData = db.data[siteID]?.boards[boardID];
      if (boardData) {
        for (const threadID in boardData) {
          // Don't prune threads that have yet to appear in index.
          const data = boardData[threadID];
          if (!data?.isDead && !detail.threads.includes(`${boardID}.${threadID}`)) {
            if (!detail.threads.some((fullID: string) => +fullID.split('.')[1] > +threadID)) { continue; }
            if (Conf['Auto Prune'] || !(data && (typeof data === 'object'))) { // corrupt data
              db.delete({ boardID, threadID });
              nKilled++;
            } else {
              ThreadWatcher.fetchStatus({ siteID, boardID, threadID, data });
            }
          }
        }
      }
      if (nKilled) { ThreadWatcher.refresh(); }
    },
    onThreadRefresh(e: Event) {
      const detail = (e as CustomEvent).detail;
      const thread = g.threads.get(detail.threadID);
      if (!detail[404] || !ThreadWatcher.isWatched(thread)) { return; }
      // Update dead status.
      ThreadWatcher.add(thread);
    }
  },

  fetch(url: string, { siteID, force }: any, args: any[], cb: (...args: any[]) => void) {
    if (ThreadWatcher.requests.length === 0) {
      ThreadWatcher.status.textContent = '...';
      $.addClass(ThreadWatcher.refreshButton, 'spin');
    }
    const onloadend = function(this: any) {
      if (this.finished) { return; }
      this.finished = true;
      ThreadWatcher.fetched++;
      if (ThreadWatcher.fetched === ThreadWatcher.requests.length) {
        ThreadWatcher.clearRequests();
      } else {
        ThreadWatcher.status.textContent = `${Math.round((ThreadWatcher.fetched / ThreadWatcher.requests.length) * 100)}%`;
      }
      cb.apply(this, args);
    };
    const ajax = siteID === g.SITE.ID ? $.ajax : CrossOrigin.ajax;
    if (force) {
      if (($.lastModified as any).ThreadWatcher) {
        delete ($.lastModified as any).ThreadWatcher[url];
      }
    }
    const req = $.whenModified(
      url,
      'ThreadWatcher',
      onloadend,
      { timeout: MINUTE, ajax }
    );
    ThreadWatcher.requests.push(req);
  },

  clearRequests() {
    ThreadWatcher.requests = [];
    ThreadWatcher.fetched = 0;
    ThreadWatcher.status.textContent = '';
    $.rmClass(ThreadWatcher.refreshButton, 'spin');
  },

  abort() {
    delete ThreadWatcher.syncing;
    for (const req of ThreadWatcher.requests) {
      if (!req.finished) {
        req.finished = true;
        req.abort();
      }
    }
    ThreadWatcher.clearRequests();
  },

  initLastModified() {
    const lm = (($.lastModified as any)['ThreadWatcher'] || (($.lastModified as any)['ThreadWatcher'] = dict()));
    for (const siteID in ThreadWatcher.dbLM.data) {
      const boards = ThreadWatcher.dbLM.data[siteID];
      for (const boardID in boards.boards) {
        const data = boards.boards[boardID];
        if (ThreadWatcher.db.get({ siteID, boardID })) {
          for (const url in data) {
            const date = data[url];
            lm[url] = date;
          }
        } else {
          ThreadWatcher.dbLM.delete({ siteID, boardID });
        }
      }
    }
  },

  fetchAuto() {
    let middle: number;
    clearTimeout(ThreadWatcher.timeout);
    if (!Conf['Auto Update Thread Watcher']) { return; }
    const { db } = ThreadWatcher;
    const interval = Conf['Show Page'] || (ThreadWatcher.unreadEnabled && Conf['Show Unread Count']) ? 5 * MINUTE : 2 * HOUR;
    const now = Date.now();
    if ((now - interval >= ((middle = db.data.lastChecked || 0)) || middle > now) && !d.hidden && d.hasFocus()) {
      ThreadWatcher.fetchAllStatus(interval);
    }
    ThreadWatcher.timeout = setTimeout(ThreadWatcher.fetchAuto, interval);
  },

  buttonFetchAll() {
    if (ThreadWatcher.syncing || ThreadWatcher.requests.length) {
      ThreadWatcher.abort();
    } else {
      ThreadWatcher.fetchAllStatus();
    }
  },

  fetchAllStatus(interval = 0) {
    ThreadWatcher.status.textContent = '...';
    $.addClass(ThreadWatcher.refreshButton, 'spin');
    ThreadWatcher.syncing = true;
    const dbs = [ThreadWatcher.db, ThreadWatcher.unreaddb, QuoteYou.db].filter(x => x);
    let n = 0;
    return dbs.map((dbi) =>
      dbi.forceSync(() => {
        if ((++n) === dbs.length) {
          let middle: number;
          if (!ThreadWatcher.syncing) { return; } // aborted
          delete ThreadWatcher.syncing;
          if (0 > (middle = Date.now() - (ThreadWatcher.db.data.lastChecked || 0)) || middle >= interval) { // not checked in another tab
            // XXX On vichan boards, last_modified field of threads.json does not account for sage posts.
            // Occasionally check replies field of catalog.json to find these posts.
            let middle1: number;
            const { db } = ThreadWatcher;
            const now = Date.now();
            const deep = !(now - (2 * HOUR) < ((middle1 = db.data.lastChecked2 || 0)) && middle1 <= now);
            const boards = ThreadWatcher.getAll(true);
            for (const board of boards) {
              ThreadWatcher.fetchBoard(board, deep);
            }
            db.setLastChecked();
            if (deep) { db.setLastChecked('lastChecked2'); }
          }
          if (ThreadWatcher.fetched === ThreadWatcher.requests.length) {
            ThreadWatcher.clearRequests();
          }
        }
      }));
  },

  fetchBoard(board: any, deep?: boolean) {
    if (!board.some((thread: any) => !thread.data.isDead)) { return; }
    let force = false;
    for (const thread of board) {
      const { data } = thread;
      if (!data.isDead && (data.last !== -1)) {
        if (Conf['Show Page'] && (data.page == null)) { force = true; }
        if (data.modified == null) { force = (thread.force = true); }
      }
    }
    const { siteID, boardID } = board[0];
    const site = g.sites[siteID];
    if (!site) { return; }
    const urlF = deep && (site as any).threadModTimeIgnoresSage ? 'catalogJSON' : 'threadsListJSON';
    const url = (site as any).urls[urlF]?.({ siteID, boardID });
    if (!url) { return; }
    ThreadWatcher.fetch(url, { siteID, force }, [board, url], ThreadWatcher.parseBoard);
  },

  parseBoard(this: any, board: any, url: string) {
    let page: any, thread: any;
    if (this.status !== 200) { return; }
    const { siteID, boardID } = board[0];
    const lmDate = this.getResponseHeader('Last-Modified');
    ThreadWatcher.dbLM.extend({ siteID, boardID, val: $.item(url, lmDate) });
    const threads = dict();
    let pageLength = 0;
    let nThreads = 0;
    let oldest: number | null = null;
    try {
      pageLength = this.response[0]?.threads.length || 0;
      for (let i = 0; i < this.response.length; i++) {
        page = this.response[i];
        for (const item of page.threads) {
          threads[item.no] = {
            page: i + 1,
            index: nThreads,
            modified: item.last_modified,
            replies: item.replies
          };
          nThreads++;
          if ((oldest == null) || (item.no < oldest)) {
            oldest = item.no;
          }
        }
      }
    } catch (error) {
      for (thread of board) {
        ThreadWatcher.fetchStatus(thread);
      }
    }
    for (thread of board) {
      const { threadID, data } = thread;
      if (threads[threadID]) {
        const { page: p, index, modified, replies } = threads[threadID];
        if (Conf['Show Page']) {
          const lastPage = (g.sites[siteID] as any).isPrunedByAge?.({ siteID, boardID }) ?
            threadID === oldest
          :
            index >= (nThreads - pageLength);
          ThreadWatcher.update(siteID, boardID, threadID, { page: p, lastPage });
        }
        if (ThreadWatcher.unreadEnabled && Conf['Show Unread Count']) {
          if ((modified !== data.modified) || ((replies != null) && (replies !== data.replies))) {
            (thread.newData || (thread.newData = {})).modified = modified;
            ThreadWatcher.fetchStatus(thread);
          }
        }
      } else {
        ThreadWatcher.fetchStatus(thread);
      }
    }
  },

  fetchStatus(thread: any) {
    const { siteID, boardID, threadID, data, force } = thread;
    const url = g.sites[siteID]?.urls.threadJSON?.({ siteID, boardID, threadID });
    if (!url) { return; }
    if (data.isDead && !force) { return; }
    if (data.last === -1) { return; } // 404 or no JSON API
    ThreadWatcher.fetch(url, { siteID, force }, [thread], ThreadWatcher.parseStatus);
  },

  parseStatus(this: any, thread: any, isArchiveURL?: boolean) {
    let isDead: boolean, last: number;
    const { siteID, boardID, threadID, data, force } = thread;
    let { newData } = thread;
    const site = g.sites[siteID];
    if (!site) { return; }
    if ((this.status === 200) && this.response) {
      let isArchived: boolean;
      last = this.response.posts[this.response.posts.length - 1].no;
      const replies = this.response.posts.length - 1;
      isDead = (isArchived = !!(this.response.posts[0].archived || isArchiveURL));
      if (isDead && Conf['Auto Prune']) {
        ThreadWatcher.rm(siteID, boardID, threadID);
        return;
      }

      if ((last === data.last) && (isDead === data.isDead) && (isArchived === data.isArchived)) { return; }

      const lastReadPost = ThreadWatcher.unreaddb.get({ siteID, boardID, threadID, defaultValue: 0 });
      let unread = data.unread || 0;
      let quotingYou = data.quotingYou || 0;
      const youOP = !!QuoteYou.db?.get({ siteID, boardID, threadID, postID: threadID });

      for (const postObj of this.response.posts) {
        if ((postObj.no <= (data.last || 0)) || (postObj.no <= lastReadPost)) { continue; }
        if (QuoteYou.db?.get({ siteID, boardID, threadID, postID: postObj.no })) { continue; }

        let quotesYou = false;
        if (!Conf['Require OP Quote Link'] && youOP) {
          quotesYou = true;
        } else if (QuoteYou.db && postObj.com) {
          let match: RegExpExecArray | null;
          const regexp = site.regexp.quotelinkHTML;
          regexp.lastIndex = 0;
          while ((match = regexp.exec(postObj.com))) {
            if (QuoteYou.db.get({
              siteID,
              boardID:  match[1] ? encodeURIComponent(match[1]) : boardID,
              threadID: match[2] || threadID,
              postID:   match[3] || match[2] || threadID
            })) {
              quotesYou = true;
              break;
            }
          }
        }

        if (!unread || (!quotingYou && quotesYou)) {
          if (Filter.isHidden(site.Build.parseJSON(postObj, { siteID, boardID }))) { continue; }
        }

        unread++;
        if (quotesYou) { quotingYou = postObj.no; }
      }

      if (!newData) { newData = {}; }
      $.extend(newData, { last, replies, isDead, isArchived, unread, quotingYou });
      ThreadWatcher.update(siteID, boardID, threadID, newData);

    } else if (this.status === 404) {
      const archiveURL = g.sites[siteID]?.urls.archivedThreadJSON?.({ siteID, boardID, threadID });
      if (!isArchiveURL && archiveURL) {
        ThreadWatcher.fetch(archiveURL, { siteID, force }, [thread, true], ThreadWatcher.parseStatus);
      } else if ((site as any).mayLackJSON && (data.last == null)) {
        ThreadWatcher.update(siteID, boardID, threadID, { last: -1 });
      } else {
        ThreadWatcher.update(siteID, boardID, threadID, { isDead: true });
      }
    }
  },

  getAll(groupByBoard?: boolean) {
    const all = [];
    for (const siteID in ThreadWatcher.db.data) {
      const boards = ThreadWatcher.db.data[siteID];
      for (const boardID in boards.boards) {
        let cont: any[] | undefined;
        const threads = boards.boards[boardID];
        if (Conf['Current Board'] && ((siteID !== g.SITE.ID) || (boardID !== g.BOARD.ID))) {
          continue;
        }
        if (groupByBoard) {
          all.push((cont = []));
        }
        for (const threadID in threads) {
          const data = threads[threadID];
          if (data && (typeof data === 'object')) {
            (groupByBoard ? cont! : all).push({ siteID, boardID, threadID: +threadID, data });
          }
        }
      }
    }
    return all;
  },

  makeLine(siteID, boardID, threadID, data) {
    let page: HTMLElement;
    const x = $.el('a', {
      textContent: '✕',
      href: 'javascript:;'
    });
    (Icon as any).set(x, 'xmark');
    $.on(x, 'click', ThreadWatcher.cb.rm);

    let { excerpt, isArchived } = data;
    if (!excerpt) { excerpt = `/${boardID}/ - No.${threadID}`; }
    if (Conf['Show Site Prefix']) { excerpt = (ThreadWatcher.prefixes[siteID] || '') + excerpt; }

    const link = $.el('a', {
      href: g.sites[siteID]?.urls.thread({ siteID, boardID, threadID }, isArchived) || '',
      title: excerpt,
      className: 'watcher-link'
    }) as HTMLAnchorElement;

    if (Conf['Show Page'] && (data.page != null)) {
      page = $.el('span', {
        textContent: `[${data.page}]`,
        className: 'watcher-page'
      });
      $.add(link, page);
    }

    if (ThreadWatcher.unreadEnabled && Conf['Show Unread Count'] && (data.unread != null)) {
      const count = $.el('span', {
        textContent: `(${data.unread})`,
        className: 'watcher-unread'
      });
      $.add(link, count);
    }

    const title = $.el('span', {
      textContent: excerpt,
      className: 'watcher-title'
    });
    $.add(link, title);

    const div = $.el('div');
    const fullID = `${boardID}.${threadID}`;
    div.dataset.fullID = fullID;
    div.dataset.siteID = siteID;
    if ((g.VIEW === 'thread') && (fullID === `${g.BOARD}.${g.THREADID}`)) { $.addClass(div, 'current'); }
    if (data.isDead) { $.addClass(div, 'dead-thread'); }
    if (Conf['Show Page']) {
      if (data.lastPage) { $.addClass(div, 'last-page'); }
      if (data.page != null) { div.dataset.page = String(data.page); }
    }
    if (ThreadWatcher.unreadEnabled && Conf['Show Unread Count']) {
      if (data.unread === 0) { $.addClass(div, 'replies-read'); }
      if (data.unread) { $.addClass(div, 'replies-unread'); }
      if ((data.quotingYou || 0) > (data.dismiss || 0)) { $.addClass(div, 'replies-quoting-you'); }
    }
    $.add(div, [x, $.tn(' '), link]);
    return div;
  },

  setPrefixes(threads) {
    const prefixes = dict();
    for (const { siteID } of threads) {
      if (siteID in prefixes) { continue; }
      let len = 0;
      let prefix = '';
      let conflicts = Object.keys(prefixes);
      while (conflicts.length > 0) {
        len++;
        prefix = siteID.slice(0, len);
        const conflicts2 = [];
        for (const siteID2 of conflicts) {
          if (siteID2.slice(0, len) === prefix) {
            conflicts2.push(siteID2);
          } else if (prefixes[siteID2].length < len) {
            prefixes[siteID2] = siteID2.slice(0, len);
          }
        }
        conflicts = conflicts2;
      }
      prefixes[siteID] = prefix;
    }
    return ThreadWatcher.prefixes = prefixes;
  },

  build() {
    const nodes = [];
    const threads = ThreadWatcher.getAll();
    ThreadWatcher.setPrefixes(threads);
    for (const { siteID, boardID, threadID, data } of threads) {
      // Add missing excerpt for threads added by Auto Watch
      let thread: any;
      if ((data.excerpt == null) && (siteID === g.SITE.ID) && (thread = g.threads.get(`${boardID}.${threadID}`)) && thread.OP) {
        ThreadWatcher.db.extend({ boardID, threadID, val: { excerpt: Get.threadExcerpt(thread) } });
      }
      nodes.push(ThreadWatcher.makeLine(siteID, boardID, threadID, data));
    }
    const { list } = ThreadWatcher;
    $.rmAll(list);
    $.add(list, nodes);

    ThreadWatcher.refreshIcon();
  },

  refresh(manual) {
    ThreadWatcher.build();

    g.threads.forEach((thread: any) => {
      const isWatched = ThreadWatcher.isWatched(thread);
      if (thread.OP) {
        for (const post of [thread.OP, ...thread.OP.clones]) {
          let toggler: HTMLElement | null;
          if ((toggler = $('.watch-thread-link', post.nodes.info) as HTMLElement | null)) {
            ThreadWatcher.setToggler(toggler, isWatched);
          }
        }
      }
      if (thread.catalogView) { thread.catalogView.nodes.root.classList.toggle('watched', isWatched); }
    });

    if (Conf['Pin Watched Threads']) {
      $.event('SortIndex', { deferred: !(manual && Conf['Index Mode'] === 'catalog') });
    }
  },

  refreshIcon() {
    for (const className of ['replies-unread', 'replies-quoting-you']) {
      ThreadWatcher.shortcut.classList.toggle(className, !!$(`.${className}`, ThreadWatcher.dialog));
    }
  },

  update(siteID, boardID, threadID, newData) {
    let data: any, line: HTMLElement | null;
    if (!(data = ThreadWatcher.db?.get({ siteID, boardID, threadID }))) { return; }
    if (newData.isDead && Conf['Auto Prune']) {
      ThreadWatcher.rm(siteID, boardID, threadID);
      return;
    }
    if (newData.isDead || (newData.last === -1)) {
      for (const key of ['isArchived', 'page', 'lastPage', 'unread', 'quotingyou']) {
        if (!(key in newData)) {
          newData[key] = undefined;
        }
      }
    }
    if ((newData.last != null) && (newData.last < data.last)) {
      newData.modified = undefined;
    }
    let n = 0;
    for (const key in newData) { if (data[key] !== newData[key]) { n++; } }
    if (!n) { return; }
    ThreadWatcher.db.extend({ siteID, boardID, threadID, val: newData });
    if ((line = $(`#watched-threads > [data-site-i-d='${siteID}'][data-full-i-d='${boardID}.${threadID}']`, ThreadWatcher.dialog) as HTMLElement | null)) {
      const newLine = ThreadWatcher.makeLine(siteID, boardID, threadID, data);
      $.replace(line, newLine);
      ThreadWatcher.refreshIcon();
    } else {
      ThreadWatcher.refresh();
    }
  },

  set404(boardID, threadID, cb) {
    let data: any;
    if (!(data = ThreadWatcher.db?.get({ boardID, threadID }))) { return cb(); }
    if (Conf['Auto Prune']) {
      ThreadWatcher.db.delete({ boardID, threadID });
      return cb();
    }
    if (data.isDead && !((data.isArchived != null) || (data.page != null) || (data.lastPage != null) || (data.unread != null) || (data.quotingYou != null))) { return cb(); }
    ThreadWatcher.db.extend({ boardID, threadID, val: { isDead: true, isArchived: undefined, page: undefined, lastPage: undefined, unread: undefined, quotingYou: undefined } }, cb);
  },

  toggle(thread, manual) {
    const siteID   = g.SITE.ID;
    const boardID  = thread.board.ID;
    const threadID = thread.ID;
    if (ThreadWatcher.db.get({ boardID, threadID })) {
      ThreadWatcher.rm(siteID, boardID, threadID, undefined, manual);
    } else {
      ThreadWatcher.add(thread, undefined, manual);
    }
  },

  add(thread, cb, manual) {
    const data: any = {};
    const siteID   = g.SITE.ID;
    const boardID  = thread.board.ID;
    const threadID = thread.ID;
    if (thread.isDead) {
      if (Conf['Auto Prune'] && ThreadWatcher.db.get({ boardID, threadID })) {
        ThreadWatcher.rm(siteID, boardID, threadID, cb);
        return;
      }
      data.isDead = true;
    }
    if (thread.OP) { data.excerpt = Get.threadExcerpt(thread); }
    ThreadWatcher.addRaw(boardID, threadID, data, cb, manual);
  },

  addRaw(boardID, threadID, data, cb, manual) {
    const oldData = ThreadWatcher.db.get({ boardID, threadID, defaultValue: dict() });
    delete oldData.last;
    delete oldData.modified;
    $.extend(oldData, data);
    ThreadWatcher.db.set({ boardID, threadID, val: oldData }, cb);
    ThreadWatcher.refresh(manual);
    const thread = { siteID: g.SITE.ID, boardID, threadID, data: oldData, force: true };
    if (Conf['Show Page'] && !oldData.isDead) {
      ThreadWatcher.fetchBoard([thread]);
    } else if (ThreadWatcher.unreadEnabled && Conf['Show Unread Count']) {
      ThreadWatcher.fetchStatus(thread);
    }
  },

  rm(siteID, boardID, threadID, cb, manual) {
    ThreadWatcher.db.delete({ siteID, boardID, threadID }, cb);
    ThreadWatcher.refresh(manual);
  },

  menu: {
    menu: null,
    init() {
      if (!Conf['Thread Watcher']) { return; }
      const menu = (this.menu = new (UI.Menu as any)('thread watcher'));
      $.on($('.menu-button', ThreadWatcher.dialog) as HTMLElement, 'click', function(this: HTMLElement, e: MouseEvent) {
        menu.toggle(e, this, ThreadWatcher);
      });
      this.addMenuEntries();
    },

    addHeaderMenuEntry() {
      if (g.VIEW !== 'thread') { return; }
      const entryEl = $.el('a', { href: 'javascript:;' });
      Header.menu.addEntry({
        el: entryEl,
        order: 60,
        open() {
          const [addClass, rmClass, text] = !!ThreadWatcher.db.get({ boardID: g.BOARD.ID, threadID: g.THREADID }) ?
            ['unwatch-thread', 'watch-thread', 'Unwatch thread']
          :
            ['watch-thread', 'unwatch-thread', 'Watch thread'];
          $.addClass(entryEl, addClass);
          $.rmClass(entryEl, rmClass);
          entryEl.textContent = text;
          return true;
        }
      });
      $.on(entryEl, 'click', () => ThreadWatcher.toggle(g.threads.get(`${g.BOARD}.${g.THREADID}`), true));
    },

    addMenuEntries() {
      const toggleDisabledDead = function(this: any) {
        this.el.classList.toggle('disabled', !$('.dead-thread', ThreadWatcher.list));
        return true;
      };

      const entries = [
        {
          text: 'Open all threads',
          cb: ThreadWatcher.cb.openAll,
          open(this: any) {
            this.el.classList.toggle('disabled', !ThreadWatcher.list.firstElementChild);
            return true;
          }
        },
        {
          text: 'Clear all threads',
          cb: ThreadWatcher.cb.clear,
          open(this: any) {
            this.el.classList.toggle('disabled', !ThreadWatcher.list.firstElementChild);
            return true;
          }
        },
        {
          text: 'Open unread threads',
          cb: ThreadWatcher.cb.openUnread,
          open(this: any) {
            this.el.classList.toggle('disabled', !$('.replies-unread', ThreadWatcher.list));
            return true;
          }
        },
        {
          text: 'Open unread dead threads',
          cb: ThreadWatcher.cb.openDeads,
          open: toggleDisabledDead,
        },
        {
          text: 'Prune all dead threads',
          cb: ThreadWatcher.cb.pruneDeads,
          open: toggleDisabledDead,
        },
        {
          text: 'Prune read dead threads',
          cb: ThreadWatcher.cb.pruneReadDeads,
          open: toggleDisabledDead,
        },
        {
          text: 'Dismiss posts quoting you',
          title: 'Unhighlight the thread watcher icon and threads until there are new replies quoting you.',
          cb: ThreadWatcher.cb.dismiss,
          open(this: any) {
            this.el.classList.toggle('disabled', !$.hasClass(ThreadWatcher.shortcut, 'replies-quoting-you'));
            return true;
          }
        },
      ];

      for (const { text, title, cb, open } of entries) {
        const entry: any = {
          el: $.el('a', {
            textContent: text,
            href: 'javascript:;'
          })
        };
        if (title) { entry.el.title = title; }
        $.on(entry.el, 'click', cb);
        entry.open = open.bind(entry);
        this.menu.addEntry(entry);
      }

      // Settings checkbox entries:
      for (const name in Config.threadWatcher) {
        const conf = (Config.threadWatcher as any)[name];
        this.addCheckbox(name, conf[1]);
      }
    },

    addCheckbox(name, desc) {
      const entry: any = {
        type: 'thread watcher',
        el: UI.checkbox(name, name.replace(' Thread Watcher', ''))
      };
      entry.el.title = desc;
      const input = entry.el.firstElementChild as HTMLInputElement;
      if ((name === 'Show Unread Count') && !ThreadWatcher.unreadEnabled) {
        input.disabled = true;
        $.addClass(entry.el, 'disabled');
        entry.el.title += '\n[Remember Last Read Post is disabled.]';
      }
      $.on(input, 'change', $.cb.checked);
      if (['Current Board', 'Show Page', 'Show Unread Count', 'Show Site Prefix'].includes(name)) {
        $.on(input, 'change', () => ThreadWatcher.refresh());
      }
      if (['Show Page', 'Show Unread Count', 'Auto Update Thread Watcher'].includes(name)) {
        $.on(input, 'change', ThreadWatcher.fetchAuto);
      }
      this.menu.addEntry(entry);
    }
  }
};

registerThreadWatcherUpdate(ThreadWatcher.update);
registerThreadWatcherLookup(ThreadWatcher.isWatchedRaw);

export default ThreadWatcher;
