import Redirect from "../Archive/Redirect";
// #region tests_enabled
import Test from "../General/Test";
// #endregion
import Board from "../classes/Board";
import Callbacks from "../classes/Callbacks";
import CatalogThreadNative from "../classes/CatalogThreadNative";
import DataBoard from "../classes/DataBoard";
import Notice from "../classes/Notice";
import Post from "../classes/Post";
import SimpleDict from "../classes/SimpleDict";
import Thread from "../classes/Thread";
import Config from "../config/Config";
import Anonymize from "../Filtering/Anonymize";
import Filter from "../Filtering/Filter";
import PostHiding from "../Filtering/PostHiding";
import Recursive from "../Filtering/Recursive";
import ThreadHiding from "../Filtering/ThreadHiding";
import Index from "../General/Index";
import Settings from "../General/Settings";
import DownloadAll from "../Images/DownloadAll";
import FappeTyme from "../Images/FappeTyme";
import Gallery from "../Images/Gallery";
import ImageExpand from "../Images/ImageExpand";
import ImageHost from "../Images/ImageHost";
import ImageHover from "../Images/ImageHover";
import ImageLoader from "../Images/ImageLoader";
import Metadata from "../Images/Metadata";
import RevealSpoilers from "../Images/RevealSpoilers";
import Sauce from "../Images/Sauce";
import Volume from "../Images/Volume";
import Linkify from "../Linkification/Linkify";
import ArchiveLink from "../Menu/ArchiveLink";
import CopyTextLink from "../Menu/CopyTextLink";
import DeleteLink from "../Menu/DeleteLink";
import DownloadLink from "../Menu/DownloadLink";
import ReportLink from "../Menu/ReportLink";
import AntiAutoplay from "../Miscellaneous/AntiAutoplay";
import Banner from "../Miscellaneous/Banner";
import CatalogLinks from "../Miscellaneous/CatalogLinks";
import CustomCSS from "../Miscellaneous/CustomCSS";
import ExpandComment from "../Miscellaneous/ExpandComment";
import ExpandThread from "../Miscellaneous/ExpandThread";
import FileInfo from "../Miscellaneous/FileInfo";
import Flash from "../Miscellaneous/Flash";
import Fourchan from "../Miscellaneous/Fourchan";
import IDColor from "../Miscellaneous/IDColor";
import IDHighlight from "../Miscellaneous/IDHighlight";
import IDPostCount from "../Miscellaneous/IDPostCount";
import Keybinds from "../Miscellaneous/Keybinds";
import ModContact from "../Miscellaneous/ModContact";
import Nav from "../Miscellaneous/Nav";
import NormalizeURL from "../Miscellaneous/NormalizeURL";
import PostJumper from "../Miscellaneous/PostJumper";
import PSA from "../Miscellaneous/PSA";
import PSAHiding from "../Miscellaneous/PSAHiding";
import RelativeDates from "../Miscellaneous/RelativeDates";
import RemoveSpoilers from "../Miscellaneous/RemoveSpoilers";
import ThreadLinks from "../Miscellaneous/ThreadLinks";
import Time from "../Miscellaneous/Time";
import Tinyboard from "../Miscellaneous/Tinyboard";
import Favicon from "../Monitoring/Favicon";
import MarkNewIPs from "../Monitoring/MarkNewIPs";
import ReplyPruning from "../Monitoring/ReplyPruning";
import ThreadStats from "../Monitoring/ThreadStats";
import ThreadUpdater from "../Monitoring/ThreadUpdater";
import ThreadWatcher from "../Monitoring/ThreadWatcher";
import Unread from "../Monitoring/Unread";
import UnreadIndex from "../Monitoring/UnreadIndex";
import $ from "../platform/$";
import $$ from "../platform/$$";
import PassLink from "../Posting/PassLink";
import PostRedirect from "../Posting/PostRedirect";
import QR from "../Posting/QR";
import QuoteBacklink from "../Quotelinks/QuoteBacklink";
import QuoteCT from "../Quotelinks/QuoteCT";
import QuoteInline from "../Quotelinks/QuoteInline";
import QuoteOP from "../Quotelinks/QuoteOP";
import QuotePreview from "../Quotelinks/QuotePreview";
import QuoteStrikeThrough from "../Quotelinks/QuoteStrikeThrough";
import QuoteThreading from "../Quotelinks/QuoteThreading";
import QuoteYou from "../Quotelinks/QuoteYou";
import Quotify from "../Quotelinks/Quotify";
import Site from "../site/Site";
import SW from "../site/SW";
import CSS from "../css/CSS";
import meta from '../../package.json';
import Header from "../General/Header";
import { c, Conf, d, doc, docSet, E, g } from "../globals/globals";
import Menu from "../Menu/Menu";
import BoardConfig from "../General/BoardConfig";
import CaptchaReplace from "../Posting/Captcha.replace";
import Get from "../General/Get";
import { dict, platform } from "../platform/helpers";
import RestoreDeletedFromArchive from "../Archive/RestoreDeletedFromArchive";
import ScrollMarkers from "../Miscellaneous/ScrollMarkers";


