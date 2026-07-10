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

function tokenizeBoardNav(segment: string): string[] {
  const FLAG = /^-([a-z]+)(?::"[^"]+"(?:,"[^"]+")?)?/;
  const flagNames = new Set(['all', 'title', 'replace', 'full', 'index', 'catalog', 'archive', 'expired', 'nt', 'mode', 'sort', 'text']);
  const WORD = /[\w@]/;
  const tokens: string[] = [];
  let i = 0;
  while (i < segment.length) {
    let j = i + 1;
    if (WORD.test(segment[i])) {
      while (j < segment.length && WORD.test(segment[j])) j++;
      let match = FLAG.exec(segment.slice(j));
      while (match && flagNames.has(match[1])) {
        j += match[0].length;
        match = FLAG.exec(segment.slice(j));
      }
    } else {
      while (j < segment.length && !WORD.test(segment[j])) j++;
    }
    tokens.push(segment.slice(i, j));
    i = j;
  }
  return tokens;
}

function extractTextOverride(t) {
  let text = null, url = null;
  t = t.replace(/-text:"([^"]+)"(?:,"([^"]+)")?/g, function(m0, m1, m2) {
    text = m1;
    url  = m2;
    return '';
  });
  return {t, text, url};
}

function extractIndexOptions(t) {
  const opts: string[] = [];
  t = t.replace(/-(?:mode|sort):"([^"]+)"/g, function(m0, m1) {
    opts.push(m1.toLowerCase().replace(/ /g, '-'));
    return '';
  });
  return {t, indexOptions: opts.join('/')};
}

function buildToggleAllLink(text) {
  const a = $.el('a', {
    className: 'show-board-list-button',
    textContent: text || '+',
    href: 'javascript:;'
  });
  $.on(a, 'click', Header.toggleBoardList);
  return a;
}

function buildExternalLink(t, text, url) {
  const a = $.el('a', {
    href: url || 'javascript:;',
    textContent: text || '+',
    className: 'external'
  });
  if (/-nt/.test(t)) {
    a.target = '_blank';
    a.rel = 'noopener';
  }
  return a;
}

function buildCurrentBoardLink(t, text) {
  const a = $.el('a', {
    href: `/${g.BOARD!.ID}/`,
    textContent: text || decodeURIComponent(g.BOARD!.ID),
    className: 'current'
  });
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
    return a.firstChild; // Its text node.
  }
  return a;
}

function buildBoardAnchor(boardID) {
  if (boardID === '@') {
    return $.el('a', {
      href: 'https://twitter.com/4chan',
      title: '4chan Twitter',
      className: 'navSmall',
      textContent: '@'
    });
  }
  const a = $.el('a', {
    href: `//${BoardConfig.domain(boardID)}/${boardID}/`,
    textContent: boardID,
    title: BoardConfig.title(boardID)
  });
  let urlV;
  if (g.VIEW && ['catalog', 'archive'].includes(g.VIEW) && (urlV = Get.url(g.VIEW, {siteID: '4chan.org', boardID}))) {
    a.href = urlV;
  }
  if ((a.hostname === location.hostname) && (boardID === g.BOARD!.ID)) { a.className = 'current'; }
  return a;
}

function applyLinkText(a, t, boardID, text) {
  if (/-title/.test(t) || (/-replace/.test(t) && (a.hostname === location.hostname) && (boardID === g.BOARD!.ID))) {
    a.textContent = a.title || a.textContent;
  } else if (/-full/.test(t)) {
    const titleSuffix = a.title ? ` - ${a.title}` : '';
    a.textContent = `/${boardID}/` + titleSuffix;
  } else {
    a.textContent = text || boardID;
  }
}

function applyIndexCatalogLink(a, t, boardID) {
  const m = t.match(/-(index|catalog)/);
  if (m && !setBoardLinkURL(a, m[1], {siteID: '4chan.org', boardID})) {
    return a.firstChild; // Its text node.
  }
  return null;
}

function applyIndexOptions(a, indexOptions) {
  if (Conf['JSON Index'] && indexOptions) {
    a.dataset.indexOptions = indexOptions;
    if (['boards.4chan.org', 'boards.4channel.org'].includes(a.hostname) && (a.pathname.split('/')[2] === '')) {
      a.href += (a.hash ? '/' : '#') + indexOptions;
    }
  }
}

function applyArchiveLink(a, t, boardID) {
  if (/-archive/.test(t)) {
    const href = Redirect.to('board', {boardID});
    if (href) {
      a.href = href;
    } else {
      return a.firstChild; // Its text node.
    }
  }
  return null;
}

function applyExpiredLink(a, t, boardID) {
  if (/-expired/.test(t)) {
    if (BoardConfig.isArchived(boardID)) {
      a.href = `//${BoardConfig.domain(boardID)}/${boardID}/archive`;
    } else {
      return a.firstChild; // Its text node.
    }
  }
  return null;
}

