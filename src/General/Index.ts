/**
 * @module Index
 * @description
 * Manages the main index page (board view or catalog view) of 4chan XTd.
 * Handles the initialization, rendering, sorting, searching, and pagination of threads.
 * Provides features like infinite scrolling, catalog mode, hidden threads toggle,
 * and custom sorting options.
 */
import Callbacks from '../classes/Callbacks';
import CatalogThread from '../classes/CatalogThread';
import Notice from '../classes/Notice';
import Post from '../classes/Post';
import Thread from '../classes/Thread';
import Config from '../config/Config';
import Filter from '../Filtering/Filter';
import PostHiding from '../Filtering/PostHiding';
import ThreadHiding from '../Filtering/ThreadHiding';
import { resolveBoardURL } from './HeaderBoardLists';
import RelativeDates from '../Miscellaneous/RelativeDates';
import { isThreadWatched } from '../Monitoring/ThreadWatcherBridge';
import $$ from '../platform/$$';
import $ from '../platform/$';
import { runQuotePreviewMouseover } from '../Quotelinks/QuotePreviewActions';
import { c, Conf, d, doc, g } from '../globals/globals';
import UIState from '../globals/UIState';
import UI from './UI';
import Menu from '../Menu/Menu';

import NavLinksPage from './Index/NavLinks.html';
import PageList from './Index/PageList.html';
import BoardConfig from './BoardConfig';
import Get from './Get';
import { dict, SECOND } from '../platform/helpers';
import Icon from '../Icons/icon';
import IndexState from '../globals/IndexState';

/**
 * The Index controller object.
 * @namespace Index
 * @property {boolean} showHiddenThreads - Whether to display hidden threads.
 * @property {object} changed - Tracks which parts of the state have changed to trigger updates.
 */
