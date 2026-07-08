import Redirect from "../Archive/Redirect";
import Notice from "../classes/Notice";
import { Conf, d, doc, E, g } from "../globals/globals";
import $ from "../platform/$";
import $$ from "../platform/$$";
import BoardConfig from "./BoardConfig";
import Get from "./Get";
import UI from "./UI";
import meta from '../../package.json';
import Icon from "../Icons/icon";
import { setBoardLinkURL, updateBoardListLinks } from "./HeaderBoardLists";
import { openSettings } from "./SettingsBridge";
import UIState from "../globals/UIState";

var Header: any = {
  init() {
    $.onExists(doc, 'body', () => {
      if (!(g.SITE.isThisPageLegit ? g.SITE.isThisPageLegit() : !!$.id('postForm'))) { return; }
      $.add(Header.bar, [Header.noticesRoot, Header.toggle]);
      $.prepend(d.body, Header.bar);
      $.add(d.body, UIState.hoverUI);
      return Header.setBarPosition(Conf['Bottom Header']);
    });

    Header.menu = (UIState.headerMenu = new UI.Menu('header'));

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

    Header.barFixedToggler     = barFixedToggler.firstElementChild;
    Header.scrollHeaderToggler = scrollHeaderToggler.firstElementChild;
    Header.barPositionToggler  = barPositionToggler.firstElementChild;
    Header.linkJustifyToggler  = linkJustifyToggler.firstElementChild;
    Header.headerToggler       = headerToggler.firstElementChild;
    Header.footerToggler       = footerToggler.firstElementChild;
    Header.shortcutToggler     = shortcutToggler.firstElementChild;
    Header.customNavToggler    = customNavToggler.firstElementChild;

    $.on(menuButton,           'click',  Header.menuToggle);
    $.on(Header.headerToggler,       'change', Header.toggleBarVisibility);
    $.on(Header.barFixedToggler,     'change', Header.toggleBarFixed);
    $.on(Header.barPositionToggler,  'change', Header.toggleBarPosition);
    $.on(Header.scrollHeaderToggler, 'change', Header.toggleHideBarOnScroll);
    $.on(Header.linkJustifyToggler,  'change', Header.toggleLinkJustify);
    $.on(Header.footerToggler,       'change', Header.toggleFooterVisibility);
    $.on(Header.shortcutToggler,     'change', Header.toggleShortcutIcons);
    $.on(Header.customNavToggler,    'change', Header.toggleCustomNav);
    $.on(editCustomNav,        'click',  Header.editCustomNav);

    Header.setBarFixed(Conf['Fixed Header']);
    Header.setHideBarOnScroll(Conf['Header auto-hide on scroll']);
    Header.setBarVisibility(Conf['Header auto-hide']);
    Header.setLinkJustify(Conf['Centered links']);
    Header.setShortcutIcons(Conf['Shortcut Icons']);
    Header.setFooterVisibility(Conf['Bottom Board List']);

    $.sync('Fixed Header',               Header.setBarFixed);
    $.sync('Header auto-hide on scroll', Header.setHideBarOnScroll);
    $.sync('Bottom Header',              Header.setBarPosition);
    $.sync('Shortcut Icons',             Header.setShortcutIcons);
    $.sync('Header auto-hide',           Header.setBarVisibility);
    $.sync('Centered links',             Header.setLinkJustify);
    $.sync('Bottom Board List',          Header.setFooterVisibility);

    UIState.addShortcut('menu', menuButton, 900);

    Header.menu.addEntry({
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

    $.on(d, 'CreateNotification', Header.createNotification);

    Header.setBoardList();

    $.onExists(doc, `${g.SITE.selectors.boardList} + *`, Header.generateFullBoardList);

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
      if (Header.bottomBoardList = $(g.SITE.selectors.boardListBottom) as HTMLElement) {
        for (var a of $$('a', Header.bottomBoardList)) {
          if (((a as any).hostname === location.hostname) && ((a as any).pathname.split('/')[1] === g.BOARD.ID)) { a.className = 'current'; }
        }
        return updateBoardListLinks(Header.bottomBoardList);
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

    return Header.enableDesktopNotifications();
  },

  bar: UIState.headerBar,

  bottomBoardList: undefined as HTMLElement | undefined,
  boardList: undefined as HTMLElement | undefined,

  noticesRoot: UIState.noticesRoot,

  shortcuts: UIState.shortcutsRoot,

  toggle: UIState.scrollMarkerRoot,

  setBoardList() {
    let boardList;
    Header.boardList = (boardList = $.el('span',
      {id: 'board-list'}));
    $.extend(boardList, {innerHTML: "<span id=\"custom-board-list\"></span><span id=\"full-board-list\" hidden><span class=\"hide-board-list-container brackets-wrap\"><a href=\"javascript:;\" class=\"hide-board-list-button\">&nbsp;-&nbsp;</a></span> <span class=\"boardList\"></span></span>"});

    const btn = $('.hide-board-list-button', boardList);
    $.on(btn, 'click', Header.toggleBoardList);

    $.prepend(Header.bar, [Header.boardList, Header.shortcuts]);

    Header.setCustomNav(Conf['Custom Board Navigation']);
    Header.generateBoardList(Conf['boardnav']);

    $.sync('Custom Board Navigation', Header.setCustomNav);
    return $.sync('boardnav', Header.generateBoardList);
  },

  generateFullBoardList() {
    let nodes;
    if (g.SITE.transformBoardList) {
      nodes = g.SITE.transformBoardList();
    } else {
      nodes = [...$(g.SITE.selectors.boardList).cloneNode(true).childNodes];
    }
    const fullBoardList = $('.boardList', Header.boardList);
    $.add(fullBoardList, nodes);
    for (var a of $$('a', fullBoardList)) {
      if (((a as any).hostname === location.hostname) && ((a as any).pathname.split('/')[1] === g.BOARD.ID)) { a.className = 'current'; }
    }
    return updateBoardListLinks(fullBoardList);
  },

  generateBoardList(boardnav: string) {
    const list = $('#custom-board-list', Header.boardList);
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
        const segmentNodes = (segment.match(re) || []).map((t) => Header.mapCustomNavigation(t));
        segmentNodes.forEach(node => currentContainer.appendChild(node));
      }
    });
    return updateBoardListLinks(list);
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
      $.on(a, 'click', Header.toggleBoardList);
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
      if (!setBoardLinkURL(a, m[1], {siteID: '4chan.org', boardID})) {
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
    Header.linkJustifyToggler.checked = centered;
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
    Header.setLinkJustify(centered);
    return $.set('Centered links', centered);
  },

  setBarFixed(fixed) {
    Header.barFixedToggler.checked = fixed;
    if (fixed) {
      $.addClass(doc, 'fixed');
      return $.addClass(Header.bar, 'dialog');
    } else {
      $.rmClass(doc, 'fixed');
      return $.rmClass(Header.bar, 'dialog');
    }
  },

  toggleBarFixed() {
    $.event('CloseMenu', null);

    Header.setBarFixed(this.checked);

    Conf['Fixed Header'] = this.checked;
    return $.set('Fixed Header',  this.checked);
  },

  setShortcutIcons(show) {
    Header.shortcutToggler.checked = show;
    if (show) {
      return $.addClass(doc, 'shortcut-icons');
    } else {
      return $.rmClass(doc, 'shortcut-icons');
    }
  },

  toggleShortcutIcons() {
    $.event('CloseMenu', null);

    Header.setShortcutIcons(this.checked);

    Conf['Shortcut Icons'] = this.checked;
    return $.set('Shortcut Icons',  this.checked);
  },

  setBarVisibility(hide) {
    Header.headerToggler.checked = hide;
    $.event('CloseMenu', null);
    (hide ? $.addClass : $.rmClass)(Header.bar, 'autohide');
    return (hide ? $.addClass : $.rmClass)(doc, 'autohide');
  },

  toggleBarVisibility() {
    const hide = this.nodeName === 'INPUT' ?
      this.checked
    :
      !$.hasClass(Header.bar, 'autohide');

    Conf['Header auto-hide'] = hide;
    $.set('Header auto-hide', hide);
    Header.setBarVisibility(hide);
    const message = `The header bar will ${hide ?
      'automatically hide itself.'
    :
      'remain visible.'}`;
    return new Notice('info', message, 2);
  },

  setHideBarOnScroll(hide) {
    Header.scrollHeaderToggler.checked = hide;
    if (hide) {
      $.on(window, 'scroll', Header.hideBarOnScroll);
      return;
    }
    $.off(window, 'scroll', Header.hideBarOnScroll);
    $.rmClass(Header.bar, 'scroll');
    return Header.bar.classList.toggle('autohide', Conf['Header auto-hide']);
  },

  toggleHideBarOnScroll() {
    const hide = this.checked;
    $.cb.checked.call(this);
    return Header.setHideBarOnScroll(hide);
  },

  hideBarOnScroll() {
    const offsetY = window.pageYOffset;
    if (offsetY > (Header.previousOffset || 0)) {
      $.addClass(Header.bar, 'autohide', 'scroll');
    } else {
      $.rmClass(Header.bar,  'autohide', 'scroll');
    }
    return Header.previousOffset = offsetY;
  },

  setBarPosition(bottom) {
    if (Header.barPositionToggler) Header.barPositionToggler.checked = bottom;
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
    return $[args[2]](Header.bar, UIState.noticesRoot);
  },

  toggleBarPosition() {
    $.cb.checked.call(this);
    return Header.setBarPosition(this.checked);
  },

  setFooterVisibility(hide) {
    Header.footerToggler.checked = hide;
    return doc.classList.toggle('hide-bottom-board-list', hide);
  },

  toggleFooterVisibility() {
    $.event('CloseMenu', null);
    const hide = this.nodeName === 'INPUT' ?
      this.checked
    :
      $.hasClass(doc, 'hide-bottom-board-list');
    Header.setFooterVisibility(hide);
    $.set('Bottom Board List', hide);
    const message = hide ?
      'The bottom navigation will now be hidden.'
    :
      'The bottom navigation will remain visible.';
    return new Notice('info', message, 2);
  },

  setCustomNav(show) {
    Header.customNavToggler.checked = show;
    const cust = $('#custom-board-list', Header.bar);
    const full = $('#full-board-list',   Header.bar);
    const btn = $('.hide-board-list-container', full);
    return [cust.hidden, full.hidden, btn.hidden] = show ? [false, true, false] : [true, false, true];
  },

  toggleCustomNav() {
    $.cb.checked.call(this);
    return Header.setCustomNav(this.checked);
  },

  editCustomNav() {
    openSettings('Advanced');
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