function applyNewTabFlag(a, t) {
  if (/-nt/.test(t)) {
    a.target = '_blank';
    a.rel = 'noopener';
  }
}

const Header: any = {
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
      let footer = $.id('boardNavDesktopFoot');
      if ((g.SITE.software === 'yotsuba') && !footer) {
        const absbot = $.id('absbot');
        if (!absbot) { return; }
        footer = $.id('boardNavDesktop').cloneNode(true);
        footer.id = 'boardNavDesktopFoot';
        $('#navtopright',        footer).id = 'navbotright';
        $('#settingsWindowLink', footer).id = 'settingsWindowLinkBot';
        $.before(absbot, footer);
        $.global('stubCloneTopNav');
      }
      Header.bottomBoardList = $(g.SITE.selectors.boardListBottom) as HTMLElement;
      if (Header.bottomBoardList) {
        for (const a of $$('a', Header.bottomBoardList)) {
          if (((a as any).hostname === location.hostname) && ((a as any).pathname.split('/')[1] === g.BOARD!.ID)) { a.className = 'current'; }
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
    for (const a of $$('a', fullBoardList)) {
      if (((a as any).hostname === location.hostname) && ((a as any).pathname.split('/')[1] === g.BOARD!.ID)) { a.className = 'current'; }
    }
    return updateBoardListLinks(fullBoardList);
  },

  generateBoardList(boardnav: string) {
    const list = $('#custom-board-list', Header.boardList);
    $.rmAll(list);
    if (!boardnav) return;
    boardnav = boardnav.replace(/(\r\n|\n|\r)/g, ' ');
    const segments = boardnav.split(/(\{\{(?:"[^"]+")?|\}\})/);
    const spanStack: any[] = [];
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
        const segmentNodes = tokenizeBoardNav(segment).map((t) => Header.mapCustomNavigation(t));
        segmentNodes.forEach(node => currentContainer.appendChild(node));
      }
    });
    return updateBoardListLinks(list);
  },

  mapCustomNavigation(t) {
    if (/^[^\w@]/.test(t)) {
      return $.tn(t);
    }

    let text, url;
    ({t, text, url} = extractTextOverride(t));
    let indexOptions;
    ({t, indexOptions} = extractIndexOptions(t));

    if (t.startsWith('toggle-all')) {
      return buildToggleAllLink(text);
    }

    if (t.startsWith('external')) {
      return buildExternalLink(t, text, url);
    }

    let boardID = t.split('-')[0];
    if (boardID === 'current') {
      if (['boards.4chan.org', 'boards.4channel.org'].includes(location.hostname)) {
        boardID = g.BOARD!.ID;
      } else {
        return buildCurrentBoardLink(t, text);
      }
    }

    const a = buildBoardAnchor(boardID);
    applyLinkText(a, t, boardID, text);

    const indexCatalogReplacement = applyIndexCatalogLink(a, t, boardID);
    if (indexCatalogReplacement) { return indexCatalogReplacement; }

    applyIndexOptions(a, indexOptions);

    const archiveReplacement = applyArchiveLink(a, t, boardID);
    if (archiveReplacement) { return archiveReplacement; }

    const expiredReplacement = applyExpiredLink(a, t, boardID);
    if (expiredReplacement) { return expiredReplacement; }

    applyNewTabFlag(a, t);

    return a;
  },

  toggleBoardList() {
    const {bar}  = Header;
    const custom = $('#custom-board-list', bar);
    const full   = $('#full-board-list',   bar);
    const showBoardList = !full.hidden;
    custom.hidden = !showBoardList;
    full.hidden = showBoardList;
    return full.hidden;
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
    Header.previousOffset = offsetY;
    return Header.previousOffset;
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
    const values = show ? [false, true, false] : [true, false, true];
    [cust.hidden, full.hidden, btn.hidden] = values;
    return values;
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
    const {type, content, lifetime} = e.detail;
    return new Notice(type, content, lifetime);
  },

  enableDesktopNotifications() {
    let notice;
    if (!window.Notification || !Conf['Desktop Notifications']) { return; }
    switch (Notification.permission) {
      case 'granted':
        UIState.areNotificationsEnabled = true;
        return;
      case 'denied':
        // requestPermission doesn't work if status is 'denied',
        // but it'll still work if status is 'default'.
        return;
    }

    const el = $.el('span',
      {innerHTML:
        `${meta.name} needs your permission to show desktop notifications. ` +
        `[<a href="${E(meta.upstreamFaq)}#why-is-4chan-x-asking-for-permission-to-show-desktop-notifications" target="_blank">FAQ</a>]` +
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
    notice = new Notice('info', el);
    return notice;
  }
};
export default Header;