interface ErrorData {
  message: string;
  error: Error;
  html?: string;
}

interface Feature {
  init(): void;
}

var Main = {
  isFirstRun: false,
  jsEnabled: false,
  thisPageIsLegit: undefined as boolean | undefined,
  expectInitFinished: false,
  isMounted: false,
  addThreadsObserver: null as MutationObserver | null,
  addPostsObserver: null as MutationObserver | null,
  addCatalogThreadsObserver: null as MutationObserver | null,
  bgColorStyle: null as HTMLStyleElement | null,

  init() {
    // Return if the url is exactly https://www.4chan.org, this is only the home page which has a cloudflare checking
    // system which breaks this script. Keep it in the includes so it can be found on greasy fork.
    // __cf is also a cloudflare check page
    if (location.hostname === 'www.4chan.org' || location.search.includes("__cf")) return;
    // XXX dwb userscripts extension reloads scripts run at document-start when replaceState/pushState is called.
    // XXX Firefox reinjects WebExtension content scripts when extension is updated / reloaded.
    try {
      let w: any = window;
      if (platform === 'crx') { w = (w.wrappedJSObject || w); }
      if (`${meta.name} antidup` in w) { return; }
      w[`${meta.name} antidup`] = true;
    } catch (error) {}

    // Don't run inside ad iframes.
    try {
      if (window.frameElement && ['', 'about:blank'].includes((window.frameElement as HTMLIFrameElement).src)) { return; }
    } catch (error1) {}

    // Detect multiple copies of 4chan X
    if (doc && $.hasClass(doc, 'fourchan-x')) { return; }
    $.asap(docSet, function() {
      $.addClass(doc, 'fourchan-xtd', 'fourchan-xt', 'fourchan-x', 'seaweedchan');
      if ($.engine) $.addClass(doc, `ua-${$.engine}`);
      BoardConfig.ready(() => {
        if (g.BOARD?.config.ws_board != null) $.addClass(doc, g.BOARD.config.ws_board ? 'ws' : 'nws');
      });
    });
    try {
      $.global(
        'exposeVersion',
        { version: g.VERSION, buildDate: g.VERSION_DATE.getTime().toString() },
      );
    } catch (e) {
      console.error(e);
    }
    $.on(d, '4chanXInitFinished', function() {
      if (Main.expectInitFinished) {
        return delete Main.expectInitFinished;
      } else {
        new Notice('error', `Error: Multiple copies of ${meta.name} or 4chan X are enabled.`);
        return $.addClass(doc, 'tainted');
      }
    });

    // Detect "mounted" event from Kissu
    const mountedCB = function(): void {
      d.removeEventListener('mounted', mountedCB, true);
      Main.isMounted = true;
      Main.mountedCBs.map((cb: () => void) =>
        (() => { try {
          return cb();
        } catch (error2) {} })());
    };
    d.addEventListener('mounted', mountedCB, true);

    // Flatten default values from Config into Conf
    const flatten = function(parent: string | null, obj: any): void {
      if (obj instanceof Array) {
        Conf[parent!] = dict.clone(obj[0]);
      } else if (typeof obj === 'object') {
        for (const key in obj) {
          flatten(key, obj[key]);
        }
      } else { // string or number
        Conf[parent!] = obj;
      }
    };

    // XXX Remove document-breaking ad
    if (location.hostname === 'boards.4chan.org') {
      $.asap(docSet, () => $.onExists(doc, 'iframe[srcdoc]', $.rm));
    }

    flatten(null, Config);

    for (const db of DataBoard.keys) {
      Conf[db] = dict();
    }
    Conf['customTitles'] = dict.clone({'4chan.org': {boards: {'qa': {'boardTitle': {orig: '/qa/ - Question & Answer', title: '/qa/ - 2D/Random'}}}}});
    Conf['boardConfig'] = {boards: dict()};
    Conf['archives'] = Redirect.archives;
    Conf['selectedArchives'] = dict();
    Conf['cooldowns'] = dict();
    Conf['Index Sort'] = dict();
    for (let i = 0; i < 2; i++) { Conf[`Last Long Reply Thresholds ${i}`] = dict(); }
    Conf['siteProperties'] = dict();

    // XXX old key names
    Conf['Except Archives from Encryption'] = false;
    Conf['JSON Navigation'] = true;
    Conf['Oekaki Links'] = true;
    Conf['Show Name and Subject'] = false;
    Conf['QR Shortcut'] = true;
    Conf['Bottom QR Link'] = true;
    Conf['Toggleable Thread Watcher'] = true;
    Conf['siteSoftware'] = '';
    Conf['Use Faster Image Host'] = 'true';
    Conf['Captcha Fixes'] = true;
    Conf['captchaServiceDomain'] = '';
    Conf['captchaServiceKey'] = dict();

    // Enforce JS whitelist
    if (
      /\.4chan(?:nel)?\.org$/.test(location.hostname) &&
      !SW.yotsuba.regexp.pass.test(location.href) &&
      !SW.yotsuba.regexp.captcha.test(location.href) &&
      !$$('script:not([src])', d as any).filter(s => /this\[/.test(s.textContent)).length
    ) {
      ($.getSync || $.get)({'jsWhitelist': Conf['jsWhitelist']}, ({jsWhitelist}) => {
        const parsedList = jsWhitelist.replace(/^#.*$/mg, '').replace(/[\s;]+/g, ' ').trim();
        if (/\S/.test(parsedList)) $.addCSP(`script-src ${parsedList}`);
      });
    }

    // Get saved values as items
    const items = dict();
    for (const key in Conf) items[key] = undefined;
    items['previousversion'] = undefined;
    ($.getSync || $.get)(items, function(items) {
      $.asap(docSet, function() {

        // Don't hide the local storage warning behind a settings panel.
        if ($.cantSet) {
          // pass

        // Fresh install
        } else if ((items.previousversion == null)) {
          Main.isFirstRun = true;
          Main.ready(function() {
            $.set('previousversion', g.VERSION);
            return Settings.open(null as any);
          });

        // Migrate old settings
        } else if (items.previousversion !== g.VERSION) {
          Main.upgrade(items);
        }

        // Combine default values with saved values
        for (const key in Conf) {
          Conf[key] = items[key] ?? Conf[key];
        }

        Site.init(Main.initFeatures);
      });
    });
  },

  upgrade(items: Record<string, any>): void {
    const {previousversion} = items;
    const changes = Settings.upgrade(items, previousversion);
    items.previousversion = (changes.previousversion = g.VERSION);
    return $.set(changes, function() {
      if (items['Show Updated Notifications'] ?? true) {
        const el = $.el('span',
          { innerHTML: `${meta.name} has been updated to <a href="${meta.changelog}" target="_blank">version ${g.VERSION}</a>.` });
        return new Notice('info', el, 15);
      }
    });
  },

  parseURL(site=g.SITE, url: Location | URL = location) {
    const r: Record<string, any> = {};

    if (!site) { return r; }
    r.siteID = site.ID;

    if (site.isBoardlessPage?.(url)) { return r; }
    const pathname = url.pathname.split(/\/+/);
    r.boardID = pathname[1];

    if (site.isFileURL(url)) {
      r.VIEW = 'file';
    } else if (site.isAuxiliaryPage?.(url)) {
      // pass
    } else if (['thread', 'res'].includes(pathname[2])) {
      r.VIEW = 'thread';
      r.threadID = (r.THREADID = +pathname[3].replace(/\.\w+$/, ''));
    } else if ((pathname[2] === 'archive') && (pathname[3] === 'res')) {
      r.VIEW = 'thread';
      r.threadID = (r.THREADID = +pathname[4].replace(/\.\w+$/, ''));
      r.threadArchived = true;
    } else if (/^(?:catalog|archive)(?:\.\w+)?$/.test(pathname[2])) {
      r.VIEW = pathname[2].replace(/\.\w+$/, '');
    } else if (/^(?:index|\d*)(?:\.\w+)?$/.test(pathname[2])) {
      r.VIEW = 'index';
    }
    return r;
  },

  initFeatures(): void {
    $.global('initMain');
    Main.jsEnabled = $.hasClass(doc, 'js-enabled');

    $.extend(g, Main.parseURL());
    if (g.boardID) { g.BOARD = new Board(g.boardID); }

    if (!g.VIEW) {
      g.SITE.initAuxiliary?.();
      return;
    }

    if (g.VIEW === 'file') {
      $.asap((() => d.readyState !== 'loading'), function() {
        let video;
        if ((g.SITE.software === 'yotsuba') && Conf['404 Redirect'] && g.SITE.is404?.()) {
          const pathname = location.pathname.split(/\/+/);
          return Redirect.navigate('file', {
            boardID:  g.BOARD.ID,
            filename: pathname[pathname.length - 1]
          }, '' as any);
        } else if (video = $('video')) {
          if (Conf['Volume in New Tab']) {
            Volume.setup(video);
          }
          if (Conf['Loop in New Tab']) {
            video.loop = true;
            video.controls = true;
            video.play();
          }
        }
      });
      return;
    }

    g.threads = new SimpleDict();
    g.posts   = new SimpleDict();

    // set up CSS when <head> is completely loaded
    $.onExists(doc, 'body', Main.initStyle);

    // c.time 'All initializations'
    for (const [name, feature] of Main.features) {
      if (g.SITE.disabledFeatures && g.SITE.disabledFeatures.includes(name)) { continue; }
      // c.time "#{name} initialization"
      try {
        feature.init();
      } catch (err) {
        Main.handleErrors({
          message: `\"${name}\" initialization crashed.`,
          error: err
        });
      }
    }
      // finally
      //   c.timeEnd "#{name} initialization"

    // c.timeEnd 'All initializations'

    return $.ready(Main.initReady);
  },

  initStyle(): void {
    if (!Main.isThisPageLegit()) { return; }

    // disable the mobile layout
    const mobileLink = $('link[href*=mobile]', d.head);
    if (mobileLink) mobileLink.disabled = true;
    doc.dataset.host = location.host;
    $.addClass(doc, `sw-${g.SITE.software}`);
    $.addClass(doc, g.VIEW === 'thread' ? 'thread-view' : g.VIEW);
    $.onExists(doc, '.ad-cnt, .adg-rects > .desktop', ad => $.onExists(ad, 'img, iframe', () => $.addClass(doc, 'ads-loaded')));
    if (Conf['Autohiding Scrollbar']) { $.addClass(doc, 'autohiding-scrollbar'); }
    $.ready(function() {
      if ((d.body.clientHeight > doc.clientHeight) && ((window.innerWidth === doc.clientWidth) !== Conf['Autohiding Scrollbar'])) {
        Conf['Autohiding Scrollbar'] = !Conf['Autohiding Scrollbar'];
        $.set('Autohiding Scrollbar', Conf['Autohiding Scrollbar']);
        return $.toggleClass(doc, 'autohiding-scrollbar');
      }
    });
    $.addStyle(CSS.sub(CSS.boards), 'fourchanx-css');
    Main.bgColorStyle = $.el('style', {id: 'fourchanx-bgcolor-css'});

    return Main.setClass();
  },

  setClass(): void {
    let mainStyleSheet: HTMLLinkElement | null = null;
    let style: string | null = null;
    let styleSheets: HTMLLinkElement[] | null = null;
    const knownStyles = ['yotsuba', 'yotsuba-b', 'futaba', 'burichan', 'photon', 'tomorrow', 'spooky'];

    if ((g.SITE.software === 'yotsuba') && (g.VIEW === 'catalog')) {
      const baseCss = $.id('base-css') as HTMLLinkElement | null;
      if (baseCss) {
        mainStyleSheet = baseCss;
        const match = mainStyleSheet.href.match(/catalog_(\w+)/);
        style = match?.[1].replace('_new', '').replace(/_+/g, '-') || null;
        if (style && knownStyles.includes(style)) {
          $.addClass(doc, style);
          return;
        }
      }
    }

    style = null;

    const setStyle = function() {
      // Use preconfigured CSS for 4chan's default themes.
      if (g.SITE.software === 'yotsuba') {
        if (style) {
          $.rmClass(doc, style);
        }
        style = null;
        if (styleSheets) {
          for (const styleSheet of styleSheets) {
            if (styleSheet.href === mainStyleSheet?.href) {
              style = styleSheet.title.toLowerCase().replace('new', '').trim().replace(/\s+/g, '-');
              if (style === '_special') {
                const match = styleSheet.href.match(/[a-z]*(?=[^/]*$)/);
                style = match ? match[0] : null;
              }
              if (style && !knownStyles.includes(style)) { style = null; }
              break;
            }
          }
        }
        if (style) {
          $.addClass(doc, style);
          $.rm(Main.bgColorStyle);
          return;
        }
      }

      // Determine proper dialog background color for other themes.
      const div = g.SITE.bgColoredEl();
      div.style.position = 'absolute';
      div.style.visibility = 'hidden';
      $.add(d.body, div);
      let bgColor = window.getComputedStyle(div).backgroundColor;
      $.rm(div);
      const rgb = bgColor.match(/[\d.]+/g);
      // Use body background if reply background is transparent
      if (!rgb || !/^rgb\(/.test(bgColor)) {
        const s = window.getComputedStyle(d.body);
        bgColor = `${s.backgroundColor} ${s.backgroundImage} ${s.backgroundRepeat} ${s.backgroundPosition}`;
      }
      const parsedRgb = bgColor.match(/[\d.]+/g) || ['255', '255', '255', '1'];
      let css = `\
:root {
  --xt-background: ${bgColor};
  --xt-header-dialog-bg: ${bgColor};
}
.dialog, .suboption-list > div:last-of-type, :root.catalog-hover-expand .catalog-container:hover > .post {
  background: ${bgColor};
}
.unread-mark-read {
  background-color: rgba(${parsedRgb.slice(0, 3).join(', ')}, ${0.5*(parseFloat(parsedRgb[3]) || 1)});
}\
`;
      if ($.luma(parsedRgb) < 100) {
        css += '.watch-thread-link { --xt-watcher: #c8c8c8 }';
      }
      Main.bgColorStyle.textContent = css;
      return $.after($.id('fourchanx-css'), Main.bgColorStyle);
    };

    $.onExists(d.head, g.SITE.selectors.styleSheet, function(el: HTMLLinkElement) {
      mainStyleSheet = el;
      if (g.SITE.software === 'yotsuba') {
        styleSheets = $$('link[rel="alternate stylesheet"]', d.head) as HTMLLinkElement[];
      }
      new MutationObserver(setStyle).observe(mainStyleSheet, {
        attributes: true,
        attributeFilter: ['href']
      });
      $.on(mainStyleSheet, 'load', setStyle);
      return setStyle();
    });
    if (!mainStyleSheet) {
      const sheets = $$('link[rel="stylesheet"]', d.head) as HTMLLinkElement[];
      for (const styleSheet of sheets) {
        $.on(styleSheet, 'load', setStyle);
      }
      return setStyle();
    }
  },

  initReady(): void {
    if (g.SITE.is404?.()) {
      if (g.VIEW === 'thread') {
        ThreadWatcher.set404(g.BOARD.ID, g.THREADID, function() {
          if (Conf['404 Redirect']) {
            return Redirect.navigate('thread', {
              boardID:  g.BOARD.ID,
              threadID: g.THREADID,
              postID:   +location.hash.match(/\d+/)
            } // post number or 0
            , `/${g.BOARD}/`);
          }
        });
      }

      return;
    }

    if (g.SITE.isIncomplete?.()) {
      const msg = $.el('div',
        {innerHTML: 'The page didn&#039;t load completely.<br>Some features may not work unless you <a href="javascript:;">reload</a>.'});
      $.on($('a', msg), 'click', () => location.reload());
      new Notice('warning', msg);
    }

    // Parse HTML or skip it and start building from JSON.
    if (g.VIEW === 'catalog') {
      Main.initCatalog();
    } else if (!Index.enabled) {
      if (g.SITE.awaitBoard) {
        g.SITE.awaitBoard(Main.initThread);
      } else {
        Main.initThread();
      }
    } else {
      Main.expectInitFinished = true;
      $.event('4chanXInitFinished', null);
    }
  },

  initThread(): void {
    let board;
    const s = g.SITE.selectors;
    if (board = $((s.boardFor?.[g.VIEW] || s.board))) {
      const threads = [];
      const posts   = [];
      const errors  = [];

      try {
        g.SITE.preParsingFixes?.(board);
      } catch (error) {}

      Main.addThreadsObserver = new MutationObserver(Main.addThreads);
      Main.addPostsObserver   = new MutationObserver(Main.addPosts);
      Main.addThreadsObserver.observe(board, {childList: true});

      Main.parseThreads($$(s.thread, board), threads, posts, errors);
      if (errors.length) { Main.handleErrors(errors); }

      if (g.VIEW === 'thread') {
        if ((g as any).threadArchived) {
          threads[0].isArchived = true;
          threads[0].kill();
        }
        g.SITE.parseThreadMetadata?.(threads[0]);
      }

      setTimeout(() => {
        Main.callbackNodes('Thread', threads);
        Main.callbackNodesDB('Post', posts, function() {
          for (var post of posts) QuoteThreading.insert(post);
          Main.expectInitFinished = true;
          $.event('4chanXInitFinished', null);
        });
      }, 0);

    } else {
      Main.expectInitFinished = true;
      $.event('4chanXInitFinished', null);
    }
  },

  parseThreads(threadRoots: HTMLElement[], threads: any[], posts: any[], errors: ErrorData[]): void {
    for (const threadRoot of threadRoots) {
      const boardObj = (() => {
        let boardID;
        if (boardID = threadRoot.dataset.board) {
        boardID = encodeURIComponent(boardID);
        return g.boards[boardID] || new Board(boardID);
      } else {
        return g.BOARD;
      }
      })();
      const threadID = +threadRoot.id.match(/\d*$/)![0];
      if (!threadID || boardObj.threads.get(threadID)?.nodes.root) { return; }
      const thread = new Thread(threadID as any, boardObj as any);
      thread.nodes.root = threadRoot;
      threads.push(thread);
      const postRoots = $$(g.SITE.selectors.postContainer, threadRoot);
      if (g.SITE.isOPContainerThread) { postRoots.unshift(threadRoot); }
      Main.parsePosts(postRoots, thread, posts, errors);
      Main.addPostsObserver.observe(threadRoot, {childList: true});
    }
  },

  parsePosts(postRoots: HTMLElement[], thread: any, posts: any[], errors: ErrorData[]): void {
    for (const postRoot of postRoots) {
      if (!(postRoot.dataset.fullID && g.posts.get(postRoot.dataset.fullID)) && $(g.SITE.selectors.comment, postRoot)) {
        try {
          posts.push(new Post(postRoot, thread, thread.board));
        } catch (err) {
          // Skip posts that we failed to parse.
          errors.push({
            message: `Parsing of Post No.${postRoot.id.match(/\d+/)} failed. Post will be skipped.`,
            error: err,
            html: postRoot.outerHTML
          });
        }
      }
    }
  },

  addThreads(records: MutationRecord[]): void {
    const threadRoots: HTMLElement[] = [];
    for (const record of records) {
      for (const node of record.addedNodes) {
        if ((node.nodeType === Node.ELEMENT_NODE) && (node as Element).matches(g.SITE.selectors.thread)) {
          threadRoots.push(node as HTMLElement);
        }
      }
    }
    if (!threadRoots.length) { return; }
    const threads = [];
    const posts   = [];
    const errors  = [];
    Main.parseThreads(threadRoots, threads, posts, errors);
    if (errors.length) { Main.handleErrors(errors); }
    Main.callbackNodes('Thread', threads);
    Main.callbackNodesDB('Post', posts, () => $.event('PostsInserted', null, records[0].target));
  },

  addPosts(records: MutationRecord[]): void {
    let thread: any;
    const threads: any[]   = [];
    const threadsRM: any[] = [];
    const posts: any[]     = [];
    const errors: ErrorData[]    = [];
    for (const record of records) {
      thread = Get.threadFromRoot(record.target);
      const postRoots: HTMLElement[] = [];
      for (let node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if ((node as Element).matches(g.SITE.selectors.postContainer) || (node = $(g.SITE.selectors.postContainer, node as HTMLElement)!)) {
            postRoots.push(node as HTMLElement);
          }
        }
      }
      const n = posts.length;
      Main.parsePosts(postRoots, thread, posts, errors);
      if ((posts.length > n) && !threads.includes(thread)) {
        threads.push(thread);
      }
      let anyRemoved = false;
      for (const el of record.removedNodes) {
        if (((Get.postFromRoot(el) as any)?.nodes.root === el) && !doc.contains(el)) {
          anyRemoved = true;
          break;
        }
      }
      if (anyRemoved && !threadsRM.includes(thread)) {
        threadsRM.push(thread);
      }
    }
    if (errors.length) { Main.handleErrors(errors); }
    Main.callbackNodesDB('Post', posts, function() {
      for (thread of threads) {
        $.event('PostsInserted', null, thread.nodes.root);
      }
      for (thread of threadsRM) {
        $.event('PostsRemoved', null, thread.nodes.root);
      }
    });
  },

  initCatalog(): void {
    let board;
    const s = g.SITE.selectors.catalog;
    if (s && (board = $(s.board))) {
      const threads = [];
      const errors  = [];

      Main.addCatalogThreadsObserver = new MutationObserver(Main.addCatalogThreads);
      Main.addCatalogThreadsObserver.observe(board, {childList: true});

      Main.parseCatalogThreads($$(s.thread, board), threads, errors);
      if (errors.length) { Main.handleErrors(errors); }

      Main.callbackNodes('CatalogThreadNative', threads);
    }

    Main.expectInitFinished = true;
    $.event('4chanXInitFinished', null);
  },

  parseCatalogThreads(threadRoots: HTMLElement[], threads: any[], errors: ErrorData[]): void {
    for (const threadRoot of threadRoots) {
      try {
        const thread = new CatalogThreadNative(threadRoot);
        if ((thread.thread as any).catalogViewNative?.nodes.root !== threadRoot) {
          (thread.thread as any).catalogViewNative = thread;
          threads.push(thread);
        }
      } catch (err) {
        // Skip threads that we failed to parse.
        errors.push({
          message: `Parsing of Catalog Thread No.${(threadRoot.dataset.id || threadRoot.id).match(/\d+/)} failed. Thread will be skipped.`,
          error: err,
          html: threadRoot.outerHTML
        });
      }
    }
  },

  addCatalogThreads(records: MutationRecord[]): void {
    const threadRoots: HTMLElement[] = [];
    for (const record of records) {
      for (const node of record.addedNodes) {
        if ((node.nodeType === Node.ELEMENT_NODE) && (node as Element).matches(g.SITE.selectors.catalog.thread)) {
          threadRoots.push(node as HTMLElement);
        }
      }
    }
    if (!threadRoots.length) { return; }
    const threads = [];
    const errors  = [];
    Main.parseCatalogThreads(threadRoots, threads, errors);
    if (errors.length) { Main.handleErrors(errors); }
    return Main.callbackNodes('CatalogThreadNative', threads);
  },

  callbackNodes(klass: string, nodes: any[]): void {
    let node;
    let i = 0;
    const cb = Callbacks[klass];
    while ((node = nodes[i++])) {
      cb.execute(node);
    }
  },

  callbackNodesDB(klass: string, nodes: any[], cb?: () => void): void {
    let i   = 0;
    const cbs = Callbacks[klass];
    const fn  = function(): number | false {
      let node;
      if (!(node = nodes[i])) { return false; }
      cbs.execute(node);
      return ++i % 250;
    };

    const softTask = function(): void {
      while (fn()) {
        continue;
      }
      if (!nodes[i]) {
        if (cb) { cb(); }
        return;
      }
      setTimeout(softTask, 0);
    };

    softTask();
  },

  handleErrors(errors: ErrorData | ErrorData[]) {
    // Detect conflicts with 4chan X v2
    let error;
    if (d.body && $.hasClass(d.body, 'fourchan_x') && !$.hasClass(doc, 'tainted')) {
      new Notice('error', `Error: Multiple copies of ${meta.name} or 4chan X are enabled.`);
      $.addClass(doc, 'tainted');
    }

    // Detect conflicts with native extension
    if (g.SITE.testNativeExtension && !$.hasClass(doc, 'tainted')) {
      g.SITE.testNativeExtension().then(({enabled}) => {
        if (enabled) {
          $.addClass(doc, 'tainted');
          if (Conf['Disable Native Extension'] && !Main.isFirstRun) {
            const msg = $.el('div',
              { innerHTML: 'Failed to disable the native extension. You may need to <a href="' + E(meta.upstreamFaq) +
                '#blocking-native-extension" target="_blank">block it</a>.' });
            new Notice('error', msg);
          }
        }
      });
    }

    if (!(errors instanceof Array)) {
      error = errors;
    } else if ((errors as ErrorData[]).length === 1) {
      error = (errors as ErrorData[])[0];
    }
    if (error) {
      new Notice('error', Main.parseError(error, Main.reportLink([error])), 15);
      return;
    }

    const div = $.el('div', {
      innerHTML:
        `${(errors as ErrorData[]).length} errors occurred.${Main.reportLink(errors as ErrorData[]).innerHTML} [<a href="javascript:;">show</a>]`
    });
    $.on(div.lastElementChild, 'click', function () {
      return [this.textContent, logs.hidden] = this.textContent === 'show' ? ['hide', false] : ['show', true];
    });

    var logs = $.el('div',
      {hidden: true});
    for (error of (errors as ErrorData[])) {
      $.add(logs, Main.parseError(error));
    }

    return new Notice('error', [div, logs], 30);
  },

  parseError(data: ErrorData, reportLink?: { innerHTML: string }): (HTMLElement | HTMLDivElement)[] {
    c.error(data.message, data.error.stack);
    const message = $.el('div',
      { innerHTML: E(data.message) + ((reportLink) ? (reportLink).innerHTML : "") });
    const error = $.el('div',
      {textContent: `${data.error.name || 'Error'}: ${data.error.message || 'see console for details'}`});
    const lines = data.error.stack?.match(/\d+(?=:\d+\)?$)/mg)?.join().replace(/^/, ' at ') || '';
    const context = $.el('div',
      { textContent: `(${meta.name} ${meta.fork} v${g.VERSION} ${platform} on ${$.engine}${lines})` });
    return [message, error, context];
  },

  reportLink(errors: ErrorData[]): { innerHTML: string } {
    let info: any;
    const data = errors[0];
    let title  = data.message;
    if (errors.length > 1) { title += ` (+${errors.length - 1} other errors)`; }
    let details = '';
    const addDetails = function(text: string): string | undefined {
      if (encodeURIComponent(title + details + text + '\n').length <= meta.newIssueMaxLength - meta.newIssue.replace(/%(title|details)/, '').length) {
        return details += text + '\n';
      }
    };
    addDetails(`\
[Please describe the steps needed to reproduce this error.]

Script: ${meta.name} ${meta.fork} v${g.VERSION} ${platform}
URL: ${location.href}
User agent: ${navigator.userAgent}\
`
    );
    if ((platform === 'userscript') && (info = (() => {
      if (typeof GM !== 'undefined' && GM !== null) { return GM.info; } else { if (typeof GM_info !== 'undefined' && GM_info !== null) { return GM_info; }
  }
    })())) {
      addDetails(`Userscript manager: ${info.scriptHandler} ${info.version}`);
    }
    addDetails('\n' + data.error);
    if (data.error.stack) { addDetails(data.error.stack.replace(data.error.toString(), '').trim()); }
    if (data.html) { addDetails('\n`' + data.html + '`'); }
    details = details.replace(/file:\/{3}.+\//g, ''); // Remove local file paths
    const url = meta.newIssue.replace('%title', encodeURIComponent(title)).replace('%details', encodeURIComponent(details));
    return { innerHTML: `<span class="report-error"> [<a href="${url}" target="_blank">report</a>]</span>` };
  },

  isThisPageLegit(): boolean {
    // not 404 error page or similar.
    if (Main.thisPageIsLegit === undefined) {
      Main.thisPageIsLegit = g.SITE.isThisPageLegit ?
        g.SITE.isThisPageLegit()
      :
        !/^[45]\d\d\b/.test(document.title) && !/\.(?:json|rss)$/.test(location.pathname);
    }
    return Main.thisPageIsLegit;
  },

  ready(cb: () => void): void {
    return $.ready(function() {
      if (Main.isThisPageLegit()) { return cb(); }
    });
  },

  mounted(cb: () => void): void {
    if (Main.isMounted) {
      cb();
    } else {
      Main.mountedCBs.push(cb);
    }
  },

  mountedCBs: [] as (() => void)[],

  features: [
    ['Board Configuration',       BoardConfig],
    ['Normalize URL',             NormalizeURL],
    ['Delay Redirect on Post',    PostRedirect],
    ['Captcha Configuration',     CaptchaReplace],
    ['Image Host Rewriting',      ImageHost],
    ['Redirect',                  Redirect],
    ['Header',                    Header],
    ['Catalog Links',             CatalogLinks],
    ['Settings',                  Settings],
    ['Index Generator',           Index],
    ['Disable Autoplay',          AntiAutoplay],
    ['Announcement Hiding',       PSAHiding],
    ['Fourchan thingies',         Fourchan],
    ['Tinyboard Glue',            Tinyboard],
    ['Color User IDs',            IDColor],
    ['Highlight by User ID',      IDHighlight],
    ['Count Posts by ID',         IDPostCount],
    ['Custom CSS',                CustomCSS],
    ['Thread Links',              ThreadLinks],
    ['Linkify',                   Linkify],
    ['Reveal Spoilers',           RemoveSpoilers],
    ['Resurrect Quotes',          Quotify],
    ['Filter',                    Filter],
    ['Thread Hiding Buttons',     ThreadHiding],
    ['Reply Hiding Buttons',      PostHiding],
    ['Recursive',                 Recursive],
    ['Strike-through Quotes',     QuoteStrikeThrough],
    ['Quick Reply Personas',      QR.persona],
    ['Quick Reply',               QR],
    ['Cooldown',                  QR.cooldown],
    ['Post Jumper',               PostJumper],
    ['Pass Link',                 PassLink],
    ['Menu',                      Menu],
    ['Index Generator (Menu)',    Index.menu],
    ['Report Link',               ReportLink],
    ['Copy Text Link',            CopyTextLink],
    ['Thread Hiding (Menu)',      ThreadHiding.menu],
    ['Reply Hiding (Menu)',       PostHiding.menu],
    ['Delete Link',               DeleteLink],
    ['Filter (Menu)',             Filter.menu],
    ['Edit Link',                 QR.oekaki.menu],
    ['Download Link',             DownloadLink],
    ['Archive Link',              ArchiveLink],
    ['Quote Inlining',            QuoteInline],
    ['Quote Previewing',          QuotePreview],
    ['Quote Backlinks',           QuoteBacklink],
    ['Mark Quotes of You',        QuoteYou],
    ['Mark OP Quotes',            QuoteOP],
    ['Mark Cross-thread Quotes',  QuoteCT],
    ['Anonymize',                 Anonymize],
    ['Time Formatting',           Time],
    ['Relative Post Dates',       RelativeDates],
    ['File Info Formatting',      FileInfo],
    ['Download All Media',        DownloadAll],
    ['Fappe Tyme',                FappeTyme],
    ['Gallery',                   Gallery],
    ['Gallery (menu)',            Gallery.menu],
    ['Sauce',                     Sauce],
    ['Image Expansion',           ImageExpand],
    ['Image Expansion (Menu)',    ImageExpand.menu],
    ['Reveal Spoiler Thumbnails', RevealSpoilers],
    ['Image Loading',             ImageLoader],
    ['Image Hover',               ImageHover],
    ['Volume Control',            Volume],
    ['WEBM Metadata',             Metadata],
    ['Comment Expansion',         ExpandComment],
    ['Thread Expansion',          ExpandThread],
    ['Favicon',                   Favicon],
    ['Unread',                    Unread],
    ['Unread Line in Index',      UnreadIndex],
    ['Quote Threading',           QuoteThreading],
    ['Thread Stats',              ThreadStats],
    ['Thread Updater',            ThreadUpdater],
    ['Thread Watcher',            ThreadWatcher],
    ['Thread Watcher (Menu)',     ThreadWatcher.menu],
    ['Mark New IPs',              MarkNewIPs],
    ['Index Navigation',          Nav],
    ['Keybinds',                  Keybinds],
    ['Banner',                    Banner],
    ['Announcements',             PSA],
    ['Flash Features',            Flash],
    ['Reply Pruning',             ReplyPruning],
    ['Mod Contact Links',         ModContact],
    ['Restore deleted posts from archive', RestoreDeletedFromArchive],
    ['Mark posts on scroll bar',  ScrollMarkers],
  ]
};
Callbacks.errorHandler = Main.handleErrors;


// Avoid Rollup tree-shaking of Main and its features
if (typeof window !== 'undefined') {
  $.ready(() => Main.init());
}

// #region tests_enabled
Main.features.push(['Build Test', Test]);
// #endregion
