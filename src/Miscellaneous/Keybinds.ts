import Notice from "../classes/Notice";
import Config from "../config/Config";
import Filter from "../Filtering/Filter";
import ThreadHiding from "../Filtering/ThreadHiding";
import BoardConfig from "../General/BoardConfig";
import Get from "../General/Get";
import Header from "../General/Header";
import UIState from "../globals/UIState";
import Index from "../General/Index";
import Settings from "../General/Settings";
import { Conf, d, g } from "../globals/globals";
import FappeTyme from "../Images/FappeTyme";
import Gallery from "../Images/Gallery";
import ImageExpand from "../Images/ImageExpand";
import Embedding from "../Linkification/Embedding";
import ThreadUpdater from "../Monitoring/ThreadUpdater";
import ThreadWatcher from "../Monitoring/ThreadWatcher";
import UnreadIndex from "../Monitoring/UnreadIndex";
import $ from "../platform/$";
import $$ from "../platform/$$";
import QR from "../Posting/QR";
import QuoteThreading from "../Quotelinks/QuoteThreading";
import QuoteYou from "../Quotelinks/QuoteYou";
import CatalogLinks from "./CatalogLinks";
import ExpandThread from "./ExpandThread";
import keyCode from "./KeyCode";
import { enableKeybindHandler, registerKeybindHandler } from "./KeybindEvents";
import Nav from "./Nav";

