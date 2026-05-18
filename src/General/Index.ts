import Callbacks from '../classes/Callbacks';
import CatalogThread from '../classes/CatalogThread';
import Notice from '../classes/Notice';
import Post from '../classes/Post';
import Thread from '../classes/Thread';
import Config from '../config/Config';
import Filter from '../Filtering/Filter';
import PostHiding from '../Filtering/PostHiding';
import ThreadHiding from '../Filtering/ThreadHiding';
import CatalogLinks from '../Miscellaneous/CatalogLinks';
import RelativeDates from '../Miscellaneous/RelativeDates';
import ThreadWatcher from '../Monitoring/ThreadWatcher';
import $$ from '../platform/$$';
import $ from '../platform/$';
import QuotePreview from '../Quotelinks/QuotePreview';
import { c, Conf, d, doc, g } from '../globals/globals';
import Header from './Header';
import UI from './UI';
import Menu from '../Menu/Menu';

import NavLinksPage from './Index/NavLinks.html';
import PageList from './Index/PageList.html';
import BoardConfig from './BoardConfig';
import Get from './Get';
import { dict, SECOND } from '../platform/helpers';
import Icon from '../Icons/icon';

interface IndexType {
  showHiddenThreads: boolean;
  changed: Record<string, boolean>;
  enabled?: boolean;
  search: string;
  currentSort: string;
  currentPage: number;
  button?: HTMLAnchorElement;
  inputs?: Record<string, HTMLInputElement>;
  navLinks?: HTMLDivElement;
  searchInput?: HTMLInputElement;
  hideLabel?: HTMLElement;
  selectRev?: HTMLInputElement;
  selectMode?: HTMLSelectElement;
  selectSort?: HTMLSelectElement;
  selectSize?: HTMLSelectElement;
  lastLongOptions?: HTMLElement;
  lastLongInputs?: HTMLInputElement[];
  lastLongThresholds?: number[];
  root: HTMLDivElement;
  pagelist?: HTMLDivElement;
  pageNum?: number;
  pagesNum?: number;
  threadsNumPerPage?: number;
  liveThreadData?: any[];
  liveThreadIDs?: any[];
  liveThreadDict?: Record<string, any>;
  threadPosition?: Record<string, number>;
  parsedThreads?: Record<string, any>;
  replyData?: Record<string, any>;
  sortedThreadIDs?: any[];
  loaded?: boolean;
  req?: any;
  notice?: any;
  nTimeout?: any;
  initFinishedFired?: boolean;
  // methods
  enabledOn(board: any): boolean;
  init(): void;
  scroll(): void;
  endNotice(): void;
  menu: {
    init(): void;
    cb?: (this: any) => void;
  };
  node(this: any): void;
  catalogNode(this: any): void;
  toggleHide(thread: any): void;
  cycleSortType(): void;
  cb: {
    initFinished(): void;
    postsInserted(): void;
    toggleHiddenThreads(): void;
    mode(this: HTMLSelectElement): void;
    sort(): void;
    resort(e?: any): void;
    perBoardSort(this: HTMLInputElement): void;
    lastLongThresholds(this: HTMLInputElement): void;
    size(e?: any): void;
    replies(): void;
    hover(): void;
    hoverToggle(e: MouseEvent): void;
    popstate(e?: PopStateEvent): void;
    pageNav(e: MouseEvent): void;
    refreshFront(): void;
    catalogReplies(this: any): void;
    hoverAdjust(this: any): void;
  };
  scrollToIndex(): void;
  getCurrentPage(): number;
  userPageNav(page: number): void;
  hashCommands: {
    mode: Record<string, string>;
    sort: Record<string, string>;
  };
  processHash(): number;
  pushState(state: any): void;
  setState(state: any): void;
  savePerBoard(key: string, value: any): void;
  saveSort(): void;
  saveLastLongThresholds(i: number): void;
  pageLoad(scroll?: boolean): void;
  setupMode(): void;
  setupSort(): void;
  getPagesNum(): number;
  getMaxPageNum(): number;
  buildPagelist(): void;
  setPage(): void;
  updateHideLabel(): void;
  update(firstTime?: boolean): void;
  load(this: XMLHttpRequest): void;
  parse(pages: any): void;
  parseThreadList(pages: any): void;
  isHidden(threadID: string | number): boolean;
  isHiddenReply(threadID: string | number, replyData: any): boolean;
  buildThreads(threadIDs: any[], isCatalog: boolean, withReplies?: boolean): any[];
  buildReplies(threads: any[]): any[];
  buildCatalogViews(threads: any[]): void;
  sizeCatalogViews(threads: any[]): void;
  buildCatalogReplies(thread: any): void;
  sort(): void;
  sortOnTop(match: (obj: any) => boolean): void;
  buildIndex(): void;
  threadsOnPage(pageNum: number): any[];
  buildStructure(threadIDs: any[]): void;
  buildCatalog(threadIDs: any[]): void;
  buildCatalogPart(threadIDs: any[]): any[];
  clearSearch(): void;
  setupSearch(): void;
  onSearchInput(): void;
  querySearch(query: string): any[] | undefined;
  searchMatch(obj: any, keywords: string[]): boolean;
}

