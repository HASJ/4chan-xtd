import Callbacks from "../classes/Callbacks";
import Filter from "../Filtering/Filter";
import $ from "../platform/$";
import $$ from "../platform/$$";
import meta from '../../package.json';
import { indexEnabledOn } from "../General/IndexAvailability";
import Site from "../site/Site";
import UIState from "../globals/UIState";
import { getBoardLists, registerBoardListUpdater, registerBoardURLResolver } from "../General/HeaderBoardLists";
import { g, Conf } from "../globals/globals";
import UI from "../General/UI";
import Get from "../General/Get";
import { dict } from "../platform/helpers";

const CatalogLinks: any = {
  init() {
    registerBoardURLResolver((kind, board) => CatalogLinks[kind](board));
    if ((g.SITE.software === 'yotsuba') && (Conf['External Catalog'] || Conf['JSON Index']) && !(Conf['JSON Index'] && (g.VIEW === 'index'))) {
      const selector = (() => { switch (g.VIEW) {
        case 'thread': case 'archive': return '.navLinks.desktop > a';
        case 'catalog':           return '.navLinks > :first-child > a';
        case 'index':             return '#ctrl-top > a, .cataloglink > a';
      } })();
      $.ready(function() {
        for (const link of $$(selector)) {
          let catalogURL;
          switch (link.pathname.replace(/\/+/g, '/')) {
            case `/${g.BOARD.ID}/`:
              if (Conf['JSON Index']) { link.textContent = 'Index'; }
              link.href = CatalogLinks.index();
              break;
            case `/${g.BOARD.ID}/catalog`:
              link.href = CatalogLinks.catalog();
              break;
          }
          if ((g.VIEW === 'catalog') && ((catalogURL = CatalogLinks.catalog()) !== g.SITE.urls.catalog?.(g.BOARD))) {
            const catalogLink = link.parentNode.cloneNode(true);
            const link2 = catalogLink.firstElementChild;
            link2.href = catalogURL;
            link2.textContent = link2.hostname === location.hostname ? `${meta.name} Catalog` : 'External Catalog';
            $.after(link.parentNode, [$.tn(' '), catalogLink]);
          }
        }
      });
    }

    if ((g.SITE.software === 'yotsuba') && Conf['JSON Index'] && Conf[`Use ${meta.name} Catalog`]) {
      Callbacks.Post.push({
        name: 'Catalog Link Rewrite',
        cb:   this.node
      });
    }

    this.enabled = Conf['Catalog Links'];
    if (this.enabled) {
      registerBoardListUpdater(CatalogLinks.setLinks);
      let el;
      CatalogLinks.el = (el = UI.checkbox('Header catalog links', 'Catalog Links'));
      el.id = 'toggleCatalog';
      const input = $('input', el);
      $.on(input, 'change', this.toggle);
      $.sync('Header catalog links', CatalogLinks.set);
      return UIState.headerMenu.addEntry({
        el,
        order: 95
      });
    }
  },

  node() {
    for (const a of $$('a', this.nodes.comment)) {
      const m = a.href.match(/^https?:\/\/(boards\.4chan(?:nel)?\.org\/[^/]+)\/catalog(#s=.*)?/);
      if (m) {
        a.href = `//${m[1]}/${m[2] || '#catalog'}`;
      }
    }
  },

  toggle() {
    $.event('CloseMenu');
    $.set('Header catalog links', this.checked);
    return CatalogLinks.set(this.checked);
  },

  set(useCatalog) {
    Conf['Header catalog links'] = useCatalog;
    for (const list of getBoardLists()) { CatalogLinks.setLinks(list); }
    CatalogLinks.el.title = `Turn catalog links ${useCatalog ? 'off' : 'on'}.`;
    const input = $('input', CatalogLinks.el) as HTMLInputElement;
    input.checked = useCatalog;
    return useCatalog;
  },

  parseLinkDataset(a, tail) {
    if (a.dataset.siteID && a.dataset.boardID) { return true; }
    const {siteID, boardID, VIEW} = Site.parseURL(a);
    if (
      !siteID || !boardID ||
      !['index', 'catalog'].includes(VIEW) ||
      (!a.dataset.indexOptions && (a.href.replace(tail, '') !== (Get.url(VIEW, {siteID, boardID}) || '').replace(tail, '')))
    ) { return false; }
    $.extend(a.dataset, {siteID, boardID});
    return true;
  },

  setLinkURL(a, tail) {
    if (!CatalogLinks.parseLinkDataset(a, tail)) { return; }

    const board: any = {siteID: a.dataset.siteID, boardID: a.dataset.boardID};
    const url = Conf['Header catalog links'] ? CatalogLinks.catalog(board) : Get.url('index', board);
    if (!url) { return; }

    a.href = url;
    if (a.dataset.indexOptions && (url.split('#')[0] === Get.url('index', board))) {
      a.href += (a.hash ? '/' : '#') + a.dataset.indexOptions;
    }
  },

  // Also called by Header when board lists are loaded / generated.
  setLinks(list) {
    if (!list) { return; }
    if (!(CatalogLinks.enabled ?? Conf['Catalog Links'])) { return; }

    // do not transform links unless they differ from the expected value at most by this tail
    const tail = /(?:index)?(?:\.\w+)?$/;

    for (const a of $$('a:not([data-only])', list)) {
      CatalogLinks.setLinkURL(a, tail);
    }
  },

  externalParse() {
    CatalogLinks.externalList = dict();
    for (const line of Conf['externalCatalogURLs'].split('\n')) {
      if (line[0] === '#') { continue; }
      const url = line.split(';')[0];
      const boards   = Filter.parseBoards(line.match(/;boards:([^;]+)/)?.[1] || '*');
      const excludes = Filter.parseBoards(line.match(/;exclude:([^;]+)/)?.[1]) || dict();
      for (const board in boards) {
        if (!excludes[board] && !excludes[board.split('/')[0] + '/*']) {
          CatalogLinks.externalList[board] = url;
        }
      }
    }
  },

  external({siteID, boardID}) {
    if (!CatalogLinks.externalList) { CatalogLinks.externalParse(); }
    const external = (CatalogLinks.externalList[`${siteID}/${boardID}`] || CatalogLinks.externalList[`${siteID}/*`]);
    if (external) { return external.replace(/%board/g, boardID); } else { return undefined; }
  },

  jsonIndex(board, hash) {
    if ((g.SITE.ID === board.siteID) && (g.BOARD.ID === board.boardID) && (g.VIEW === 'index')) {
      return hash;
    } else {
      return Get.url('index', board) + hash;
    }
  },

  catalog(board=g.BOARD) {
    if (Conf['External Catalog']) {
      const external = CatalogLinks.external(board);
      if (external) { return external; }
    }
    if (indexEnabledOn(board) && Conf[`Use ${meta.name} Catalog`]) {
      return CatalogLinks.jsonIndex(board, '#catalog');
    }
    const nativeCatalog = Get.url('catalog', board);
    if (nativeCatalog) {
      return nativeCatalog;
    } else {
      return CatalogLinks.external(board);
    }
  },

  index(board=g.BOARD) {
    if (indexEnabledOn(board)) {
      return CatalogLinks.jsonIndex(board, '#index');
    } else {
      return Get.url('index', board);
    }
  }
};
export default CatalogLinks;