const Keybinds: any = {
  init() {
    if (!Conf['Keybinds']) { return; }

    for (const hotkey in Config.hotkeys) {
      $.sync(hotkey, Keybinds.sync);
    }

    const init = function() {
      $.off(d, '4chanXInitFinished', init);
      enableKeybindHandler();
      for (const node of $$('[accesskey]')) {
        node.removeAttribute('accesskey');
      }
    };
    return $.on(d, '4chanXInitFinished', init);
  },

  sync(key, hotkey) {
    Conf[hotkey] = key;
  },

  keydown(e) {
    const context = Keybinds.keydownContext(e);
    if (!context) { return; }

    const result = Keybinds.runKeybindHandlers(context);
    if (result === 'abort') { return; }
    if (result) {
      e.preventDefault();
      e.stopPropagation();
    }
  },

  keydownContext(e) {
    const key = keyCode(e);
    if (!key) { return; }

    const {target} = e;
    if (['INPUT', 'TEXTAREA'].includes(target.nodeName)) {
      if (!/(Esc|Alt|Ctrl|Meta|Shift\+\w{2,})/.test(key) || /^Alt\+(\d|Up|Down|Left|Right)$/.test(key)) { return; }
    }

    let thread;
    let threadRoot;
    if (g.VIEW === 'index' || g.VIEW === 'thread') {
      threadRoot = Nav.getThread();
      thread = threadRoot && Get.threadFromRoot(threadRoot);
    }

    return {e, key, target, thread, threadRoot};
  },

  runKeybindHandlers(context) {
    let hasAction = false;
    for (const handler of [
      Keybinds.handleOptions,
      Keybinds.handleTags,
      Keybinds.handleQr,
      Keybinds.handleIndexThread,
      Keybinds.handleImages,
      Keybinds.handleBoardNavigation,
      Keybinds.handleThreadNavigation,
      Keybinds.handleReplyNavigation
    ]) {
      const result = handler(context);
      if (result === 'abort') { return result; }
      if (result) { hasAction = true; }
    }
    return hasAction;
  },

  runActions(actions) {
    let hasAction = false;
    for (const [condition, action] of actions) {
      if (condition) {
        action();
        hasAction = true;
      }
    }
    return hasAction;
  },

  handleOptions({key, threadRoot}) {
    return Keybinds.runActions([
      [key === Conf['Toggle board list'] && Conf['Custom Board Navigation'], () => Header.toggleBoardList()],
      [key === Conf['Toggle header'], () => Header.toggleBarVisibility()],
      [key === Conf['Open empty QR'] && QR.postingIsEnabled, () => Keybinds.qr()],
      [key === Conf['Open QR'] && QR.postingIsEnabled && threadRoot, () => Keybinds.qr(threadRoot)],
      [key === Conf['Open settings'], () => (Settings as any).open()],
      [key === Conf['Close'], () => Keybinds.close()]
    ]);
  },

  close() {
    if (Settings.dialog) {
      Settings.close();
      return;
    }

    const notifications = $$('.notification');
    if (notifications.length) {
      for (const notification of notifications) {
        $('.close', notification).click();
      }
      return;
    }

    if (QR.nodes?.preview) {
      QR.closePreview();
      return;
    }

    if (QR.nodes && !(QR.nodes.el.hidden || (window.getComputedStyle(QR.nodes.form).display === 'none'))) {
      if (Conf['Persistent QR']) {
        QR.hide();
      } else {
        QR.close();
      }
      return;
    }

    if ((Embedding as any).lastEmbed) {
      (Embedding as any).closeFloat();
    }
  },

  handleTags({key, target}) {
    if (target.nodeName !== 'TEXTAREA') { return false; }
    return Keybinds.runActions([
      [key === Conf['Spoiler tags'], () => Keybinds.tags('spoiler', target)],
      [key === Conf['Code tags'], () => Keybinds.tags('code', target)],
      [key === Conf['Eqn tags'], () => Keybinds.tags('eqn', target)],
      [key === Conf['Math tags'], () => Keybinds.tags('math', target)],
      [key === Conf['SJIS tags'], () => Keybinds.tags('sjis', target)]
    ]);
  },

  handleQr({key}) {
    return Keybinds.runActions([
      [key === Conf['Toggle sage'] && QR.nodes && !QR.nodes.el.hidden, () => Keybinds.sage()],
      [key === Conf['Toggle Cooldown'] && QR.nodes && !QR.nodes.el.hidden && $.hasClass(QR.nodes.fileSubmit, 'custom-cooldown'), () => QR.toggleCustomCooldown()],
      [key === Conf['Post from URL'] && QR.postingIsEnabled, () => QR.handleUrl('')],
      [key === Conf['Add new post'] && QR.postingIsEnabled, () => QR.addPost()],
      [key === Conf['Submit QR'] && QR.nodes && !QR.nodes.el.hidden && !QR.status(), () => (QR as any).submit()]
    ]);
  },

  handleIndexThread({key, thread, threadRoot}) {
    return Keybinds.runActions([
      [key === Conf['Update'] && !!g.VIEW && ['thread', 'index'].includes(g.VIEW), () => Keybinds.update()],
      [key === Conf['Watch'] && ThreadWatcher.enabled && thread, () => ThreadWatcher.toggle(thread)],
      [key === Conf['Update thread watcher'] && ThreadWatcher.enabled, () => ThreadWatcher.buttonFetchAll()],
      [key === Conf['Toggle thread watcher'] && ThreadWatcher.enabled, () => ThreadWatcher.toggleWatcher()],
      [key === Conf['Toggle threading'] && (QuoteThreading as any).ready, () => QuoteThreading.toggleThreading()],
      [key === Conf['Mark thread read'] && g.VIEW === 'index' && thread && UnreadIndex.enabled, () => UnreadIndex.markRead.call(threadRoot!)]
    ]);
  },

  update() {
    if (g.VIEW === 'thread') {
      if (ThreadUpdater.enabled) { ThreadUpdater.update(); }
      return;
    }

    if (Index.enabled) {
      Index.update();
    }
  },

  handleImages({key, threadRoot}) {
    const expanded = Keybinds.expandSelectedImage(key, threadRoot);
    const toggled = Keybinds.runActions([
      [key === Conf['Expand images'] && (ImageExpand as any).enabled, () => ImageExpand.cb.toggleAll()],
      [key === Conf['Open Gallery'] && Gallery.enabled, () => Gallery.cb.toggle()],
      [key === Conf['fappeTyme'] && FappeTyme.nodes?.fappe, () => FappeTyme.toggle('fappe')],
      [key === Conf['werkTyme'] && FappeTyme.nodes?.werk, () => FappeTyme.toggle('werk')]
    ]);
    return expanded || toggled;
  },

  expandSelectedImage(key, threadRoot) {
    if (key !== Conf['Expand image'] || !(ImageExpand as any).enabled || !threadRoot) { return false; }
    const post = Get.postFromNode(Keybinds.post(threadRoot));
    if (!post.file) { return false; }
    ImageExpand.toggle(post);
    return true;
  },

  handleBoardNavigation({key}) {
    let hasAction = Keybinds.runActions([
      [key === Conf['Front page'], () => Keybinds.frontPage()],
      [key === Conf['Open front page'] && g.BOARD, () => $.open(`${location.origin}/${g.BOARD!.ID}/`)]
    ]);

    for (const pageArgs of [
      ['Next page', 'next', '.next button'],
      ['Previous page', 'prev', '.prev button']
    ]) {
      const result = Keybinds.page(key, ...pageArgs);
      if (result === 'abort') { return result; }
      if (result) { hasAction = true; }
    }

    if (Keybinds.searchForm(key)) { hasAction = true; }
    Keybinds.modeLinks(key);
    if (Keybinds.runActions([[key === Conf['Cycle sort type'] && Index.enabled, () => Index.cycleSortType()]])) { hasAction = true; }
    return hasAction;
  },

  frontPage() {
    if (Index.enabled) {
      Index.userPageNav(1);
    } else if (g.BOARD) {
      location.href = `/${g.BOARD.ID}/`;
    }
  },

  page(key, name, navKey, indexSelector) {
    if (key !== Conf[name] || g.VIEW !== 'index' || !g.BOARD || g.SITE.isOnePage?.(g.BOARD)) { return false; }
    if (!Index.enabled) {
      $(g.SITE.selectors.nav[navKey]!)?.click();
      return true;
    }
    if (Conf['Index Mode'] !== 'paged' && Conf['Index Mode'] !== 'infinite') { return 'abort'; }
    $(indexSelector, Index.pagelist).click();
    return true;
  },

  searchForm(key) {
    if (key !== Conf['Search form'] || g.VIEW !== 'index') { return false; }
    const searchInput = Index.enabled ? Index.searchInput : g.SITE.selectors.searchBox && $(g.SITE.selectors.searchBox);
    if (!searchInput) { return false; }
    UIState.scrollToIfNeeded(searchInput);
    searchInput.focus();
    return true;
  },

  modeLinks(key) {
    const board = g.BOARD;
    if (!board) { return; }
    Keybinds.runActions([
      [key === Conf['Paged mode'] && Index.enabledOn(board), () => { location.href = g.VIEW === 'index' ? '#paged' : `/${board.ID}/#paged`; }],
      [key === Conf['Infinite scrolling mode'] && Index.enabledOn(board), () => { location.href = g.VIEW === 'index' ? '#infinite' : `/${board.ID}/#infinite`; }],
      [key === Conf['All pages mode'] && Index.enabledOn(board), () => { location.href = g.VIEW === 'index' ? '#all-pages' : `/${board.ID}/#all-pages`; }]
    ]);
    Keybinds.openCatalog(key);
  },

  openCatalog(key) {
    if (key !== Conf['Open catalog']) { return; }
    const catalog = CatalogLinks.catalog();
    if (catalog) {
      location.href = catalog;
    }
  },

  handleThreadNavigation({key, thread, threadRoot}) {
    return Keybinds.runActions([
      [key === Conf['Next thread'] && g.VIEW === 'index' && threadRoot, () => Nav.scroll(+1)],
      [key === Conf['Previous thread'] && g.VIEW === 'index' && threadRoot, () => Nav.scroll(-1)],
      [key === Conf['Expand thread'] && g.VIEW === 'index' && threadRoot, () => Keybinds.expandThread(thread, threadRoot)],
      [key === Conf['Open thread'] && g.VIEW === 'index' && threadRoot, () => Keybinds.open(thread)],
      [key === Conf['Open thread tab'] && g.VIEW === 'index' && threadRoot, () => Keybinds.open(thread, true)]
    ]);
  },

  expandThread(thread, threadRoot) {
    ExpandThread.toggle(thread);
    // Keep thread from moving off screen when contracted.
    UIState.scrollTo(threadRoot);
  },

  handleReplyNavigation({e, key, thread, threadRoot}) {
    return Keybinds.runActions([
      [key === Conf['Next reply'] && threadRoot, () => Keybinds.hl(+1, threadRoot)],
      [key === Conf['Previous reply'] && threadRoot, () => Keybinds.hl(-1, threadRoot)],
      [key === Conf['Deselect reply'] && threadRoot, () => Keybinds.hl(0, threadRoot)],
      [key === Conf['Hide'] && thread && ThreadHiding.db, () => Keybinds.hideThread(thread, threadRoot)],
      [key === Conf['Quick Filter MD5'] && threadRoot, () => Keybinds.quickFilterMD5(threadRoot, e)],
      [key === Conf['Previous Post Quoting You'] && threadRoot && QuoteYou.db, () => QuoteYou.cb.seek('preceding')],
      [key === Conf['Next Post Quoting You'] && threadRoot && QuoteYou.db, () => QuoteYou.cb.seek('following')]
    ]);
  },

  hideThread(thread, threadRoot) {
    UIState.scrollTo(threadRoot);
    ThreadHiding.toggle(thread);
  },

  quickFilterMD5(threadRoot, e) {
    const post = Keybinds.post(threadRoot);
    Keybinds.hl(+1, threadRoot);
    Filter.quickFilterMD5.call(post, e);
  },

  keyCode,

  post(thread) {
    const s = g.SITE.selectors;
    return (
      $(`${s.postContainer}${s.highlightable.reply}.${g.SITE.classes.highlight}`, thread) ||
      $(`${g.SITE.isOPContainerThread ? s.thread : s.postContainer}${s.highlightable.op}`, thread)
    );
  },

  qr(thread) {
    QR.open();
    if (thread != null) {
      QR.quote.call(Keybinds.post(thread), null);
    }
    return QR.nodes.com.focus();
  },

  tags(tag, ta) {
    BoardConfig.ready(function() {
      const board = g.BOARD;
      if (!board) { return; }
      const {config} = board as any;
      const supported = !!{
        spoiler: config.spoilers,
        code: config.code_tags,
        math: config.math_tags,
        eqn: config.math_tags,
        sjis: config.sjis_tags
      }[tag];
      if (!supported) { return new Notice('warning', `[${tag}] tags are not supported on /${board.ID}/.`, 20); }
    });

    const {
      value
    } = ta;
    const selStart = ta.selectionStart;
    const selEnd   = ta.selectionEnd;

    ta.value =
      value.slice(0, selStart) +
      `[${tag}]` + value.slice(selStart, selEnd) + `[/${tag}]` +
      value.slice(selEnd);

    // Move the caret to the end of the selection.
    const range = (`[${tag}]`).length + selEnd;
    ta.setSelectionRange(range, range);

    // Fire the 'input' event
    $.event('input', null, ta);
  },

  sage() {
    const isSage  = /sage/i.test(QR.nodes.email.value);
    QR.nodes.email.value = isSage ?
      ""
    : "sage";
  },

  open(thread, tab) {
    if (g.VIEW !== 'index') { return; }
    const url = Get.url('thread', thread);
    if (tab) {
      return $.open(url);
    }
    location.href = url;
  },

  hl(delta, thread) {
    const replySelector = `${g.SITE.selectors.postContainer}${g.SITE.selectors.highlightable.reply}`;
    const {highlight} = g.SITE.classes;
    const postEl = $(`${replySelector}.${highlight}`, thread);

    if (!delta) {
      Keybinds.clearHighlight(postEl, highlight);
      return;
    }

    if (postEl) {
      if (Keybinds.moveHighlightFromVisiblePost(postEl, replySelector, highlight, delta)) { return; }
      $.rmClass(postEl, highlight);
    }

    Keybinds.highlightFirstVisibleReply(delta, thread, replySelector, highlight);
  },

  clearHighlight(postEl, highlight) {
    if (postEl) {
      $.rmClass(postEl, highlight);
    }
  },

  moveHighlightFromVisiblePost(postEl, replySelector, highlight, delta) {
    const {height} = postEl.getBoundingClientRect();
    if ((UIState.getTopOf(postEl) < -height) || (UIState.getBottomOf(postEl) < -height)) { return false; }

    const {root} = Get.postFromNode(postEl).nodes;
    const axis = delta === +1 ? 'following' : 'preceding';
    let next = $.x(`${axis}-sibling::${g.SITE.xpath.replyContainer}[not(@hidden) and not(child::div[@class='stub'])][1]`, root);
    if (!next) { return true; }

    if (!next.matches(replySelector)) { next = $(replySelector, next); }
    UIState.scrollToIfNeeded(next, delta === +1);
    $.addClass(next, highlight);
    $.rmClass(postEl, highlight);
    return true;
  },

  highlightFirstVisibleReply(delta, thread, replySelector, highlight) {
    const replies = $$(replySelector, thread);
    if (delta === -1) { replies.reverse(); }
    for (const reply of replies) {
      if (Keybinds.isReplyInScrollDirection(reply, delta)) {
        $.addClass(reply, highlight);
        return;
      }
    }
  },

  isReplyInScrollDirection(reply, delta) {
    return ((delta === +1) && (UIState.getTopOf(reply) > 0)) || ((delta === -1) && (UIState.getBottomOf(reply) > 0));
  }
};

registerKeybindHandler(Keybinds.keydown);

export default Keybinds;