const Index: any = {
  get showHiddenThreads() { return IndexState.showHiddenThreads; },
  set showHiddenThreads(val: boolean) { IndexState.showHiddenThreads = val; },

  get sortedThreadIDs() { return IndexState.sortedThreadIDs; },
  set sortedThreadIDs(val: number[]) { IndexState.sortedThreadIDs = val; },

  get root() { return IndexState.root; },
  set root(val: HTMLElement | null) { IndexState.root = val; },

  changed: {} as Record<string, boolean>,

  /**
   * Checks if the Index feature is enabled for a specific site and board.
   * @param {object} options
   * @param {string} options.siteID - The site ID.
   * @param {string} options.boardID - The board ID.
   * @returns {boolean} True if the index is enabled.
   */
  enabledOn({siteID, boardID}: {siteID: string, boardID: string}) {
    return Conf['JSON Index'] && (g.sites[siteID].software === 'yotsuba') && (boardID !== 'f');
  },

  /**
   * Initializes the Index features, UI elements, event listeners, and parses the URL hash state.
   */
  init() {
    let input: HTMLInputElement, inputs: Record<string, HTMLInputElement>, name: string;
    if (g.VIEW !== 'index') { return; }

    // For IndexRefresh events
    $.one(d, '4chanXInitFinished', this.cb.initFinished);
    $.on(d, 'PostsInserted', this.cb.postsInserted);

    if (!this.enabledOn(g.BOARD as any)) { return; }

    this.enabled = (IndexState.enabled = true);

    $.on(d, 'ThreadHidingUpdate', () => this.updateHideLabel());

    Callbacks.Post.push({
      name: 'Index Page Numbers',
      cb:   this.node
    });
    Callbacks.CatalogThread.push({
      name: 'Catalog Features',
      cb:   this.catalogNode
    });

    this.search = (history.state as any)?.searched || '';
    if ((history.state as any)?.mode) {
      Conf['Index Mode'] = (history.state as any).mode;
    }
    this.currentSort = (history.state as any)?.sort;
    if (!this.currentSort) { this.currentSort = typeof Conf['Index Sort'] === 'object' ? (
        Conf['Index Sort'][g.BOARD.ID] || 'bump'
      ) : (
        Conf['Index Sort']
      ); }
    this.currentPage = this.getCurrentPage();
    this.processHash();

    $.addClass(doc, 'index-loading', `${Conf['Index Mode'].replace(/ /g, '-')}-mode`);
    $.on(window, 'popstate', this.cb.popstate);
    $.on(d, 'scroll', this.scroll);
    $.on(d, 'SortIndex', this.cb.resort);

    // Header refresh button
    this.button = $.el('a', {
      title: 'Refresh',
      href: 'javascript:;',
    });
    Icon.set(this.button, 'refresh', 'Refresh')
    $.on(this.button, 'click', () => Index.update());
    UIState.addShortcut('index-refresh', this.button, 590);

    // Header "Index Navigation" submenu
    const entries: any[] = [];
    this.inputs = (inputs = dict());
    for (name in Config.Index) {
      const arr = Config.Index[name];
      if (Array.isArray(arr)) {
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

    const watchSettings = function(e: any) {
      const targetInput = $.getOwn(inputs, e.target.name);
      if (targetInput) {
        targetInput.checked = e.target.checked;
        return ($.event as any)('change', null, targetInput);
      }
    };
    $.on(d, 'OpenSettings', () => $.on($.id('fourchanx-settings'), 'change', watchSettings));

    const sortEntry = UI.checkbox('Per-Board Sort Type', 'Per-board sort type', (typeof Conf['Index Sort'] === 'object'));
    sortEntry.title = 'Set the sorting order of each board independently.';
    $.on(sortEntry.firstChild!, 'change', this.cb.perBoardSort);
    entries.splice(3, 0, {el: sortEntry});

    UIState.headerMenu.addEntry({
      el: $.el('span',
        {textContent: 'Index Navigation'}),
      order: 100,
      subEntries: entries
    });

    // Navigation links at top of index
    this.navLinks = $.el('div', {className: 'navLinks json-index'});
    $.extend(this.navLinks, {innerHTML: NavLinksPage});
    ($('.cataloglink a', this.navLinks) as HTMLAnchorElement).href = resolveBoardURL('catalog', g.BOARD) || Get.url('catalog', g.BOARD);
    if (!BoardConfig.isArchived(g.BOARD.ID)) { ($('.archlistlink', this.navLinks) as HTMLElement).hidden = true; }
    $.on($('#index-last-refresh a', this.navLinks)!, 'click', this.cb.refreshFront);

    // Search field
    this.searchInput = $('#index-search', this.navLinks) as HTMLInputElement;
    this.setupSearch();
    $.on(this.searchInput, 'input', this.onSearchInput);
    $.on($('#index-search-clear', this.navLinks) as HTMLElement, 'click', this.clearSearch);
    Icon.set($('#index-search-clear', this.navLinks) as HTMLElement, 'xmark');

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
    this.selectRev.checked = Index.currentSort.endsWith('-rev');
    this.selectSort.value  = Index.currentSort.replace(/-rev$/, '');

    // Last Long Reply options
    this.lastLongOptions = $('#lastlong-options', this.navLinks) as HTMLElement;
    this.lastLongInputs = $$('input', this.lastLongOptions) as HTMLInputElement[];
    this.lastLongThresholds = [0, 0];
    this.lastLongOptions.hidden = (this.selectSort.value !== 'lastlong');
    for (let i = 0; i < this.lastLongInputs.length; i++) {
      const currentInput = this.lastLongInputs[i];
      $.on(currentInput, 'change', this.cb.lastLongThresholds);
      const tRaw = Conf[`Last Long Reply Thresholds ${i}`];
      currentInput.value = (this.lastLongThresholds[i] =
        typeof tRaw === 'object' ? (tRaw[g.BOARD.ID] ?? 100) : tRaw);
    }

    // Thread container
    this.root = (IndexState.root = $.el('div', {className: 'board json-index'}));
    $.on(this.root, 'click', this.cb.hoverToggle);
    this.cb.size();
    this.cb.hover();

    // Page list
    this.pagelist = $.el('div', {className: 'pagelist json-index'});
    $.extend(this.pagelist, {innerHTML: PageList});
    ($('.cataloglink a', this.pagelist) as HTMLAnchorElement).href = resolveBoardURL('catalog', g.BOARD) || Get.url('catalog', g.BOARD);
    $.on(this.pagelist, 'click', this.cb.pageNav);

    this.update(true);

    $.onExists(doc, 'title + *', () => d.title = d.title.replace(/ - Page \d+/, ''));

    $.onExists(doc, '.board > .thread > .postContainer, .board + *', function() {
      let el;
      g.SITE.Build.hat = $('.board > .thread > img:first-child') as HTMLImageElement;
      if (g.SITE.Build.hat) {
        g.BOARD.threads.forEach(function(thread: any) {
          if (thread.nodes.root) {
            return $.prepend(thread.nodes.root, g.SITE.Build.hat.cloneNode(false));
          }
        });
        $.addClass(doc, 'hats-enabled');
        $.addStyle(`.catalog-thread::after {background-image: url(${g.SITE.Build.hat.src});}`, undefined);
      }

      const board = $('.board') as HTMLElement;
      $.replace(board, Index.root);
      if (Index.loaded) {
        ($.event as any)('PostsInserted', null, Index.root);
      }
      // Hacks:
      // - When removing an element from the document during page load,
      //   its ancestors will still be correctly created inside of it.
      // - Creating loadable elements inside of an origin-less document
      //   will not download them.
      // - Combine the two and you get a download canceller!
      //   Does not work on Firefox unfortunately. bugzil.la/939713
      try {
        d.implementation.createDocument(null, null, null).appendChild(board);
      } catch (error_) { // NOSONAR
      }

      for (el of $$('.navLinks')) { $.rm(el); }
      $.rm($.id('ctrl-top')!);
      const topNavPos = $.id('delform')!.previousElementSibling!;
      $.before(topNavPos, $.el('hr'));
      $.before(topNavPos, Index.navLinks);
      const timeEl = $('#index-last-refresh time', Index.navLinks) as HTMLElement;
      if (timeEl.dataset.utc) { return RelativeDates.update(timeEl); }
    });

    return $.on(d, '4chanXInitFinished', function() {
      const pagelistEl = $('.pagelist');
      if (pagelistEl) {
        $.replace(pagelistEl, Index.pagelist);
      }
      return $.rmClass(doc, 'index-loading');
    });
  },

  /**
   * Scroll event handler. Triggers loading the next page in infinite scrolling mode
   * when the user scrolls near the bottom of the document.
   */
  scroll() {
    if (Index.req || !Index.liveThreadData || (Conf['Index Mode'] !== 'infinite') || (window.scrollY <= (doc.scrollHeight - (300 + window.innerHeight)))) { return; }
    Index.pageNum ??= Index.currentPage; // Avoid having to pushState to keep track of the current page

    const pageNum = ++Index.pageNum;
    if (pageNum > Index.pagesNum) { return Index.endNotice(); }

    const threadIDs = Index.threadsOnPage(pageNum);
    return Index.buildStructure(threadIDs);
  },

  endNotice: (function() {
    let notify = false;
    const reset = () => notify = false;
    return function() {
      if (notify) { return; }
      notify = true;
      const _notice = new Notice('info', "Last page reached.", 2);
      return setTimeout(reset, 3 * SECOND);
    };
  })(),

  menu: {
    init() {
      if ((g.VIEW !== 'index') || !Conf['Menu'] || !Conf['Thread Hiding Link'] || !Index.enabledOn(g.BOARD)) { return; }

      return Menu.menu.addEntry({
        el: $.el('a', {
          href:      'javascript:;',
          className: 'has-shortcut-text'
        }
        , {innerHTML: "<span></span><span class=\"shortcut-text\">Shift+click</span>"}),
        order: 20,
        open(this: any, {thread}: any) {
          if (Conf['Index Mode'] !== 'catalog') { return false; }
          this.el.firstElementChild.textContent = thread.isHidden ?
            'Unhide'
          :
            'Hide';
          if (this.cb) { $.off(this.el, 'click', this.cb); }
          this.cb = function() {
            ($.event as any)('CloseMenu', undefined);
            return Index.toggleHide(thread);
          };
          $.on(this.el, 'click', this.cb);
          return true;
        }
      });
    }
  },

  node() {
    if (this.isReply || this.isClone || (Index.threadPosition[this.ID] == null)) { return; }
    return this.thread.setPage(Math.floor(Index.threadPosition[this.ID] / Index.threadsNumPerPage) + 1);
  },

  catalogNode() {
    return $.on(this.nodes.root, 'click', (e: MouseEvent) => {
      if ((e.button !== 0) || !e.shiftKey) return;
      e.preventDefault();
      getSelection()!.removeAllRanges();
      if (Conf['MD5 Quick Filter in the Catalog'] && (e.target as HTMLElement).classList.contains('catalog-thumb')) {
        (Filter as any).quickFilterMD5.call(this.thread.OP);
      } else {
        Index.toggleHide(this.thread);
      }
    });
  },

  toggleHide(thread: any) {
    if (Index.showHiddenThreads) {
      ThreadHiding.show(thread);
      if (!ThreadHiding.db.get({boardID: thread.board.ID, threadID: thread.ID})) { return; }
      // Don't save when un-hiding filtered threads.
    } else {
      ThreadHiding.hide(thread);
    }
    return ThreadHiding.saveHiddenState(thread);
  },

  cycleSortType() {
    let i;
    const types = (Index.selectSort as HTMLSelectElement).options as unknown as HTMLOptionElement[];
    const filteredTypes = Array.from(types).filter(option => !option.disabled);
    for (i = 0; i < filteredTypes.length; i++) {
      const type = filteredTypes[i];
      if (type.selected) { break; }
    }
    filteredTypes[(i + 1) % filteredTypes.length].selected = true;
    return ($.event as any)('change', null, Index.selectSort);
  },

  cb: {
    initFinished() {
      Index.initFinishedFired = true;
      return $.queueTask(() => Index.cb.postsInserted());
    },

    postsInserted() {
      if (!Index.initFinishedFired) { return; }
      let n = 0;
      g.posts.forEach(function(post: any) {
        if (!post.isFetchedQuote && !post.indexRefreshSeen && doc.contains(post.nodes.root)) {
          post.indexRefreshSeen = true;
          return n++;
        }
      });
      if (n) { return ($.event as any)('IndexRefresh', undefined); }
    },

    toggleHiddenThreads() {
      Index.showHiddenThreads = !Index.showHiddenThreads;
      ($('#hidden-toggle a', Index.navLinks) as HTMLElement).textContent = Index.showHiddenThreads ?
        'Hide'
      :
        'Show';
      Index.sort();
      return Index.buildIndex();
    },

    mode(this: HTMLSelectElement) {
      Index.pushState({mode: this.value});
      return Index.pageLoad(false);
    },

    sort() {
      const value = Index.selectRev.checked ? Index.selectSort.value + "-rev" : Index.selectSort.value;
      Index.pushState({sort: value});
      return Index.pageLoad(false);
    },

    resort(e: any) {
      Index.changed.order = true;
      if (!e?.detail?.deferred) { return Index.pageLoad(false); }
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
        this.value = Index.lastLongThresholds[i];
        return;
      }
      Index.lastLongThresholds[i] = value;
      Index.saveLastLongThresholds(i);
      Index.changed.order = true;
      return Index.pageLoad(false);
    },

    size(e: any) {
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
      if (e) { return Index.buildIndex(); }
    },

    replies() {
      return Index.buildIndex();
    },

    hover() {
      return doc.classList.toggle('catalog-hover-expand', Conf['Catalog Hover Expand']);
    },

    hoverToggle(e: MouseEvent) {
      if (Conf['Catalog Hover Toggle'] && $.hasClass(doc, 'catalog-mode') && !$.modifiedClick(e) && !$.x('ancestor-or-self::a', e.target as HTMLElement)) {
        const input = Index.inputs['Catalog Hover Expand'];
        input.checked = !input.checked;
        ($.event as any)('change', null, input);
        const thread = Get.threadFromNode(e.target as HTMLElement);
        if (thread) {
          Index.cb.catalogReplies.call(thread);
          return Index.cb.hoverAdjust.call(thread.OP.nodes);
        }
      }
    },

    popstate(e: PopStateEvent) {
      if (e?.state) {
        const {searched, mode, sort} = e.state;
        const page = Index.getCurrentPage();
        Index.setState({search: searched, mode, sort, page});
        return Index.pageLoad(false);
      } else {
        // page load or hash change
        const nCommands = Index.processHash();
        if (Conf['Refreshed Navigation'] && nCommands) {
          return Index.update();
        } else {
          return Index.pageLoad();
        }
      }
    },

    pageNav(e: MouseEvent) {
      let a;
      if ($.modifiedClick(e)) { return; }
      switch ((e.target as HTMLElement).nodeName) {
        case 'BUTTON':
          (e.target as HTMLElement).blur();
          a = (e.target as HTMLElement).parentNode as HTMLAnchorElement;
          break;
        case 'A':
          a = e.target as HTMLAnchorElement;
          break;
        default:
          return;
      }
      if (a.textContent === 'Catalog') { return; }
      e.preventDefault();
      return Index.userPageNav(+a.pathname.split(/\/+/)[2] || 1);
    },

    refreshFront() {
      Index.pushState({page: 1});
      return Index.update();
    },

    catalogReplies(this: any) {
      if (Conf['Show Replies'] && $.hasClass(doc, 'catalog-hover-expand') && !this.catalogView.nodes.replies) {
        return Index.buildCatalogReplies(this);
      }
    },

    hoverAdjust(this: any) {
      // Prevent hovered catalog threads from going offscreen.
      if (!$.hasClass(doc, 'catalog-hover-expand')) { return; }
      const rect = this.post.getBoundingClientRect();
      const x = $.minmax(0, -rect.left, doc.clientWidth - rect.right);
      if (x) {
        const {style} = this.post;
        style.left = `${x}px`;
        style.right = `${-x}px`;
        return $.one(this.root, 'mouseleave', () => style.left = (style.right = null));
      }
    }
  },

  scrollToIndex() {
    // Scroll to navlinks, or top of board if navlinks are hidden.
    return UIState.scrollToIfNeeded((Index.navLinks.getBoundingClientRect().height ? Index.navLinks : Index.root));
  },

  getCurrentPage() {
    return +window.location.pathname.split(/\/+/)[2] || 1;
  },

  userPageNav(page: number) {
    Index.pushState({page});
    if (Conf['Refreshed Navigation']) {
      return Index.update();
    } else {
      return Index.pageLoad();
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
    } as Record<string, string>,
    sort: {
      'bump-order':        'bump',
      'last-reply':        'lastreply',
      'last-long-reply':   'lastlong',
      'creation-date':     'birth',
      'reply-count':       'replycount',
      'file-count':        'filecount',
      'posts-per-minute':  'activity'
    } as Record<string, string>
  },

  processHash() {
    // XXX https://bugzilla.mozilla.org/show_bug.cgi?id=483304
    let hash = /#.*/.exec(location.href)?.[0] || '';
    const state: any =
      {replace: true};
    const commands = hash.slice(1).split('/');
    const leftover: string[] = [];
    for (const command of commands) {
      const mode = $.getOwn(Index.hashCommands.mode, command);
      if (mode) {
        state.mode = mode;
      } else if (command === 'index') {
        state.mode = Conf['Previous Index Mode'];
        state.page = 1;
      } else {
        const sort = $.getOwn(Index.hashCommands.sort, command.replace(/-rev$/, ''));
        if (sort) {
          state.sort = sort;
          if (command.endsWith('-rev')) { state.sort += '-rev'; }
        } else if (command.startsWith('s=')) {
          state.search = decodeURIComponent(command.slice(2)).replace(/\+/g, ' ').trim();
        } else {
          leftover.push(command);
        }
      }
    }
    hash = leftover.join('/');
    if (hash) { state.hash = `#${hash}`; }
    Index.pushState(state);
    return commands.length - leftover.length;
  },

  pushState(state: any) {
    let {search, hash, replace} = state;
    let pageBeforeSearch = (history.state as any)?.oldpage;
    if ((search != null) && (search !== Index.search)) {
      state.page = search ? 1 : (pageBeforeSearch || 1);
      if (!search) {
        pageBeforeSearch = undefined;
      } else if (!Index.search) {
        pageBeforeSearch = Index.currentPage;
      }
    }
    Index.setState(state);
    const pathname = Index.currentPage === 1 ? `/${g.BOARD!.ID}/` : `/${g.BOARD!.ID}/${Index.currentPage}`;
    if (!hash) { hash = ''; }
    return history[replace ? 'replaceState' : 'pushState']({
      mode:     Conf['Index Mode'],
      sort:     Index.currentSort,
      searched: Index.search,
      oldpage:  pageBeforeSearch
    }
    , '', `${location.protocol}//${location.host}${pathname}${hash}`);
  },

  setState({search, mode, sort, page, hash}: any) {
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

  savePerBoard(key: string, value: any) {
    if (typeof Conf[key] === 'object') {
      Conf[key][g.BOARD.ID] = value;
    } else {
      Conf[key] = value;
    }
    return $.set(key, Conf[key]);
  },

  saveSort() {
    return Index.savePerBoard('Index Sort', Index.currentSort);
  },

  saveLastLongThresholds(i: number) {
    return Index.savePerBoard(`Last Long Reply Thresholds ${i}`, Index.lastLongThresholds[i]);
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
      $[mode === Conf['Index Mode'] ? 'addClass' : 'rmClass'](doc, `${mode.replace(/ /g, '-')}-mode`);
    }
    Index.selectMode.value = Conf['Index Mode'];
    Index.cb.size();
    Index.showHiddenThreads = false;
    ($('#hidden-toggle a', Index.navLinks) as HTMLElement).textContent = 'Show';
  },

  setupSort() {
    Index.selectRev.checked = Index.currentSort.endsWith('-rev');
    Index.selectSort.value  = Index.currentSort.replace(/-rev$/, '');
    Index.lastLongOptions.hidden = (Index.selectSort.value !== 'lastlong');
  },

  getPagesNum() {
    if (Index.search) {
      return Math.ceil(Index.sortedThreadIDs.length / Index.threadsNumPerPage);
    } else {
      return Index.pagesNum;
    }
  },

  getMaxPageNum() {
    return Math.max(1, Index.getPagesNum());
  },

  buildPagelist() {
    const pagesRoot = $('.pages', Index.pagelist) as HTMLElement;
    const maxPageNum = Index.getMaxPageNum();
    if (pagesRoot.childElementCount !== maxPageNum) {
      const nodes: any[] = [];
      for (let i = 1, end = maxPageNum; i <= end; i++) {
        const a = $.el('a', {
          textContent: i.toString(),
          href: i === 1 ? './' : i.toString()
        }
        );
        nodes.push($.tn('['), a, $.tn('] '));
      }
      $.rmAll(pagesRoot);
      return $.add(pagesRoot, nodes);
    }
  },

  setPage() {
    let strong;
    const pageNum    = Index.currentPage;
    const maxPageNum = Index.getMaxPageNum();
    const pagesRoot  = $('.pages', Index.pagelist) as HTMLElement;

    // Previous/Next buttons
    const prev = pagesRoot.previousElementSibling!.firstElementChild as HTMLAnchorElement;
    const next = pagesRoot.nextElementSibling!.firstElementChild as HTMLAnchorElement;
    let href: number | string = Math.max(pageNum - 1, 1);
    prev.href = href === 1 ? './' : href.toString();
    (prev.firstElementChild as HTMLButtonElement).disabled = href === pageNum;
    href = Math.min(pageNum + 1, maxPageNum);
    next.href = href === 1 ? './' : href.toString();
    (next.firstElementChild as HTMLButtonElement).disabled = href === pageNum;

    // <strong> current page
    const existingStrong = $('strong', pagesRoot);
    if (existingStrong) {
      strong = existingStrong;
      const text = strong.textContent;
      if (text && +text === pageNum) { return; }
      $.replace(strong, strong.firstChild!);
    } else {
      strong = $.el('strong');
    }

    const a = pagesRoot.children[pageNum - 1];
    if (a) {
      $.before(a, strong);
      return $.add(strong, a);
    }
  },

  updateHideLabel() {
    if (!Index.hideLabel) { return; }
    let hiddenCount = 0;
    for (const threadID of Index.liveThreadIDs) {
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
    ($('#hidden-count', Index.navLinks) as HTMLElement).textContent = hiddenCount === 1 ?
      '1 hidden thread'
    :
      `${hiddenCount} hidden threads`;
  },

  /**
   * Triggers a refresh of the index by requesting the latest catalog JSON.
   * @param {boolean} [firstTime] - Indicates if this is the initial load.
   */
  update(firstTime?: boolean) {
    const oldReq = Index.req;
    if (oldReq) {
      delete Index.req;
      oldReq.abort();
    }

    if (Conf['Index Refresh Notifications']) {
      // Optional notification for manual refreshes
      if (!Index.notice) { Index.notice = new Notice('info', 'Refreshing index...'); }
      if (!Index.nTimeout) {
        Index.nTimeout = setTimeout(() => {
          if (Index.notice) {
            Index.notice.el.lastElementChild!.textContent += ' (disable JSON Index if this takes too long)';
          }
        }, 3 * SECOND);
      }
    } else if (!Index.nTimeout) {
      // Also display notice if Index Refresh is taking too long
      Index.nTimeout = setTimeout(() => Index.notice || (Index.notice = new Notice('info', 'Refreshing index... (disable JSON Index if this takes too long)')), 3 * SECOND);
    }

    // Hard refresh in case of incomplete page load.
    if (!firstTime && (d.readyState !== 'loading') && !$('.board + *')) {
      location.reload();
      return;
    }

    Index.req = $.whenModified(
      g.SITE.urls.catalogJSON({boardID: g.BOARD.ID}),
      'Index',
      Index.load
    );
    return $.addClass(Index.button, 'spin');
  },

  handleLoadError(status: number, statusText: string, notice: any) {
    const statusMsg = status ? `Error ${statusText} (${status})` : 'Connection Error';
    const err = `Index refresh failed. ${statusMsg}`;
    if (notice) {
      notice.setType('warning');
      notice.el.lastElementChild.textContent = err;
      setTimeout(notice.close, SECOND);
    } else {
      const _notice = new Notice('warning', err, 1);
    }
  },

  handleLoadNotice(notice: any) {
    if (Conf['Index Refresh Notifications']) {
      notice.setType('success');
      notice.el.lastElementChild.textContent = 'Index refreshed!';
      setTimeout(notice.close, SECOND);
    } else {
      notice.close();
    }
  },

  /**
   * Callback for the JSON catalog request. Parses the response and updates the index view.
   */
  load(this: any) {
    if (this !== Index.req) { return; } // aborted

    $.rmClass(Index.button, 'spin');
    const {notice, nTimeout} = Index;
    if (nTimeout) { clearTimeout(nTimeout); }
    delete Index.nTimeout;
    delete Index.req;
    delete Index.notice;

    if (![200, 304].includes(this.status)) {
      Index.handleLoadError(this.status, this.statusText, notice);
      return;
    }

    try {
      if (this.status === 200) {
        Index.parse(this.response);
      } else if (this.status === 304) {
        Index.pageLoad();
      }
    } catch (error: any) {
      c.error(`Index failure: ${error.message}`, error.stack);
      if (notice) {
        notice.setType('error');
        notice.el.lastElementChild.textContent = 'Index refresh failed.';
        setTimeout(notice.close, SECOND);
      } else {
        const _notice = new Notice('error', 'Index refresh failed.', 1);
      }
      return;
    }

    if (notice) {
      Index.handleLoadNotice(notice);
    }

    const timeEl = $('#index-last-refresh time', Index.navLinks) as HTMLElement;
    timeEl.dataset.utc = Date.parse(this.getResponseHeader('Last-Modified')!).toString();
    return RelativeDates.update(timeEl);
  },

  /**
   * Parses the JSON catalog data and triggers an index update.
   * @param {Array<object>} pages - The raw pages data from the catalog JSON.
   */
  parse(pages: any[]) {
    ($.constructor.prototype.cleanCache || ($ as any).cleanCache)((url: string) => /^https?:\/\/a\.4cdn\.org\//.test(url));
    Index.parseThreadList(pages);
    Index.changed.threads = true;
    return Index.pageLoad();
  },

  /**
   * Processes the raw pages data to extract and categorize threads, applying filters
   * and initializing thread objects for the index view.
   * @param {Array<object>} pages - The raw pages data from the catalog JSON.
   */
  parseThreadList(pages: any[]) {
    Index.pagesNum          = pages.length;
    Index.threadsNumPerPage = pages[0]?.threads.length || 1;
    Index.liveThreadData    = pages.reduce(((arr, next) => arr.concat(next.threads)), []);
    Index.liveThreadIDs     = Index.liveThreadData.map((data: any) => data.no);
    Index.liveThreadDict    = dict();
    Index.threadPosition    = dict();
    Index.parsedThreads     = dict();
    Index.replyData         = dict();
    for (let i = 0; i < Index.liveThreadData.length; i++) {
      let obj: any;
      const data = Index.liveThreadData[i];
      Index.liveThreadDict[data.no] = data;
      Index.threadPosition[data.no] = i;
      Index.parsedThreads[data.no] = (obj = g.SITE.Build.parseJSON(data, g.BOARD));
      const results = Filter.test(obj);
      obj.isOnTop  = results.top;
      obj.isHidden = results.hide || ThreadHiding.isHidden(obj.boardID, obj.threadID);
      if (data.last_replies) {
        for (const reply of data.last_replies) {
          Index.replyData[`${g.BOARD!.ID}.${reply.no}`] = reply;
        }
      }
    }
    if (Index.liveThreadData[0]) {
      g.SITE.Build.spoilerRange[g.BOARD!.ID] = Index.liveThreadData[0].custom_spoiler;
    }
    g.BOARD!.threads.forEach(function(thread: any) {
      if (!Index.liveThreadIDs.includes(thread.ID)) { return thread.collect(); }
    });
    ($.event as any)('IndexUpdate',
      {threads: ((Index.liveThreadIDs.map((ID: any) => `${g.BOARD!.ID}.${ID}`)))});
  },

  isHidden(threadID: number) {
    const thread = g.BOARD!.threads.get(threadID);
    if (thread?.OP && !thread.OP.isFetchedQuote) {
      return thread.isHidden;
    } else {
      return Index.parsedThreads[threadID].isHidden;
    }
  },

  isHiddenReply(threadID: number, replyData: any) {
    return PostHiding.isHidden(g.BOARD.ID, threadID, replyData.no) || Filter.isHidden(g.SITE.Build.parseJSON(replyData, g.BOARD));
  },

  buildSingleThread(
    ID: number,
    isCatalog: boolean,
    withReplies: boolean | undefined,
    newThreads: any[],
    newPosts: any[]
  ): { thread: any; opRoot?: HTMLElement; error?: any } {
    let opRoot: HTMLElement | undefined;
    try {
      let thread: any;
      let OP: any;
      const threadData = Index.liveThreadDict[ID];

      const existingThread = g.BOARD!.threads.get(ID);
      if (existingThread) {
        thread = existingThread;
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
        thread = new Thread(ID.toString(), g.BOARD as any);
        newThreads.push(thread);
      }
      const lastPost = threadData.last_replies?.length ? threadData.last_replies[threadData.last_replies.length - 1].no : ID;
      if (lastPost > thread.lastPost) { thread.lastPost = lastPost; }
      thread.json = threadData;

      OP = thread.OP;
      if (OP && !OP.isFetchedQuote) {
        OP.setCatalogOP(isCatalog);
        thread.setPage(Math.floor(Index.threadPosition[ID] / Index.threadsNumPerPage) + 1);
      } else {
        const obj = Index.parsedThreads[ID];
        opRoot = g.SITE.Build.post(obj);
        OP = new Post(opRoot!, thread, g.BOARD as any);
        OP.filterResults = obj.filterResults;
        newPosts.push(OP);
      }

      if (!isCatalog || !thread.nodes.root) {
        g.SITE.Build.thread(thread, threadData, withReplies);
      }
      return { thread };
    } catch (err: any) {
      return { thread: ID, opRoot, error: err };
    }
  },

  /**
   * Creates or updates Thread and Post objects for the given thread IDs.
   * @param {Array<number>} threadIDs - List of thread IDs to build.
   * @param {boolean} isCatalog - Whether the threads are being built for the catalog view.
   * @param {boolean} [withReplies] - Whether to include the latest replies for each thread.
   * @returns {Array<Thread>} Array of built or updated Thread objects.
   */
  buildThreads(threadIDs: number[], isCatalog: boolean, withReplies?: boolean) {
    let errors: any[] | undefined;
    const threads: any[]    = [];
    const newThreads: any[] = [];
    let newPosts: any[]   = [];

    for (const ID of threadIDs) {
      const result = Index.buildSingleThread(ID, isCatalog, withReplies, newThreads, newPosts);
      if (result.error) {
        errors ??= [];
        errors.push({
          message: `Parsing of Thread No.${result.thread} failed. Thread will be skipped.`,
          error: result.error,
          html: result.opRoot?.outerHTML
        });
      } else {
        threads.push(result.thread);
      }
    }

    if (errors) { Callbacks.errorHandler?.(errors); }

    if (withReplies) {
      newPosts = newPosts.concat(Index.buildReplies(threads));
    }

    for (const thread of newThreads) { Callbacks.Thread.execute(thread); }
    for (const post of newPosts) { (Callbacks.Post as any).execute(post); }
    Index.updateHideLabel();
    ($.event as any)('IndexRefreshInternal', {threadIDs: (threads.map((t) => t.fullID)), isCatalog}, undefined);

    return threads;
  },

  buildReplies(threads: any[]) {
    let errors: any[] | undefined;
    const posts: any[] = [];
    for (const thread of threads) {
      const lastReplies = Index.liveThreadDict[thread.ID].last_replies;
      if (!lastReplies) { continue; }
      const nodes: HTMLElement[] = [];
      for (const data of lastReplies) {
        const post = thread.posts.get(data.no);
        if (post && !post.isFetchedQuote) {
          nodes.push(post.nodes.root);
          continue;
        }
        const node = g.SITE.Build.postFromObject(data, thread.board.ID);
        nodes.push(node);
        try {
          posts.push(new Post(node, thread, thread.board));
        } catch (err: any) {
          errors ??= [];
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

  buildCatalogViews(threads: any[]) {
    const catalogThreads: any[] = [];
    for (const thread of threads) {
      if (!thread.catalogView) {
        const {ID} = thread;
        const page = Math.floor(Index.threadPosition[ID] / Index.threadsNumPerPage) + 1;
        const root = g.SITE.Build.catalogThread(thread, Index.liveThreadDict[ID], page);
        catalogThreads.push(new CatalogThread(root, thread));
      }
    }
    for (const catalogThread of catalogThreads) { Callbacks.CatalogThread.execute(catalogThread); }
  },

  sizeCatalogViews(threads: any[]) {
    // XXX When browsers support CSS3 attr(), use it instead.
    const size = Conf['Index Size'] === 'small' ? 150 : 250;
    for (const thread of threads) {
      const {thumb} = thread.catalogView.nodes;
      const {width, height} = thumb.dataset;
      if (!width) { continue; }
      const ratio = size / Math.max(Number(width), Number(height));
      thumb.style.width  = (Number(width)  * ratio) + 'px';
      thumb.style.height = (Number(height) * ratio) + 'px';
    }
  },

  buildCatalogReplies(thread: any) {
    const {nodes} = thread.catalogView;
    const lastReplies = Index.liveThreadDict[thread.ID].last_replies;
    if (!lastReplies) { return; }

    const replies: HTMLElement[] = [];
    for (const data of lastReplies) {
      if (Index.isHiddenReply(thread.ID, data)) { continue; }
      const reply = g.SITE.Build.catalogReply(thread, data);
      RelativeDates.update($('time', reply) as HTMLElement);
      $.on($('.catalog-reply-preview', reply)!, 'mouseover', runQuotePreviewMouseover);
      replies.push(reply);
    }

    nodes.replies = $.el('div', {className: 'catalog-replies'});
    $.add(nodes.replies, replies);
    $.add(thread.OP.nodes.post, nodes.replies);
  },

  /**
   * Sorts the available threads according to the current sorting criteria
   * (e.g., bump order, last reply, creation date) and search queries.
   */
  sort() {
    let threadIDs;
    const {liveThreadIDs, liveThreadData} = Index;
    if (!liveThreadData) { return; }
    const tmp_time = Date.now() / 1000;
    const sortType = Index.currentSort.replace(/-rev$/, '');
    Index.sortedThreadIDs = (() => { switch (sortType) {
      case 'lastreply': case 'lastlong': {
        const repliesAvailable = liveThreadData.some((thread: any) => thread.last_replies?.length);
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
            const len = r.com ? g.SITE.Build.parseComment(r.com).replace(/[^a-z]/ig, '').length : 0;
            if (len >= Index.lastLongThresholds[+!!r.ext]) {
              return r;
            }
          }
          if (thread.omitted_posts && thread.last_replies?.length) { return thread.last_replies[0]; } else { return thread; }
        };
        const lastlongD = dict();
        for (const thread of liveThreadData) {
          lastlongD[thread.no] = lastlong(thread).no;
        }
        return [...liveThreadData].sort((a, b) => lastlongD[b.no] - lastlongD[a.no]).map(post => post.no);
      }
      case 'bump':       return liveThreadIDs;
      case 'birth':      return [...liveThreadIDs ].sort((a, b) => b - a);
      case 'replycount': return [...liveThreadData].sort((a, b) => b.replies - a.replies).map(post => post.no);
      case 'filecount':  return [...liveThreadData].sort((a, b) => b.images  - a.images).map(post => post.no);
      case 'activity':   return [...liveThreadData].sort((a, b) => ((tmp_time-a.time)/(a.replies+1)) - ((tmp_time-b.time)/(b.replies+1))).map(post => post.no);
      default: return liveThreadIDs;
    } })();
    if (Index.currentSort.endsWith('-rev')) {
      Index.sortedThreadIDs.reverse();
    }
    if (Index.search && (threadIDs = Index.querySearch(Index.search))) {
      Index.sortedThreadIDs = threadIDs;
    }
    // Sticky threads
    Index.sortOnTop((obj: any) => obj.isSticky);
    // Highlighted threads
    Index.sortOnTop((obj: any) => obj.isOnTop || (Conf['Pin Watched Threads'] && isThreadWatched(obj.boardID, obj.threadID)));
    // Non-hidden threads
    if (Conf['Anchor Hidden Threads']) { return Index.sortOnTop((obj: any) => !Index.isHidden(obj.threadID)); }
  },

  sortOnTop(match: (obj: any) => boolean) {
    const topThreads: number[]    = [];
    const bottomThreads: number[] = [];
    for (const ID of Index.sortedThreadIDs) {
      (match(Index.parsedThreads[ID]) ? topThreads : bottomThreads).push(ID);
    }
    Index.sortedThreadIDs = topThreads.concat(bottomThreads);
    return Index.sortedThreadIDs;
  },

  /**
   * Rebuilds the DOM structure of the index view based on the current mode
   * (paged, catalog, infinite) and sorted thread list.
   */
  buildIndex() {
    let threadIDs;
    if (!Index.liveThreadData) { return; }
    switch (Conf['Index Mode']) {
      case 'all pages':
        threadIDs = Index.sortedThreadIDs;
        break;
      case 'catalog':
        threadIDs = Index.sortedThreadIDs.filter((ID: number) => Index.isHidden(ID) === Index.showHiddenThreads);
        break;
      default:
        threadIDs = Index.threadsOnPage(Index.currentPage);
    }
    delete Index.pageNum;
    $.rmAll(Index.root);
    $.rmAll(UIState.hoverUI);
    if (Index.loaded && Index.root.parentNode) {
      ($.event as any)('PostsRemoved', null, Index.root);
    }
    if (Conf['Index Mode'] === 'catalog') {
      Index.buildCatalog(threadIDs);
    } else {
      Index.buildStructure(threadIDs);
    }
  },

  threadsOnPage(pageNum: number) {
    const nodesPerPage = Index.threadsNumPerPage;
    const offset = nodesPerPage * (pageNum - 1);
    return Index.sortedThreadIDs.slice(offset ,  offset + nodesPerPage);
  },

  buildStructure(threadIDs: number[]) {
    const threads = Index.buildThreads(threadIDs, false, Conf['Show Replies']);
    const nodes: any[] = [];
    for (const thread of threads) {
      nodes.push(thread.nodes.root, $.el('hr'));
    }
    $.add(Index.root, nodes);
    if (Index.root.parentNode) {
      ($.event as any)('PostsInserted', null, Index.root);
    }
    Index.loaded = true;
  },

  buildCatalog(threadIDs: number[]) {
    let i = 0;
    const n = threadIDs.length;
    let node0: HTMLElement | null = null;
    const fn = function() {
      if (node0 && !node0.parentNode) { return; } // Index.root cleared
      const j = (i > 0) && Index.root.parentNode ? n : i + 30;
      node0 = Index.buildCatalogPart(threadIDs.slice(i, j))[0];
      i = j;
      if (i < n) {
        return $.queueTask(fn);
      } else {
        if (Index.root.parentNode) {
          ($.event as any)('PostsInserted', null, Index.root);
        }
        Index.loaded = true;
      }
    };
    fn();
  },

  buildCatalogPart(threadIDs: number[]) {
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
    Index.searchInput.value = '';
    Index.onSearchInput();
    return Index.searchInput.focus();
  },

  setupSearch() {
    Index.searchInput.value = Index.search;
    if (Index.search) {
      Index.searchInput.dataset.searching = "1";
    } else {
      // XXX https://bugzilla.mozilla.org/show_bug.cgi?id=1021289
      delete Index.searchInput.dataset.searching;
    }
  },

  onSearchInput() {
    const search = Index.searchInput.value.trim();
    if (search === Index.search) { return; }
    Index.pushState({
      search,
      replace: !!search === !!Index.search
    });
    return Index.pageLoad(false);
  },

  querySearch(query: string) {
    const match = /^([\w+]+):\/(.*)\/(\w*)$/.exec(query);
    if (match) {
      let regexp: RegExp;
      try {
        regexp = new RegExp(match[2], match[3]);
      } catch (error_) { // NOSONAR
        return [];
      }
      return Index.sortedThreadIDs.filter((ID: number) => regexp.test(Filter.values(match[1], Index.parsedThreads[ID]).join('\n')));
    }
    const keywords = query.toLowerCase().match(/\S+/g);
    if (!keywords) { return; }
    return Index.sortedThreadIDs.filter((ID: number) => Index.searchMatch(Index.parsedThreads[ID], keywords));
  },

  searchMatch(obj: any, keywords: string[]) {
    const {info, file} = obj;
    info.comment ??= g.SITE.Build.parseComment(info.commentHTML.innerHTML);
    const text: string[] = [];
    for (const key of ['comment', 'subject', 'name', 'tripcode']) {
      if (key in info) { text.push(info[key]); }
    }
    if (file) { text.push(file.name); }
    const combinedText = text.join(' ').toLowerCase();
    for (const keyword of keywords) {
      if (-1 === combinedText.indexOf(keyword)) { return false; }
    }
    return true;
  }
};
export default Index;