const Index: IndexType = {
  showHiddenThreads: false,
  changed: {},
  search: '',
  currentSort: '',
  currentPage: 1,
  root: $.el('div', {className: 'board json-index'}) as HTMLDivElement,

  enabledOn({siteID, boardID}) {
    return Conf['JSON Index'] && (g.sites[siteID].software === 'yotsuba') && (boardID !== 'f');
  },

  init() {
    let input: HTMLInputElement, name: string;
    if (g.VIEW !== 'index') { return; }

    // For IndexRefresh events
    $.one(d, '4chanXInitFinished', this.cb.initFinished);
    $.on(d, 'PostsInserted', this.cb.postsInserted);

    if (!this.enabledOn(g.BOARD)) { return; }

    this.enabled = true;

    Callbacks.Post.push({
      name: 'Index Page Numbers',
      cb:   this.node
    });
    Callbacks.CatalogThread.push({
      name: 'Catalog Features',
      cb:   this.catalogNode
    });

    this.search = history.state?.searched || '';
    if (history.state?.mode) {
      Conf['Index Mode'] = history.state?.mode;
    }
    this.currentSort = history.state?.sort;
    if (!this.currentSort) {
      this.currentSort = typeof Conf['Index Sort'] === 'object' ? (
        Conf['Index Sort'][g.BOARD!.ID] || 'bump'
      ) : (
        Conf['Index Sort']
      );
    }
    this.currentPage = this.getCurrentPage();
    this.processHash();

    $.addClass(doc, 'index-loading', `${Conf['Index Mode'].replace(/\ /g, '-')}-mode`);
    $.on(window, 'popstate', this.cb.popstate);
    $.on(d, 'scroll', this.scroll.bind(this));
    $.on(d, 'SortIndex', this.cb.resort);

    // Header refresh button
    this.button = $.el('a', {
      title: 'Refresh',
      href: 'javascript:;',
    }) as HTMLAnchorElement;
    Icon.set(this.button, 'refresh', 'Refresh');
    $.on(this.button, 'click', () => Index.update());
    Header.addShortcut('index-refresh', this.button, 590);

    // Header "Index Navigation" submenu
    const entries: any[] = [];
    const inputs = dict() as Record<string, HTMLInputElement>;
    this.inputs = inputs;
    for (name in Config.Index) {
      const arr = Config.Index[name];
      if (arr instanceof Array) {
        const label = UI.checkbox(name, `${name[0]}${name.slice(1).toLowerCase()}`);
        label.title = arr[1];
        entries.push({el: label});
        input = label.firstChild as HTMLInputElement;
        $.on(input, 'change', $.cb.checked);
        inputs[name] = input;
      }
    }
    $.on(inputs['Show Replies'], 'change', this.cb.replies);
    $.on(inputs['Catalog Hover Expand'], 'change', this.cb.hover);
    $.on(inputs['Pin Watched Threads'], 'change', this.cb.resort);
    $.on(inputs['Anchor Hidden Threads'], 'change', this.cb.resort);

    const watchSettings = function(e: Event) {
      if (input = $.getOwn(inputs, (e.target as HTMLInputElement).name)) {
        input.checked = (e.target as HTMLInputElement).checked;
        $.event('change', null, input);
      }
    };
    $.on(d, 'OpenSettings', () => $.on($.id('fourchanx-settings')!, 'change', watchSettings));

    const sortEntry = UI.checkbox('Per-Board Sort Type', 'Per-board sort type', (typeof Conf['Index Sort'] === 'object'));
    sortEntry.title = 'Set the sorting order of each board independently.';
    $.on(sortEntry.firstChild!, 'change', this.cb.perBoardSort);
    entries.splice(3, 0, {el: sortEntry});

    Header.menu.addEntry({
      el: $.el('span', {textContent: 'Index Navigation'}),
      order: 100,
      subEntries: entries
    });

    // Navigation links at top of index
    this.navLinks = $.el('div', {className: 'navLinks json-index'}) as HTMLDivElement;
    $.extend(this.navLinks, {innerHTML: NavLinksPage});
    ($('.cataloglink a', this.navLinks) as HTMLAnchorElement).href = CatalogLinks.catalog();
    if (!BoardConfig.isArchived(g.BOARD!.ID)) {
      ($('.archlistlink', this.navLinks) as HTMLElement).hidden = true;
    }
    $.on($('#index-last-refresh a', this.navLinks)!, 'click', this.cb.refreshFront);

    // Search field
    this.searchInput = $('#index-search', this.navLinks) as HTMLInputElement;
    this.setupSearch();
    $.on(this.searchInput, 'input', this.onSearchInput.bind(this));
    $.on($('#index-search-clear', this.navLinks)!, 'click', this.clearSearch.bind(this));
    Icon.set($('#index-search-clear', this.navLinks)!, 'xmark');

    // Hidden threads toggle
    this.hideLabel = $('#hidden-label', this.navLinks) as HTMLElement;
    $.on($('#hidden-toggle a', this.navLinks)!, 'click', this.cb.toggleHiddenThreads);

    // Drop-down menus and reverse sort toggle
    this.selectRev   = $('#index-rev',  this.navLinks) as HTMLInputElement;
    this.selectMode  = $('#index-mode', this.navLinks) as HTMLSelectElement;
    this.selectSort  = $('#index-sort', this.navLinks) as HTMLSelectElement;
    this.selectSize  = $('#index-size', this.navLinks) as HTMLSelectElement;
    $.on(this.selectRev,  'change', this.cb.sort);
    $.on(this.selectMode, 'change', this.cb.mode);
    $.on(this.selectSort, 'change', this.cb.sort);
    $.on(this.selectSize, 'change', $.cb.value);
    $.on(this.selectSize, 'change', this.cb.size);
    for (const select of [this.selectMode, this.selectSize]) {
      select.value = Conf[select.name];
    }
    this.selectRev.checked = /-rev$/.test(Index.currentSort);
    this.selectSort.value  = Index.currentSort.replace(/-rev$/, '');

    // Last Long Reply options
    this.lastLongOptions = $('#lastlong-options', this.navLinks) as HTMLElement;
    this.lastLongInputs = $$( 'input', this.lastLongOptions) as HTMLInputElement[];
    this.lastLongThresholds = [0, 0];
    this.lastLongOptions.hidden = (this.selectSort.value !== 'lastlong');
    for (let i = 0; i < this.lastLongInputs.length; i++) {
      input = this.lastLongInputs[i];
      $.on(input, 'change', this.cb.lastLongThresholds);
      const tRaw = Conf[`Last Long Reply Thresholds ${i}`];
      input.value = String(this.lastLongThresholds[i] =
        typeof tRaw === 'object' ? (tRaw[g.BOARD!.ID] ?? 100) : tRaw);
    }

    // Thread container
    $.on(this.root, 'click', this.cb.hoverToggle);
    this.cb.size();
    this.cb.hover();

    // Page list
    this.pagelist = $.el('div', {className: 'pagelist json-index'}) as HTMLDivElement;
    $.extend(this.pagelist, {innerHTML: PageList});
    ($('.cataloglink a', this.pagelist) as HTMLAnchorElement).href = CatalogLinks.catalog();
    $.on(this.pagelist, 'click', this.cb.pageNav);

    this.update(true);

    $.onExists(doc, 'title + *', () => d.title = d.title.replace(/\ -\ Page\ \d+/, ''));

    $.onExists(doc, '.board > .thread > .postContainer, .board + *', function() {
      g.SITE!.Build.hat = $('.board > .thread > img:first-child') as HTMLImageElement;
      if (g.SITE!.Build.hat) {
        g.BOARD!.threads.forEach(function(thread: Thread) {
          if (thread.nodes.root) {
            $.prepend(thread.nodes.root, g.SITE!.Build.hat.cloneNode(false));
          }
        });
        $.addClass(doc, 'hats-enabled');
        $.addStyle(`.catalog-thread::after {background-image: url(${g.SITE!.Build.hat.src});}`);
      }

      const board = $('.board') as HTMLElement;
      $.replace(board, Index.root);
      if (Index.loaded) {
        $.event('PostsInserted', null, Index.root);
      }
      try {
        d.implementation.createDocument(null, null, null).appendChild(board);
      } catch (error) {}

      for (const el of $$('.navLinks')) { $.rm(el); }
      $.rm($.id('ctrl-top')!);
      const topNavPos = $.id('delform')!.previousElementSibling!;
      $.before(topNavPos, $.el('hr'));
      $.before(topNavPos, Index.navLinks!);
      const timeEl = $('#index-last-refresh time', Index.navLinks!) as HTMLElement;
      if (timeEl.dataset.utc) { RelativeDates.update(timeEl); }
    });

    $.on(d, '4chanXInitFinished', function() {
      let pagelist;
      if (pagelist = $('.pagelist')) {
        $.replace(pagelist, Index.pagelist!);
      }
      $.rmClass(doc, 'index-loading');
    });
  },

  scroll() {
    if (Index.req || !Index.liveThreadData || (Conf['Index Mode'] !== 'infinite') || (window.scrollY <= (doc.scrollHeight - (300 + window.innerHeight)))) { return; }
    if (Index.pageNum == null) { Index.pageNum = Index.currentPage; } // Avoid having to pushState to keep track of the current page

    const pageNum = ++Index.pageNum;
    if (pageNum > Index.pagesNum!) { return Index.endNotice(); }

    const threadIDs = Index.threadsOnPage(pageNum);
    Index.buildStructure(threadIDs);
  },

  endNotice: (function() {
    let notify = false;
    const reset = () => notify = false;
    return function() {
      if (notify) { return; }
      notify = true;
      new Notice('info', "Last page reached.", 2);
      setTimeout(reset, 3 * SECOND);
    };
  })(),

  menu: {
    init() {
      if ((g.VIEW !== 'index') || !Conf['Menu'] || !Conf['Thread Hiding Link'] || !Index.enabledOn(g.BOARD)) { return; }

      Menu.menu.addEntry({
        el: $.el('a', {
          href:      'javascript:;',
          className: 'has-shortcut-text'
        }, {innerHTML: "<span></span><span class=\"shortcut-text\">Shift+click</span>"}) as HTMLAnchorElement,
        order: 20,
        open({thread}: any) {
          if (Conf['Index Mode'] !== 'catalog') { return false; }
          this.el.firstElementChild.textContent = thread.isHidden ? 'Unhide' : 'Hide';
          if (this.cb) { $.off(this.el, 'click', this.cb); }
          this.cb = function() {
            $.event('CloseMenu', undefined);
            Index.toggleHide(thread);
          };
          $.on(this.el, 'click', this.cb);
          return true;
        }
      });
    }
  },

  node(this: any) {
    if (this.isReply || this.isClone || (Index.threadPosition![this.ID] == null)) { return; }
    this.thread.setPage(Math.floor(Index.threadPosition![this.ID] / Index.threadsNumPerPage!) + 1);
  },

  catalogNode(this: any) {
    $.on(this.nodes.root, 'click', e => {
      if ((e.button !== 0) || !e.shiftKey) return;
      e.preventDefault();
      getSelection()!.removeAllRanges();
      if (Conf['MD5 Quick Filter in the Catalog'] && (e.target as HTMLElement).classList.contains('catalog-thumb')) {
        Filter.quickFilterMD5.call(this.thread.OP);
      } else {
        Index.toggleHide(this.thread);
      }
    });
  },

  toggleHide(thread) {
    if (Index.showHiddenThreads) {
      ThreadHiding.show(thread);
      if (!ThreadHiding.db!.get({boardID: thread.board.ID, threadID: thread.ID})) { return; }
    } else {
      ThreadHiding.hide(thread);
    }
    ThreadHiding.saveHiddenState(thread);
  },

  cycleSortType() {
    let i;
    const types = (Index.selectSort!.options as any).filter((option: HTMLOptionElement) => !option.disabled);
    for (i = 0; i < types.length; i++) {
      const type = types[i];
      if (type.selected) { break; }
    }
    types[(i + 1) % types.length].selected = true;
    $.event('change', null, Index.selectSort!);
  },

  cb: {
    initFinished() {
      Index.initFinishedFired = true;
      $.queueTask(() => Index.cb.postsInserted());
    },

    postsInserted() {
      if (!Index.initFinishedFired) { return; }
      let n = 0;
      g.posts!.forEach(function(post: Post) {
        if (!post.isFetchedQuote && !(post as any).indexRefreshSeen && doc.contains(post.nodes.root)) {
          (post as any).indexRefreshSeen = true;
          n++;
        }
      });
      if (n) { $.event('IndexRefresh', undefined); }
    },

    toggleHiddenThreads() {
      ($('#hidden-toggle a', Index.navLinks!) as HTMLElement).textContent = (Index.showHiddenThreads = !Index.showHiddenThreads) ? 'Hide' : 'Show';
      Index.sort();
      Index.buildIndex();
    },

    mode(this: HTMLSelectElement) {
      Index.pushState({mode: this.value});
      Index.pageLoad(false);
    },

    sort() {
      const value = Index.selectRev!.checked ? Index.selectSort!.value + "-rev" : Index.selectSort!.value;
      Index.pushState({sort: value});
      Index.pageLoad(false);
    },

    resort(e) {
      Index.changed.order = true;
      if (!e?.detail?.deferred) { Index.pageLoad(false); }
    },

    perBoardSort(this: HTMLInputElement) {
      Conf['Index Sort'] = this.checked ? dict() : '';
      Index.saveSort();
      for (let i = 0; i < 2; i++) {
        Conf[`Last Long Reply Thresholds ${i}`] = this.checked ? dict() : '';
        Index.saveLastLongThresholds(i);
      }
    },

    lastLongThresholds(this: HTMLInputElement) {
      const i = [...this.parentNode!.children].indexOf(this);
      const value = +this.value;
      if (!Number.isFinite(value)) {
        this.value = String(Index.lastLongThresholds![i]);
        return;
      }
      Index.lastLongThresholds![i] = value;
      Index.saveLastLongThresholds(i);
      Index.changed.order = true;
      Index.pageLoad(false);
    },

    size(e) {
      if (Conf['Index Mode'] !== 'catalog') {
        $.rmClass(Index.root, 'catalog-small');
        $.rmClass(Index.root, 'catalog-large');
      } else if (Conf['Index Size'] === 'small') {
        $.addClass(Index.root, 'catalog-small');
        $.rmClass(Index.root,  'catalog-large');
      } else {
        $.addClass(Index.root, 'catalog-large');
        $.rmClass(Index.root,  'catalog-small');
      }
      if (e) { Index.buildIndex(); }
    },

    replies() {
      Index.buildIndex();
    },

    hover() {
      doc.classList.toggle('catalog-hover-expand', Conf['Catalog Hover Expand']);
    },

    hoverToggle(e) {
      if (Conf['Catalog Hover Toggle'] && $.hasClass(doc, 'catalog-mode') && !$.modifiedClick(e) && !$.x('ancestor-or-self::a', e.target as Element)) {
        let thread;
        const input = Index.inputs!['Catalog Hover Expand'];
        input.checked = !input.checked;
        $.event('change', null, input);
        if (thread = Get.threadFromNode(e.target as Element)) {
          Index.cb.catalogReplies.call(thread);
          Index.cb.hoverAdjust.call(thread.OP.nodes);
        }
      }
    },

    popstate(e) {
      if (e?.state) {
        const {searched, mode, sort} = e.state;
        const page = Index.getCurrentPage();
        Index.setState({search: searched, mode, sort, page});
        Index.pageLoad(false);
      } else {
        // page load or hash change
        const nCommands = Index.processHash();
        if (Conf['Refreshed Navigation'] && nCommands) {
          Index.update();
        } else {
          Index.pageLoad();
        }
      }
    },

    pageNav(e) {
      let a;
      if ($.modifiedClick(e)) { return; }
      switch ((e.target as Element).nodeName) {
        case 'BUTTON':
          (e.target as HTMLButtonElement).blur();
          a = (e.target as Element).parentNode as HTMLAnchorElement;
          break;
        case 'A':
          a = e.target as HTMLAnchorElement;
          break;
        default:
          return;
      }
      if (a.textContent === 'Catalog') { return; }
      e.preventDefault();
      Index.userPageNav(+a.pathname.split(/\/+/)[2] || 1);
    },

    refreshFront() {
      Index.pushState({page: 1});
      Index.update();
    },

    catalogReplies(this: any) {
      if (Conf['Show Replies'] && $.hasClass(doc, 'catalog-hover-expand') && !this.catalogView.nodes.replies) {
        Index.buildCatalogReplies(this);
      }
    },

    hoverAdjust(this: any) {
      // Prevent hovered catalog threads from going offscreen.
      let x;
      if (!$.hasClass(doc, 'catalog-hover-expand')) { return; }
      const rect = this.post.getBoundingClientRect();
      if (x = $.minmax(0, -rect.left, doc.clientWidth - rect.right)) {
        const {style} = this.post;
        style.left = `${x}px`;
        style.right = `${-x}px`;
        $.one(this.root, 'mouseleave', () => style.left = (style.right = null));
      }
    }
  },

  scrollToIndex() {
    // Scroll to navlinks, or top of board if navlinks are hidden.
    Header.scrollToIfNeeded((Index.navLinks!.getBoundingClientRect().height ? Index.navLinks! : Index.root));
  },

  getCurrentPage() {
    return +window.location.pathname.split(/\/+/)[2] || 1;
  },

  userPageNav(page) {
    Index.pushState({page});
    if (Conf['Refreshed Navigation']) {
      Index.update();
    } else {
      Index.pageLoad();
    }
  },

  hashCommands: {
    mode: {
      'paged':         'paged',
      'infinite-scrolling': 'infinite',
      'infinite':      'infinite',
      'all-threads':   'all pages',
      'all-pages':     'all pages',
      'catalog':       'catalog'
    },
    sort: {
      'bump-order':        'bump',
      'last-reply':        'lastreply',
      'last-long-reply':   'lastlong',
      'creation-date':     'birth',
      'reply-count':       'replycount',
      'file-count':        'filecount',
      'posts-per-minute':  'activity'
    }
  },

  processHash() {
    let hash = location.href.match(/#.*/)?.[0] || '';
    const state: any = {replace: true};
    const commands = hash.slice(1).split('/');
    const leftover = [];
    for (const command of commands) {
      let mode, sort;
      if (mode = $.getOwn(Index.hashCommands.mode, command)) {
        state.mode = mode;
      } else if (command === 'index') {
        state.mode = Conf['Previous Index Mode'];
        state.page = 1;
      } else if (sort = $.getOwn(Index.hashCommands.sort, command.replace(/-rev$/, ''))) {
        state.sort = sort;
        if (/-rev$/.test(command)) { state.sort += '-rev'; }
      } else if (/^s=/.test(command)) {
        state.search = decodeURIComponent(command.slice(2)).replace(/\+/g, ' ').trim();
      } else {
        leftover.push(command);
      }
    }
    hash = leftover.join('/');
    if (hash) { state.hash = `#${hash}`; }
    Index.pushState(state);
    return commands.length - leftover.length;
  },

  pushState(state) {
    let {search, hash, replace} = state;
    let pageBeforeSearch = history.state?.oldpage;
    if ((search != null) && (search !== Index.search)) {
      state.page = search ? 1 : (pageBeforeSearch || 1);
      if (!search) {
        pageBeforeSearch = undefined;
      } else if (!Index.search) {
        pageBeforeSearch = Index.currentPage;
      }
    }
    Index.setState(state);
    const pathname = Index.currentPage === 1 ? `/${g.BOARD}/` : `/${g.BOARD}/${Index.currentPage}`;
    if (!hash) { hash = ''; }
    history[replace ? 'replaceState' : 'pushState']({
      mode:     Conf['Index Mode'],
      sort:     Index.currentSort,
      searched: Index.search,
      oldpage:  pageBeforeSearch
    }, '', `${location.protocol}//${location.host}${pathname}${hash}`);
  },

  setState({search, mode, sort, page, hash}) {
    if ((search != null) && (search !== Index.search)) {
      Index.changed.search = true;
      Index.search = search;
    }
    if ((mode != null) && (mode !== Conf['Index Mode'])) {
      Index.changed.mode = true;
      Conf['Index Mode'] = mode;
      $.set('Index Mode', mode);
      if ((mode !== 'catalog') && (Conf['Previous Index Mode'] !== mode)) {
        Conf['Previous Index Mode'] = mode;
        $.set('Previous Index Mode', mode);
      }
    }
    if ((sort != null) && (sort !== Index.currentSort)) {
      Index.changed.sort = true;
      Index.currentSort = sort;
      Index.saveSort();
    }
    if (['all pages', 'catalog'].includes(Conf['Index Mode'])) { page = 1; }
    if ((page != null) && (page !== Index.currentPage)) {
      Index.changed.page = true;
      Index.currentPage = page;
    }
    if (hash != null) {
      Index.changed.hash = true;
    }
  },

  savePerBoard(key, value) {
    if (typeof Conf[key] === 'object') {
      Conf[key][g.BOARD!.ID] = value;
    } else {
      Conf[key] = value;
    }
    $.set(key, Conf[key]);
  },

  saveSort() {
    Index.savePerBoard('Index Sort', Index.currentSort);
  },

  saveLastLongThresholds(i) {
    Index.savePerBoard(`Last Long Reply Thresholds ${i}`, Index.lastLongThresholds![i]);
  },

  pageLoad(scroll=true) {
    if (!Index.liveThreadData) { return; }
    let {threads, order, search, mode, sort, page, hash} = Index.changed;
    if (!threads) { threads = search; }
    if (!order) { order = sort; }
    if (threads || order) { Index.sort(); }
    if (threads) { Index.buildPagelist(); }
    if (search) { Index.setupSearch(); }
    if (mode) { Index.setupMode(); }
    if (sort) { Index.setupSort(); }
    if (threads || mode || page || order) { Index.buildIndex(); }
    if (threads || page) { Index.setPage(); }
    if (scroll && !hash) { Index.scrollToIndex(); }
    Index.changed = {};
  },

  setupMode() {
    for (const mode of ['paged', 'infinite', 'all pages', 'catalog']) {
      $[mode === Conf['Index Mode'] ? 'addClass' : 'rmClass'](doc, `${mode.replace(/\ /g, '-')}-mode`);
    }
    Index.selectMode!.value = Conf['Index Mode'];
    Index.cb.size();
    Index.showHiddenThreads = false;
    ($('#hidden-toggle a', Index.navLinks!) as HTMLElement).textContent = 'Show';
  },

  setupSort() {
    Index.selectRev!.checked = /-rev$/.test(Index.currentSort);
    Index.selectSort!.value  = Index.currentSort.replace(/-rev$/, '');
    Index.lastLongOptions!.hidden = (Index.selectSort!.value !== 'lastlong');
  },

  getPagesNum() {
    if (Index.search) {
      return Math.ceil(Index.sortedThreadIDs!.length / Index.threadsNumPerPage!);
    } else {
      return Index.pagesNum!;
    }
  },

  getMaxPageNum() {
    return Math.max(1, Index.getPagesNum());
  },

  buildPagelist() {
    const pagesRoot = $('.pages', Index.pagelist!) as HTMLElement;
    const maxPageNum = Index.getMaxPageNum();
    if (pagesRoot.childElementCount !== maxPageNum) {
      const nodes = [];
      for (let i = 1, end = maxPageNum; i <= end; i++) {
        const a = $.el('a', {
          textContent: String(i),
          href: i === 1 ? './' : String(i)
        });
        nodes.push($.tn('['), a, $.tn('] '));
      }
      $.rmAll(pagesRoot);
      $.add(pagesRoot, nodes);
    }
  },

  setPage() {
    let a, strong;
    const pageNum    = Index.currentPage;
    const maxPageNum = Index.getMaxPageNum();
    const pagesRoot  = $('.pages', Index.pagelist!) as HTMLElement;

    // Previous/Next buttons
    const prev = pagesRoot.previousElementSibling!.firstElementChild as HTMLAnchorElement;
    const next = pagesRoot.nextElementSibling!.firstElementChild as HTMLAnchorElement;
    let href = Math.max(pageNum - 1, 1);
    prev.href = href === 1 ? './' : String(href);
    (prev.firstElementChild as HTMLButtonElement).disabled = href === pageNum;
    href = Math.min(pageNum + 1, maxPageNum);
    next.href = href === 1 ? './' : String(href);
    (next.firstElementChild as HTMLButtonElement).disabled = href === pageNum;

    // <strong> current page
    if (strong = $('strong', pagesRoot)) {
      if (+strong.textContent! === pageNum) { return; }
      $.replace(strong, strong.firstChild!);
    } else {
      strong = $.el('strong');
    }

    if (a = pagesRoot.children[pageNum - 1]) {
      $.before(a, strong);
      $.add(strong, a);
    }
  },

  updateHideLabel() {
    if (!Index.hideLabel) { return; }
    let hiddenCount = 0;
    for (const threadID of Index.liveThreadIDs!) {
      if (Index.isHidden(threadID)) {
        hiddenCount++;
      }
    }
    if (!hiddenCount) {
      Index.hideLabel.hidden = true;
      if (Index.showHiddenThreads) { Index.cb.toggleHiddenThreads(); }
      return;
    }
    Index.hideLabel.hidden = false;
    ($('#hidden-count', Index.navLinks!) as HTMLElement).textContent = hiddenCount === 1 ?
      '1 hidden thread'
    :
      `${hiddenCount} hidden threads`;
  },

  update(firstTime) {
    let oldReq;
    if (oldReq = Index.req) {
      delete Index.req;
      oldReq.abort();
    }

    if (Conf['Index Refresh Notifications']) {
      if (!Index.notice) { Index.notice = new Notice('info', 'Refreshing index...'); }
      if (!Index.nTimeout) {
        Index.nTimeout = setTimeout(() => {
          if (Index.notice) {
            Index.notice.el.lastElementChild.textContent += ' (disable JSON Index if this takes too long)';
          }
        }, 3 * SECOND);
      }
    } else {
      if (!Index.nTimeout) {
        Index.nTimeout = setTimeout(() => Index.notice || (Index.notice = new Notice('info', 'Refreshing index... (disable JSON Index if this takes too long)')), 3 * SECOND);
      }
    }

    if (!firstTime && (d.readyState !== 'loading') && !$('.board + *')) {
      location.reload();
      return;
    }

    Index.req = $.whenModified(
      g.SITE!.urls.catalogJSON({boardID: g.BOARD!.ID}),
      'Index',
      Index.load
    );
    $.addClass(Index.button!, 'spin');
  },

  load(this: XMLHttpRequest) {
    let err;
    if (this !== Index.req) { return; } // aborted

    $.rmClass(Index.button!, 'spin');
    const {notice, nTimeout} = Index;
    if (nTimeout) { clearTimeout(nTimeout); }
    delete Index.nTimeout;
    delete Index.req;
    delete Index.notice;

    if (![200, 304].includes(this.status)) {
      err = `Index refresh failed. ${this.status ? `Error ${this.statusText} (${this.status})` : 'Connection Error'}`;
      if (notice) {
        notice.setType('warning');
        notice.el.lastElementChild.textContent = err;
        setTimeout(notice.close, SECOND);
      } else {
        new Notice('warning', err, 1);
      }
      return;
    }

    try {
      if (this.status === 200) {
        Index.parse(this.response);
      } else if (this.status === 304) {
        Index.pageLoad();
      }
    } catch (error: any) {
      err = error;
      c.error(`Index failure: ${err.message}`, err.stack);
      if (notice) {
        notice.setType('error');
        notice.el.lastElementChild.textContent = 'Index refresh failed.';
        setTimeout(notice.close, SECOND);
      } else {
        new Notice('error', 'Index refresh failed.', 1);
      }
      return;
    }

    if (notice) {
      if (Conf['Index Refresh Notifications']) {
        notice.setType('success');
        notice.el.lastElementChild.textContent = 'Index refreshed!';
        setTimeout(notice.close, SECOND);
      } else {
        notice.close();
      }
    }

    const timeEl = $('#index-last-refresh time', Index.navLinks!) as HTMLElement;
    timeEl.dataset.utc = String(Date.parse(this.getResponseHeader('Last-Modified') || ''));
    RelativeDates.update(timeEl);
  },

  parse(pages) {
    $.cleanCache(url => /^https?:\/\/a\.4cdn\.org\//.test(url));
    Index.parseThreadList(pages);
    Index.changed.threads = true;
    Index.pageLoad();
  },

  parseThreadList(pages) {
    Index.pagesNum          = pages.length;
    Index.threadsNumPerPage = pages[0]?.threads.length || 1;
    Index.liveThreadData    = pages.reduce(((arr: any[], next: any) => arr.concat(next.threads)), []);
    Index.liveThreadIDs     = Index.liveThreadData!.map(data => data.no);
    Index.liveThreadDict    = dict();
    Index.threadPosition    = dict();
    Index.parsedThreads     = dict();
    Index.replyData         = dict();
    for (let i = 0; i < Index.liveThreadData!.length; i++) {
      let obj: any;
      const data = Index.liveThreadData![i];
      Index.liveThreadDict![data.no] = data;
      Index.threadPosition![data.no] = i;
      Index.parsedThreads![data.no] = (obj = g.SITE!.Build.parseJSON(data, g.BOARD!));
      const results = Filter.test(obj);
      obj.isOnTop  = results.top;
      obj.isHidden = results.hide || ThreadHiding.isHidden(obj.boardID, obj.threadID);
      if (data.last_replies) {
        for (const reply of data.last_replies) {
          Index.replyData![`${g.BOARD!.ID}.${reply.no}`] = reply;
        }
      }
    }
    if (Index.liveThreadData![0]) {
      g.SITE!.Build.spoilerRange[g.BOARD!.ID] = Index.liveThreadData![0].custom_spoiler;
    }
    g.BOARD!.threads.forEach(function(thread: Thread) {
      if (!Index.liveThreadIDs!.includes(thread.ID)) { thread.collect(); }
    });
    $.event('IndexUpdate', {threads: ((Index.liveThreadIDs!.map((ID) => `${g.BOARD!.ID}.${ID}`)))});
  },

  isHidden(threadID) {
    let thread;
    if ((thread = g.BOARD!.threads.get(threadID)) && thread.OP && !thread.OP.isFetchedQuote) {
      return thread.isHidden;
    } else {
      return Index.parsedThreads![threadID].isHidden;
    }
  },

  isHiddenReply(threadID, replyData) {
    return PostHiding.isHidden(g.BOARD!.ID, threadID, replyData.no) || Filter.isHidden(g.SITE!.Build.parseJSON(replyData, g.BOARD!));
  },

  buildThreads(threadIDs, isCatalog, withReplies) {
    let errors: any[] | undefined;
    const threads: Thread[] = [];
    const newThreads: Thread[] = [];
    let newPosts: Post[] = [];
    for (const ID of threadIDs) {
      let opRoot, thread;
      try {
        let OP: Post;
        const threadData = Index.liveThreadDict![ID];

        if (thread = g.BOARD!.threads.get(ID)) {
          const isStale = (thread.json !== threadData) && (JSON.stringify(thread.json) !== JSON.stringify(threadData));
          if (isStale) {
            thread.setCount('post', threadData.replies + 1,                threadData.bumplimit);
            thread.setCount('file', threadData.images  + !!threadData.ext, threadData.imagelimit);
            thread.setStatus('Sticky', !!threadData.sticky);
            thread.setStatus('Closed', !!threadData.closed);
          }
          if (thread.catalogView) {
            $.rm(thread.catalogView.nodes.replies);
            thread.catalogView.nodes.replies = null;
          }
        } else {
          thread = new Thread(ID, g.BOARD!);
          newThreads.push(thread);
        }
        const lastPost = threadData.last_replies && threadData.last_replies.length ? threadData.last_replies[threadData.last_replies.length - 1].no : ID;
        if (lastPost > thread.lastPost) { thread.lastPost = lastPost; }
        thread.json = threadData;
        threads.push(thread);

        if ((OP = thread.OP!) && !OP.isFetchedQuote) {
          OP.setCatalogOP(isCatalog);
          thread.setPage(Math.floor(Index.threadPosition![ID] / Index.threadsNumPerPage!) + 1);
        } else {
          const obj = Index.parsedThreads![ID];
          opRoot = g.SITE!.Build.post(obj);
          OP = new Post(opRoot, thread, g.BOARD!);
          OP.filterResults = obj.filterResults;
          newPosts.push(OP);
        }

        if (!isCatalog || !thread.nodes.root) {
          g.SITE!.Build.thread(thread, threadData, withReplies);
        }
      } catch (err) {
        if (!errors) { errors = []; }
        errors.push({
          message: `Parsing of Thread No.${thread} failed. Thread will be skipped.`,
          error: err,
          html: opRoot?.outerHTML
        });
      }
    }
    if (errors) { Callbacks.errorHandler?.(errors); }

    if (withReplies) {
      newPosts = newPosts.concat(Index.buildReplies(threads));
    }

    for (const thread of newThreads) { Callbacks.Thread.execute(thread); }
    for (const post of newPosts) { Callbacks.Post.execute(post); }
    Index.updateHideLabel();
    $.event('IndexRefreshInternal', {threadIDs: (threads.map((t) => t.fullID)), isCatalog});

    return threads;
  },

  buildReplies(threads) {
    let errors: any[] | undefined;
    const posts: Post[] = [];
    for (const thread of threads) {
      let lastReplies;
      if (!(lastReplies = Index.liveThreadDict![thread.ID].last_replies)) { continue; }
      const nodes = [];
      for (const data of lastReplies) {
        let node, post;
        if ((post = thread.posts.get(data.no)) && !post.isFetchedQuote) {
          nodes.push(post.nodes.root);
          continue;
        }
        nodes.push(node = g.SITE!.Build.postFromObject(data, thread.board.ID));
        try {
          posts.push(new Post(node, thread, thread.board));
        } catch (err) {
          if (!errors) { errors = []; }
          errors.push({
            message: `Parsing of Post No.${data.no} failed. Post will be skipped.`,
            error: err,
            html: node?.outerHTML
          });
        }
      }
      $.add(thread.nodes.root, nodes);
    }

    if (errors) { Callbacks.errorHandler?.(errors); }
    return posts;
  },

  buildCatalogViews(threads) {
    const catalogThreads = [];
    for (const thread of threads) {
      if (!thread.catalogView) {
        const {ID} = thread;
        const page = Math.floor(Index.threadPosition![ID] / Index.threadsNumPerPage!) + 1;
        const root = g.SITE!.Build.catalogThread(thread, Index.liveThreadDict![ID], page);
        catalogThreads.push(new CatalogThread(root, thread));
      }
    }
    for (const catalogThread of catalogThreads) { Callbacks.CatalogThread.execute(catalogThread); }
  },

  sizeCatalogViews(threads) {
    const size = Conf['Index Size'] === 'small' ? 150 : 250;
    for (const thread of threads) {
      const {thumb} = thread.catalogView.nodes;
      const {width, height} = thumb.dataset;
      if (!width) { continue; }
      const ratio = size / Math.max(width, height);
      thumb.style.width  = (Number(width)  * ratio) + 'px';
      thumb.style.height = (Number(height) * ratio) + 'px';
    }
  },

  buildCatalogReplies(thread) {
    let lastReplies;
    const {nodes} = thread.catalogView;
    if (!(lastReplies = Index.liveThreadDict![thread.ID].last_replies)) { return; }

    const replies = [];
    for (const data of lastReplies) {
      if (Index.isHiddenReply(thread.ID, data)) { continue; }
      const reply = g.SITE!.Build.catalogReply(thread, data);
      RelativeDates.update($('time', reply)!);
      $.on($('.catalog-reply-preview', reply)!, 'mouseover', QuotePreview.mouseover);
      replies.push(reply);
    }

    nodes.replies = $.el('div', {className: 'catalog-replies'}) as HTMLDivElement;
    $.add(nodes.replies, replies);
    $.add(thread.OP.nodes.post, nodes.replies);
  },

  sort() {
    let threadIDs;
    const {liveThreadIDs, liveThreadData} = Index;
    if (!liveThreadData) { return; }
    const tmp_time = new Date().getTime()/1000;
    const sortType = Index.currentSort.replace(/-rev$/, '');
    Index.sortedThreadIDs = (() => { switch (sortType) {
      case 'lastreply': case 'lastlong':
        const repliesAvailable = liveThreadData.some(thread => thread.last_replies?.length);
        const lastlong = function(thread: any) {
          if (!repliesAvailable) {
            return thread.last_modified;
          }
          const iterable = thread.last_replies || [];
          for (let i = iterable.length - 1; i >= 0; i--) {
            const r = iterable[i];
            if (Index.isHiddenReply(thread.no, r)) { continue; }
            if (sortType === 'lastreply') {
              return r;
            }
            const len = r.com ? g.SITE!.Build.parseComment(r.com).replace(/[^a-z]/ig, '').length : 0;
            if (len >= Index.lastLongThresholds![+!!r.ext]) {
              return r;
            }
          }
          if (thread.omitted_posts && thread.last_replies?.length) { return thread.last_replies[0]; } else { return thread; }
        };
        const lastlongD = dict() as Record<string, number>;
        for (const thread of liveThreadData) {
          lastlongD[thread.no] = lastlong(thread).no;
        }
        return [...liveThreadData].sort((a, b) => lastlongD[b.no] - lastlongD[a.no]).map(post => post.no);
      case 'bump':       return liveThreadIDs;
      case 'birth':      return [...liveThreadIDs! ].sort((a, b) => b - a);
      case 'replycount': return [...liveThreadData].sort((a, b) => b.replies - a.replies).map(post => post.no);
      case 'filecount':  return [...liveThreadData].sort((a, b) => b.images  - a.images).map(post => post.no);
      case 'activity':   return [...liveThreadData].sort((a, b) => ((tmp_time-a.time)/(a.replies+1)) - ((tmp_time-b.time)/(b.replies+1))).map(post => post.no);
      default: return liveThreadIDs;
    } })();
    if (/-rev$/.test(Index.currentSort)) {
      Index.sortedThreadIDs!.reverse();
    }
    if (Index.search && (threadIDs = Index.querySearch(Index.search))) {
      Index.sortedThreadIDs = threadIDs;
    }
    // Sticky threads
    Index.sortOnTop(obj => obj.isSticky);
    // Highlighted threads
    Index.sortOnTop(obj => obj.isOnTop || (Conf['Pin Watched Threads'] && ThreadWatcher.isWatchedRaw(obj.boardID, obj.threadID)));
    // Non-hidden threads
    if (Conf['Anchor Hidden Threads']) { Index.sortOnTop(obj => !Index.isHidden(obj.threadID)); }
  },

  sortOnTop(match) {
    const topThreads: any[] = [];
    const bottomThreads: any[] = [];
    for (const ID of Index.sortedThreadIDs!) {
      (match(Index.parsedThreads![ID]) ? topThreads : bottomThreads).push(ID);
    }
    Index.sortedThreadIDs = topThreads.concat(bottomThreads);
  },

  buildIndex() {
    let threadIDs;
    if (!Index.liveThreadData) { return; }
    switch (Conf['Index Mode']) {
      case 'all pages':
        threadIDs = Index.sortedThreadIDs!;
        break;
      case 'catalog':
        threadIDs = Index.sortedThreadIDs!.filter(ID => !Index.isHidden(ID) !== Index.showHiddenThreads);
        break;
      default:
        threadIDs = Index.threadsOnPage(Index.currentPage);
    }
    delete Index.pageNum;
    $.rmAll(Index.root);
    $.rmAll(Header.hover);
    if (Index.loaded && Index.root.parentNode) {
      $.event('PostsRemoved', null, Index.root);
    }
    if (Conf['Index Mode'] === 'catalog') {
      Index.buildCatalog(threadIDs);
    } else {
      Index.buildStructure(threadIDs);
    }
  },

  threadsOnPage(pageNum) {
    const nodesPerPage = Index.threadsNumPerPage!;
    const offset = nodesPerPage * (pageNum - 1);
    return Index.sortedThreadIDs!.slice(offset ,  offset + nodesPerPage);
  },

  buildStructure(threadIDs) {
    const threads = Index.buildThreads(threadIDs, false, Conf['Show Replies']);
    const nodes = [];
    for (const thread of threads) {
      nodes.push(thread.nodes.root, $.el('hr'));
    }
    $.add(Index.root, nodes);
    if (Index.root.parentNode) {
      $.event('PostsInserted', null, Index.root);
    }
    Index.loaded = true;
  },

  buildCatalog(threadIDs) {
    let i = 0;
    const n = threadIDs.length;
    let node0: any = null;
    const fn = function() {
      if (node0 && !node0.parentNode) { return; } // Index.root cleared
      const j = (i > 0) && Index.root.parentNode ? n : i + 30;
      node0 = Index.buildCatalogPart(threadIDs.slice(i, j))[0];
      i = j;
      if (i < n) {
        $.queueTask(fn);
      } else {
        if (Index.root.parentNode) {
          $.event('PostsInserted', null, Index.root);
        }
        Index.loaded = true;
      }
    };
    fn();
  },

  buildCatalogPart(threadIDs) {
    const threads = Index.buildThreads(threadIDs, true);
    Index.buildCatalogViews(threads);
    Index.sizeCatalogViews(threads);
    const nodes: HTMLElement[] = [];
    for (const thread of threads) {
      thread.OP.setCatalogOP(true);
      $.add(thread.catalogView.nodes.root, thread.OP.nodes.root);
      nodes.push(thread.catalogView.nodes.root);
      $.on(thread.catalogView.nodes.root, 'mouseenter', Index.cb.catalogReplies.bind(thread));
      $.on(thread.OP.nodes.root, 'mouseenter', Index.cb.hoverAdjust.bind(thread.OP.nodes));
    }
    $.add(Index.root, nodes);
    return nodes;
  },

  clearSearch() {
    Index.searchInput!.value = '';
    Index.onSearchInput();
    Index.searchInput!.focus();
  },

  setupSearch() {
    Index.searchInput!.value = Index.search;
    if (Index.search) {
      Index.searchInput!.dataset.searching = '1';
    } else {
      Index.searchInput!.removeAttribute('data-searching');
    }
  },

  onSearchInput() {
    const search = Index.searchInput!.value.trim();
    if (search === Index.search) { return; }
    Index.pushState({
      search,
      replace: !search === !Index.search
    });
    Index.pageLoad(false);
  },

  querySearch(query) {
    let keywords, match;
    if (match = query.match(/^([\w+]+):\/(.*)\/(\w*)$/)) {
      let regexp: RegExp;
      try {
        regexp = RegExp(match[2], match[3]);
      } catch (error) {
        return [];
      }
      return Index.sortedThreadIDs!.filter(ID => regexp.test(Filter.values(match[1], Index.parsedThreads![ID]).join('\n')));
    }
    if (!(keywords = query.toLowerCase().match(/\S+/g))) { return; }
    return Index.sortedThreadIDs!.filter(ID => Index.searchMatch(Index.parsedThreads![ID], keywords));
  },

  searchMatch(obj, keywords) {
    const {info, file} = obj;
    if (info.comment == null) { info.comment = g.SITE!.Build.parseComment(info.commentHTML.innerHTML); }
    const text: string[] = [];
    for (const key of ['comment', 'subject', 'name', 'tripcode']) {
      if (key in info) { text.push(info[key]); }
    }
    if (file) { text.push(file.name); }
    const textJoined = text.join(' ').toLowerCase();
    for (const keyword of keywords) {
      if (-1 === textJoined.indexOf(keyword)) { return false; }
    }
    return true;
  }
};

export default Index;
