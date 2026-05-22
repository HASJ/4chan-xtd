import Redirect from "../Archive/Redirect";
import Notice from "../classes/Notice";
import { Conf, d, doc, E, g } from "../globals/globals";
import CatalogLinks from "../Miscellaneous/CatalogLinks";
import $ from "../platform/$";
import $$ from "../platform/$$";
import BoardConfig from "./BoardConfig";
import Get from "./Get";
import Settings from "./Settings";
import UI from "./UI";
import meta from '../../package.json';
import Icon from "../Icons/icon";
import UIState from "../globals/UIState";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var Header: any = {
  init() {
    $.onExists(doc, 'body', () => {
      if (!(g.SITE.isThisPageLegit ? g.SITE.isThisPageLegit() : !!$.id('postForm'))) { return; }
      $.add(this.bar, [this.noticesRoot, this.toggle]);
      $.prepend(d.body, this.bar);
      $.add(d.body, UIState.hoverUI);
      return this.setBarPosition(Conf['Bottom Header']);
  });

    this.menu = (UIState.headerMenu = new UI.Menu('header'));

    const menuButton = $.el('span',
      {className: 'menu-button'}
    );
    Icon.set(menuButton, 'caretDown', 'Menu');

    const box = UI.checkbox;

    const barFixedToggler     = box('Fixed Header',               'Fixed Header');
    const headerToggler       = box('Header auto-hide',           'Auto-hide header');
    const scrollHeaderToggler = box('Header auto-hide on scroll', 'Auto-hide header on scroll');
    const barPositionToggler  = box('Bottom Header',              'Bottom header');
    const linkJustifyToggler  = box('Centered links',             'Centered links');
    const customNavToggler    = box('Custom Board Navigation',    'Custom board navigation');
    const footerToggler       = box('Bottom Board List',          'Hide bottom board list');
    const shortcutToggler     = box('Shortcut Icons',             'Shortcut Icons');
    const editCustomNav = $.el('a', {
      textContent: 'Edit custom board navigation',
      href: 'javascript:;'
    }
    );

    this.barFixedToggler     = barFixedToggler.firstElementChild;
    this.scrollHeaderToggler = scrollHeaderToggler.firstElementChild;
    this.barPositionToggler  = barPositionToggler.firstElementChild;
    this.linkJustifyToggler  = linkJustifyToggler.firstElementChild;
    this.headerToggler       = headerToggler.firstElementChild;
    this.footerToggler       = footerToggler.firstElementChild;
    this.shortcutToggler     = shortcutToggler.firstElementChild;
    this.customNavToggler    = customNavToggler.firstElementChild;

    $.on(menuButton,           'click',  this.menuToggle);
    $.on(this.headerToggler,       'change', this.toggleBarVisibility);
    $.on(this.barFixedToggler,     'change', this.toggleBarFixed);
    $.on(this.barPositionToggler,  'change', this.toggleBarPosition);
    $.on(this.scrollHeaderToggler, 'change', this.toggleHideBarOnScroll);
    $.on(this.linkJustifyToggler,  'change', this.toggleLinkJustify);
    $.on(this.footerToggler,       'change', this.toggleFooterVisibility);
    $.on(this.shortcutToggler,     'change', this.toggleShortcutIcons);
    $.on(this.customNavToggler,    'change', this.toggleCustomNav);
    $.on(editCustomNav,        'click',  this.editCustomNav);

    this.setBarFixed(Conf['Fixed Header']);
    this.setHideBarOnScroll(Conf['Header auto-hide on scroll']);
    this.setBarVisibility(Conf['Header auto-hide']);
    this.setLinkJustify(Conf['Centered links']);
    this.setShortcutIcons(Conf['Shortcut Icons']);
    this.setFooterVisibility(Conf['Bottom Board List']);

    $.sync('Fixed Header',               this.setBarFixed);
    $.sync('Header auto-hide on scroll', this.setHideBarOnScroll);
    $.sync('Bottom Header',              this.setBarPosition);
    $.sync('Shortcut Icons',             this.setShortcutIcons);
    $.sync('Header auto-hide',           this.setBarVisibility);
    $.sync('Centered links',             this.setLinkJustify);
    $.sync('Bottom Board List',          this.setFooterVisibility);

    UIState.addShortcut('menu', menuButton, 900);

    this.menu.addEntry({
      el: $.el('span',
        {textContent: 'Header'}),
      order: 107,
      subEntries: [
          {el: barFixedToggler}
        ,
          {el: headerToggler}
        ,
          {el: scrollHeaderToggler}
        ,
          {el: barPositionToggler}
        ,
          {el: linkJustifyToggler}
        ,
          {el: footerToggler}
        ,
          {el: shortcutToggler}
        ,
          {el: customNavToggler}
        ,
          {el: editCustomNav}
      ]});

    $.on(d, 'CreateNotification', this.createNotification);

    this.setBoardList();

    $.onExists(doc, `${g.SITE.selectors.boardList} + *`, this.generateFullBoardList);

    $.ready(function() {
      const isPageLegit = g.SITE.isThisPageLegit ? g.SITE.isThisPageLegit() : !/^[45]\d\d\b/.test(document.title) && !/\.(?:json|rss)$/.test(location.pathname);
      if (!isPageLegit) { return; }
      let footer;
      if ((g.SITE.software === 'yotsuba') && !(footer = $.id('boardNavDesktopFoot'))) {
        let absbot;
        if (!(absbot = $.id('absbot'))) { return; }
        footer = $.id('boardNavDesktop').cloneNode(true);
        footer.id = 'boardNavDesktopFoot';
        $('#navtopright',        footer).id = 'navbotright';
        $('#settingsWindowLink', footer).id = 'settingsWindowLinkBot';
        $.before(absbot, footer);
        $.global('stubCloneTopNav');
      }
      if (this.bottomBoardList = $(g.SITE.selectors.boardListBottom) as HTMLElement) {
        for (var a of $$('a', this.bottomBoardList)) {
          if (((a as any).hostname === location.hostname) && ((a as any).pathname.split('/')[1] === g.BOARD.ID)) { a.className = 'current'; }
        }
        return CatalogLinks.setLinks(this.bottomBoardList);
      }
    });

    if ((g.SITE.software === 'yotsuba') && ((g.VIEW === 'catalog') || !Conf['Disable Native Extension'])) {
      const cs = $.el('a', {href: 'javascript:;'});
      if (g.VIEW === 'catalog') {
        cs.title = (cs.textContent = 'Catalog Settings');
        Icon.set(cs, 'bookOpen', 'Catalog Settings');
        UIState.addShortcut('native', cs, 810);
      } else {
        cs.title = (cs.textContent = '4chan Settings');
        cs.className = 'native-settings';
        UIState.addShortcut('native', cs, 810);
      }
      $.on(cs, 'click', () => $.id('settingsWindowLink').click());
    }

    return this.enableDesktopNotifications();
  },

  bar: UIState.headerBar,

  bottomBoardList: undefined as HTMLElement | undefined,
  boardList: undefined as HTMLElement | undefined,

  noticesRoot: UIState.noticesRoot,

  shortcuts: UIState.shortcutsRoot,

  toggle: UIState.scrollMarkerRoot,

  setBoardList() {
    let boardList;
    this.boardList = (boardList = $.el('span',
      {id: 'board-list'}));
    $.extend(boardList, {innerHTML: "<span id=\"custom-board-list\"></span><span id=\"full-board-list\" hidden><span class=\"hide-board-list-container brackets-wrap\"><a href=\"javascript:;\" class=\"hide-board-list-button\">&nbsp;-&nbsp;</a></span> <span class=\"boardList\"></span></span>"});

    const btn = $('.hide-board-list-button', boardList);
    $.on(btn, 'click', this.toggleBoardList);

    $.prepend(this.bar, [this.boardList, this.shortcuts]);

    this.setCustomNav(Conf['Custom Board Navigation']);
    this.generateBoardList(Conf['boardnav']);

    $.sync('Custom Board Navigation', this.setCustomNav);
    return $.sync('boardnav', this.generateBoardList);
  },

  generateFullBoardList() {
    let nodes;
    if (g.SITE.transformBoardList) {
      nodes = g.SITE.transformBoardList();
    } else {
      nodes = [...$(g.SITE.selectors.boardList).cloneNode(true).childNodes];
    }
    const fullBoardList = $('.boardList', this.boardList);
    $.add(fullBoardList, nodes);
    for (var a of $$('a', fullBoardList)) {
      if (((a as any).hostname === location.hostname) && ((a as any).pathname.split('/')[1] === g.BOARD.ID)) { a.className = 'current'; }
    }
    return CatalogLinks.setLinks(fullBoardList);
  },

  generateBoardList(boardnav: string) {
    const list = $('#custom-board-list', this.boardList);
    $.rmAll(list);
    if (!boardnav) return;
    boardnav = boardnav.replace(/(\r\n|\n|\r)/g, ' ');
    const segments = boardnav.split(/(\{\{(?:"[^"]+")?|\}\})/);
    const spanStack = [];
    let currentContainer = list;
    segments.forEach(segment => {
      if (segment.startsWith('{{')) {
        const span = $.el('span');
        $.add(currentContainer, span);
        spanStack.push(span);
        currentContainer = span;
        if (segment.length > 2) span.className = segment.slice(3, -1);
      } else if (segment === '}}') {
        spanStack.pop();
        currentContainer = spanStack.length > 0 ? spanStack[spanStack.length - 1] : list;
      } else {
        const re = /[\w@]+(-(all|title|replace|full|index|catalog|archive|expired|nt|(mode|sort|text):"[^"]+"(,"[^"]+")?))*|[^\w@]+/g;
        const segmentNodes = (segment.match(re) || []).map((t) => this.mapCustomNavigation(t));
        segmentNodes.forEach(node => currentContainer.appendChild(node));
      }
    });
    return CatalogLinks.setLinks(list);
  },

  mapCustomNavigation(t) {
    let a, href, m, url;
    if (/^[^\w@]/.test(t)) {
      return $.tn(t);
    }

    let text = (url = null);
    t = t.replace(/-text:"([^"]+)"(?:,"([^"]+)")?/g, function(m0, m1, m2) {
      text = m1;
      url  = m2;
      return '';
    });

    let indexOptions: any = [];
    t = t.replace(/-(?:mode|sort):"([^"]+)"/g, function(m0, m1) {
      indexOptions.push(m1.toLowerCase().replace(/\ /g, '-'));
      return '';
    });
    indexOptions = indexOptions.join('/');

    if (/^toggle-all/.test(t)) {
      a = $.el('a', {
        className: 'show-board-list-button',
        textContent: text || '+',
        href: 'javascript:;'
      }
      );
      $.on(a, 'click', this.toggleBoardList);
      return a;
    }

    if (/^external/.test(t)) {
      a = $.el('a', {
        href: url || 'javascript:;',
        textContent: text || '+',
        className: 'external'
      }
      );
      if (/-nt/.test(t)) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
      return a;
    }

    let boardID = t.split('-')[0];
    if (boardID === 'current') {
      if (['boards.4chan.org', 'boards.4channel.org'].includes(location.hostname)) {
        boardID = g.BOARD.ID;
      } else {
        a = $.el('a', {
          href: `/${g.BOARD.ID}/`,
          textContent: text || decodeURIComponent(g.BOARD.ID),
          className: 'current'
        }
        );
        if (/-nt/.test(t)) {
          a.target = '_blank';
          a.rel = 'noopener';
        }
        if (/-index/.test(t)) {
          a.dataset.only = 'index';
        } else if (/-catalog/.test(t)) {
          a.dataset.only = 'catalog';
          a.href += 'catalog.html';
        } else if (/-(archive|expired)/.test(t)) {
          a = a.firstChild; // Its text node.
        }
        return a;
      }
    }

    a = (function() {
      let urlV;
      if (boardID === '@') {
        return $.el('a', {
          href: 'https://twitter.com/4chan',
          title: '4chan Twitter',
          className: 'navSmall',
          textContent: '@'
        }
        );
      }

      a = $.el('a', {
        href: `//${BoardConfig.domain(boardID)}/${boardID}/`,
        textContent: boardID,
        title: BoardConfig.title(boardID)
      }
      );
      if (['catalog', 'archive'].includes(g.VIEW) && (urlV = Get.url(g.VIEW, {siteID: '4chan.org', boardID}))) {
        a.href = urlV;
      }
      if ((a.hostname === location.hostname) && (boardID === g.BOARD.ID)) { a.className = 'current'; }
      return a;
    })();

    a.textContent = /-title/.test(t) || (/-replace/.test(t) && (a.hostname === location.hostname) && (boardID === g.BOARD.ID)) ?
      a.title || a.textContent
    : /-full/.test(t) ?
      (`/${boardID}/`) + (a.title ? ` - ${a.title}` : '')
    :
      text || boardID;

    if (m = t.match(/-(index|catalog)/)) {
      const urlIC = CatalogLinks[m[1]]({siteID: '4chan.org', boardID});
      if (urlIC) {
        a.dataset.only = m[1];
        a.href = urlIC;
        if (m[1] === 'catalog') { $.addClass(a, 'catalog'); }
      } else {
        return a.firstChild; // Its text node.
      }
    }

    if (Conf['JSON Index'] && indexOptions) {
      a.dataset.indexOptions = indexOptions;
      if (['boards.4chan.org', 'boards.4channel.org'].includes(a.hostname) && (a.pathname.split('/')[2] === '')) {
        a.href += (a.hash ? '/' : '#') + indexOptions;
      }
    }

    if (/-archive/.test(t)) {
      if (href = Redirect.to('board', {boardID})) {
        a.href = href;
      } else {
        return a.firstChild; // Its text node.
      }
    }

    if (/-expired/.test(t)) {
      if (BoardConfig.isArchived(boardID)) {
        a.href = `//${BoardConfig.domain(boardID)}/${boardID}/archive`;
      } else {
        return a.firstChild; // Its text node.
      }
    }

    if (/-nt/.test(t)) {
      a.target = '_blank';
      a.rel = 'noopener';
    }

    return a;
  },

  toggleBoardList() {
    const {bar}  = Header;
    const custom = $('#custom-board-list', bar);
    const full   = $('#full-board-list',   bar);
    const showBoardList = !full.hidden;
    custom.hidden = !showBoardList;
    return full.hidden   =  showBoardList;
  },

  setLinkJustify(centered) {
    this.linkJustifyToggler.checked = centered;
    if (centered) {
      return $.addClass(doc, 'centered-links');
    } else {
      return $.rmClass(doc, 'centered-links');
    }
  },

  toggleLinkJustify() {
    $.event('CloseMenu', null);
    const centered = this.nodeName === 'INPUT' ?
      this.checked : undefined;
    this.setLinkJustify(centered);
    return $.set('Centered links', centered);
  },

  setBarFixed(fixed) {
    this.barFixedToggler.checked = fixed;
    if (fixed) {
      $.addClass(doc, 'fixed');
      return $.addClass(this.bar, 'dialog');
    } else {
      $.rmClass(doc, 'fixed');
      return $.rmClass(this.bar, 'dialog');
    }
  },

  toggleBarFixed() {
    $.event('CloseMenu', null);

    this.setBarFixed(this.checked);

    Conf['Fixed Header'] = this.checked;
    return $.set('Fixed Header',  this.checked);
  },

  setShortcutIcons(show) {
    this.shortcutToggler.checked = show;
    if (show) {
      return $.addClass(doc, 'shortcut-icons');
    } else {
      return $.rmClass(doc, 'shortcut-icons');
    }
  },

  toggleShortcutIcons() {
    $.event('CloseMenu', null);

    this.setShortcutIcons(this.checked);

    Conf['Shortcut Icons'] = this.checked;
    return $.set('Shortcut Icons',  this.checked);
  },

  setBarVisibility(hide) {
    this.headerToggler.checked = hide;
    $.event('CloseMenu', null);
    (hide ? $.addClass : $.rmClass)(this.bar, 'autohide');
    return (hide ? $.addClass : $.rmClass)(doc, 'autohide');
  },

  toggleBarVisibility() {
    const hide = this.nodeName === 'INPUT' ?
      this.checked
    :
      !$.hasClass(this.bar, 'autohide');

    Conf['Header auto-hide'] = hide;
    $.set('Header auto-hide', hide);
    this.setBarVisibility(hide);
    const message = `The header bar will ${hide ?
      'automatically hide itself.'
    :
      'remain visible.'}`;
    return new Notice('info', message, 2);
  },

  setHideBarOnScroll(hide) {
    this.scrollHeaderToggler.checked = hide;
    if (hide) {
      $.on(window, 'scroll', this.hideBarOnScroll);
      return;
    }
    $.off(window, 'scroll', this.hideBarOnScroll);
    $.rmClass(this.bar, 'scroll');
    return this.bar.classList.toggle('autohide', Conf['Header auto-hide']);
  },

  toggleHideBarOnScroll() {
    const hide = this.checked;
    $.cb.checked.call(this);
    return this.setHideBarOnScroll(hide);
  },

  hideBarOnScroll() {
    const offsetY = window.pageYOffset;
    if (offsetY > (this.previousOffset || 0)) {
      $.addClass(this.bar, 'autohide', 'scroll');
    } else {
      $.rmClass(this.bar,  'autohide', 'scroll');
    }
    return this.previousOffset = offsetY;
  },

  setBarPosition(bottom) {
    if (this.barPositionToggler) this.barPositionToggler.checked = bottom;
    $.event('CloseMenu', null);
    const args = bottom ? [
      'bottom-header',
      'top-header',
      'after'
    ] : [
      'top-header',
      'bottom-header',
      'add'
    ];

    $.addClass(doc, args[0]);
    $.rmClass(doc, args[1]);
    return $[args[2]](this.bar, UIState.noticesRoot);
  },

  toggleBarPosition() {
    $.cb.checked.call(this);
    return this.setBarPosition(this.checked);
  },

  setFooterVisibility(hide) {
    this.footerToggler.checked = hide;
    return doc.classList.toggle('hide-bottom-board-list', hide);
  },

  toggleFooterVisibility() {
    $.event('CloseMenu', null);
    const hide = this.nodeName === 'INPUT' ?
      this.checked
    :
      $.hasClass(doc, 'hide-bottom-board-list');
    this.setFooterVisibility(hide);
    $.set('Bottom Board List', hide);
    const message = hide ?
      'The bottom navigation will now be hidden.'
    :
      'The bottom navigation will remain visible.';
    return new Notice('info', message, 2);
  },

  setCustomNav(show) {
    this.customNavToggler.checked = show;
    const cust = $('#custom-board-list', this.bar);
    const full = $('#full-board-list',   this.bar);
    const btn = $('.hide-board-list-container', full);
    return [cust.hidden, full.hidden, btn.hidden] = show ? [false, true, false] : [true, false, true];
  },

  toggleCustomNav() {
    $.cb.checked.call(this);
    return this.setCustomNav(this.checked);
  },

  editCustomNav() {
    Settings.open('Advanced');
    const settings = $.id('fourchanx-settings');
    return $('[name=boardnav]', settings).focus();
  },

  scrollTo(root: HTMLElement, down = false, needed = false) {
    return UIState.scrollTo(root, down, needed);
  },

  scrollToIfNeeded(root, down) {
    return UIState.scrollToIfNeeded(root, down);
  },

  getTopOf(root) {
    return UIState.getTopOf(root);
  },

  getBottomOf(root) {
    return UIState.getBottomOf(root);
  },

  isNodeVisible(node) {
    return UIState.isNodeVisible(node);
  },

  isHidden() {
    return UIState.isHeaderHidden();
  },

  menuToggle(e) {
    return UIState.headerMenu.toggle(e, this, g);
  },

  createNotification(e) {
    let notice;
    const {type, content, lifetime} = e.detail;
    return notice = new Notice(type, content, lifetime);
  },

  enableDesktopNotifications() {
    let notice;
    if (!window.Notification || !Conf['Desktop Notifications']) { return; }
    switch (Notification.permission) {
      case 'granted':
        UIState.areNotificationsEnabled = true;
        return;
        break;
      case 'denied':
        // requestPermission doesn't work if status is 'denied',
        // but it'll still work if status is 'default'.
        return;
        break;
    }

    const el = $.el('span',
      {innerHTML:
        `${meta.name} needs your permission to show desktop notifications. ` +
        `[<a href=\"${E(meta.upstreamFaq)}#why-is-4chan-x-asking-for-permission-to-show-desktop-notifications\" target=\"_blank\">FAQ</a>]` +
        `<br><button>Authorize</button> or <button>Disable</button>`
    });
    const [authorize, disable] = $$('button', el);
    $.on(authorize, 'click', () => Notification.requestPermission(function(status) {
      UIState.areNotificationsEnabled = status === 'granted';
      if (status === 'default') { return; }
      return notice.close();
    }));
    $.on(disable, 'click', function() {
      $.set('Desktop Notifications', false);
      return notice.close();
    });
    return notice = new Notice('info', el);
  }
};
export default Header;
