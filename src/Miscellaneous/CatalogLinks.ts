import Callbacks from "../classes/Callbacks";
import Filter from "../Filtering/Filter";
import $ from "../platform/$";
import $$ from "../platform/$$";
import meta from '../../package.json';
import Index from "../General/Index";
import Site from "../site/Site";
import { g, Conf } from "../globals/globals";
import UI from "../General/UI";
import Get from "../General/Get";
import { dict } from "../platform/helpers";

interface CatalogLinksType {
  enabled?: boolean;
  el?: HTMLElement;
  externalList?: Record<string, string>;
  init(): void;
  node(this: any): void;
  toggle(this: HTMLInputElement): void;
  set(useCatalog: boolean): void;
  setLinks(list: HTMLElement | null): void;
  externalParse(): void;
  external(board: { siteID: string, boardID: string }): string | undefined;
  jsonIndex(board: { siteID: string, boardID: string }, hash: string): string;
  catalog(board?: { siteID: string, boardID: string }): string | undefined;
  index(board?: { siteID: string, boardID: string }): string | undefined;
}

const CatalogLinks: CatalogLinksType = {
  init() {
    if ((g.SITE!.software === 'yotsuba') && (Conf['External Catalog'] || Conf['JSON Index']) && !(Conf['JSON Index'] && (g.VIEW === 'index'))) {
      const selector = (() => { switch (g.VIEW!) {
        case 'thread': case 'archive': return '.navLinks.desktop > a';
        case 'catalog':           return '.navLinks > :first-child > a';
        case 'index':             return '#ctrl-top > a, .cataloglink > a';
        default: return '';
      } })();
      $.ready(function() {
        for (const link of $$(selector, d) as HTMLAnchorElement[]) {
          let catalogURL;
          switch (link.pathname.replace(/\/+/g, '/')) {
            case `/${g.BOARD}/`:
              if (Conf['JSON Index']) { link.textContent = 'Index'; }
              link.href = CatalogLinks.index() || '';
              break;
            case `/${g.BOARD}/catalog`:
              link.href = CatalogLinks.catalog() || '';
              break;
          }
          if ((g.VIEW === 'catalog') && ((catalogURL = CatalogLinks.catalog()) !== g.SITE!.urls.catalog?.(g.BOARD))) {
            const catalogLink = link.parentNode!.cloneNode(true) as HTMLElement;
            const link2 = catalogLink.firstElementChild as HTMLAnchorElement;
            link2.href = catalogURL || '';
            link2.textContent = link2.hostname === location.hostname ? `${meta.name} Catalog` : 'External Catalog';
            $.after(link.parentNode as HTMLElement, [$.tn(' '), catalogLink]);
          }
        }
      });
    }

    if ((g.SITE!.software === 'yotsuba') && Conf['JSON Index'] && Conf[`Use ${meta.name} Catalog`]) {
      Callbacks.Post.push({
        name: 'Catalog Link Rewrite',
        cb:   this.node
      });
    }

    if (this.enabled = Conf['Catalog Links']) {
      const el = UI.checkbox('Header catalog links', 'Catalog Links');
      CatalogLinks.el = el;
      el.id = 'toggleCatalog';
      const input = $('input', el) as HTMLInputElement;
      $.on(input, 'change', this.toggle);
      $.sync('Header catalog links', CatalogLinks.set);
      $.event('HeaderMenuEntry', {
        el,
        order: 95
      });
    }
  },

  node(this: any) {
    for (const a of $$('a', this.nodes.comment) as HTMLAnchorElement[]) {
      let m;
      if (m = a.href.match(/^https?:\/\/(boards\.4chan(?:nel)?\.org\/[^\/]+)\/catalog(#s=.*)?/)) {
        a.href = `//${m[1]}/${m[2] || '#catalog'}`;
      }
    }
  },

  toggle(this: HTMLInputElement) {
    $.event('CloseMenu');
    $.set('Header catalog links', this.checked);
    CatalogLinks.set(this.checked);
  },

  set(useCatalog) {
    Conf['Header catalog links'] = useCatalog;
    CatalogLinks.setLinks($.id('board-list'));
    CatalogLinks.setLinks($(g.SITE.selectors.boardListBottom) as HTMLElement);
    CatalogLinks.el!.title = `Turn catalog links ${useCatalog ? 'off' : 'on'}.`;
    ($('input', CatalogLinks.el!) as HTMLInputElement).checked = useCatalog;
  },

  setLinks(list) {
    if ((!(CatalogLinks.enabled ?? Conf['Catalog Links'])) || !list) { return; }

    // do not transform links unless they differ from the expected value at most by this tail
    const tail = /(?:index)?(?:\.\w+)?$/;

    for (const a of $$('a:not([data-only])', list) as HTMLAnchorElement[]) {
      let {siteID, boardID} = a.dataset;
      if (!siteID || !boardID) {
        let VIEW;
        ({siteID, boardID, VIEW} = Site.parseURL(a) as any);
        if (
          !siteID || !boardID ||
          !['index', 'catalog'].includes(VIEW) ||
          (!a.dataset.indexOptions && (a.href.replace(tail, '') !== (Get.url(VIEW, {siteID, boardID}) || '').replace(tail, '')))
        ) { continue; }
        $.extend(a.dataset, {siteID, boardID});
      }

      const board = {siteID, boardID};
      const url = Conf['Header catalog links'] ? CatalogLinks.catalog(board) : Get.url('index', board);
      if (url) {
        a.href = url;
        if (a.dataset.indexOptions && (url.split('#')[0] === Get.url('index', board))) {
          a.href += (a.hash ? '/' : '#') + a.dataset.indexOptions;
        }
      }
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
    const external = (CatalogLinks.externalList![`${siteID}/${boardID}`] || CatalogLinks.externalList![`${siteID}/*`]);
    if (external) { return external.replace(/%board/g, boardID); } else { return undefined; }
  },

  jsonIndex(board, hash) {
    if ((g.SITE!.ID === board.siteID) && (g.BOARD!.ID === board.boardID) && (g.VIEW === 'index')) {
      return hash;
    } else {
      return Get.url('index', board) + hash;
    }
  },

  catalog(board=g.BOARD!) {
    let external, nativeCatalog;
    if (Conf['External Catalog'] && (external = CatalogLinks.external(board))) {
      return external;
    } else if (Index.enabledOn(board) && Conf[`Use ${meta.name} Catalog`]) {
      return CatalogLinks.jsonIndex(board, '#catalog');
    } else if (nativeCatalog = Get.url('catalog', board)) {
      return nativeCatalog;
    } else {
      return CatalogLinks.external(board);
    }
  },

  index(board=g.BOARD!) {
    if (Index.enabledOn(board)) {
      return CatalogLinks.jsonIndex(board, '#index');
    } else {
      return Get.url('index', board);
    }
  }
};

export default CatalogLinks;
