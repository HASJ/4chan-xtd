import Callbacks from "../classes/Callbacks";
import Notice from "../classes/Notice";
import Config from "../config/Config";
import Get from "../General/Get";
import { openFilterSettings } from "../General/SettingsBridge";
import { registerQuickFilterMD5 } from "./QuickFilterActions";
import { g, Conf, doc } from "../globals/globals";
import Menu from "../Menu/Menu";
import Unread from "../Monitoring/Unread";
import $ from "../platform/$";
import $$ from "../platform/$$";
import { dict } from "../platform/helpers";
import QuoteYou from "../Quotelinks/QuoteYou";
import PostHiding from "./PostHiding";
import ThreadHiding from "./ThreadHiding";
import Post from "../classes/Post";
import Recursive from "./Recursive";

interface FilterObj {
  regexp: string | RegExp;
  boards: any;
  excludes: any;
  mask: any;
  hide: boolean;
  stub: any;
  hl?: string;
  top?: boolean;
  noti?: boolean;
  poster?: boolean;
  replies?: boolean;
  reason?: string;
}

export interface FilterResults {
  hide: boolean;
  stub?: boolean;
  hl?: string[] | null;
  top?: boolean;
  noti?: boolean;
  poster?: boolean;
  replies?: boolean;
  reasons?: string[];
};

type FilterType = "postID" | "name" | "uniqueID" | "tripcode" | "capcode" | "pass" | "email" | "subject" | "comment"
  | "flag" | "filename" | "dimensions" | "filesize" | "MD5";

function addBoardsForSite(boards: any, siteID: string, site: any, boardID: string) {
  if (['nsfw', 'sfw'].includes(boardID)) {
    for (const boardID2 of site.sfwBoards?.(boardID === 'sfw') || []) {
      boards[`${siteID}/${boardID2}`] = true;
    }
  } else {
    boards[`${siteID}/${encodeURIComponent(boardID)}`] = true;
  }
}

function processBoardFilter(boards: any, boardID: string, siteFilter: string) {
  for (const siteID in g.sites) {
    if (siteID.startsWith(siteFilter)) {
      addBoardsForSite(boards, siteID, g.sites[siteID], boardID);
    }
  }
}

interface FilterOptions {
  boards: any;
  excludes: any;
  mask: number;
  stub: boolean;
  noti: boolean;
  hl: string | undefined;
  top: boolean;
  hide: boolean;
  reason: string | undefined;
  poster: boolean;
  replies: boolean;
}

function parseFilterOptions(options: string): FilterOptions {
  const boards = Filter.parseBoards(/(?:^|;)\s*boards:([^;]+)/.exec(options)?.[1]);
  const excludes = Filter.parseBoards(/(?:^|;)\s*exclude:([^;]+)/.exec(options)?.[1]);

  const op = /(?:^|;)\s*op:(no|only)/.exec(options)?.[1] || '';
  let mask = $.getOwn({'no': 1, 'only': 2}, op) || 0;

  const file = /(?:^|;)\s*file:(no|only)/.exec(options)?.[1] || '';
  mask = mask | ($.getOwn({'no': 4, 'only': 8}, file) || 0);

  const stub = (() => {
    switch (/(?:^|;)\s*stub:(yes|no)/.exec(options)?.[1]) {
      case 'yes': return true;
      case 'no': return false;
      default: return Conf['Stubs'];
    }
  })();

  const noti = /(?:^|;)\s*notify/.test(options);
  let hl: string | undefined = undefined;
  let top = false;
  let hide = true;

  const highlightRes = /(?:^|;)\s*highlight(?::([\w-]+))?/.exec(options);
  if (highlightRes) {
    hl = highlightRes[1] || 'filter-highlight';
    top = (/(?:^|;)\s*top:(yes|no)/.exec(options)?.[1] || 'yes') === 'yes';
    hide = /(?:^|;)\s*hide(?:[;:]|$)/.test(options);
  }

  const finalHide = hide || !(hl || noti);
  const reason = /(?:^|;)\s*reason:([^;$]+)/.exec(options)?.[1];
  const poster = /(?:^|;)\s*poster(?:[;:]|$)/.test(options);
  const replies = /(?:^|;)\s*replies(?:[;:]|$)/.test(options);

  return { boards, excludes, mask, stub, noti, hl, top, hide: finalHide, reason, poster, replies };
}

function parseFilterLine(key: FilterType | 'general', line: string): FilterObj | null {
  if (line.startsWith('#')) return null;

  const regexpMatch = /\/(.*)\/(\w*)/.exec(line);
  if (!regexpMatch) return null;

  let regexp: RegExp | string;
  if (key === 'uniqueID' || key === 'MD5') {
    regexp = regexpMatch[1];
  } else {
    try {
      regexp = new RegExp(regexpMatch[1], regexpMatch[2]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const _notice = new Notice('warning', [
        $.tn(`Invalid ${key} filter:`),
        $.el('br'),
        $.tn(line),
        $.el('br'),
        $.tn(message)
      ], 60);
      return null;
    }
  }

  const options = line.length > regexpMatch[0].length ? line.replace(regexpMatch[0], '') : '';
  let hl: string | undefined;
  let top = false;
  let hide = true;
  let mask = 0;
  let boards: any = false;
  let excludes: any = false;
  let reason: string | undefined = undefined;
  let poster = false;
  let replies = false;
  let noti = false;
  let stub = Conf.Stubs;

  if (options) {
    const opts = parseFilterOptions(options);
    boards = opts.boards;
    excludes = opts.excludes;
    mask = opts.mask;
    stub = opts.stub;
    noti = opts.noti;
    hl = opts.hl;
    top = opts.top;
    hide = opts.hide;
    reason = opts.reason;
    poster = opts.poster;
    replies = opts.replies;
  }

  return { regexp, boards, excludes, mask, hide, stub, hl, top, noti, reason, poster, replies };
}

interface FilterState {
  hide: boolean;
  stub: boolean;
  hl: string[] | undefined;
  top: boolean;
  noti: boolean;
  poster: boolean;
  replies: boolean;
  reasons: string[] | undefined;
}

interface EvaluationContext {
  mask: number;
  board: string;
  site: string;
  hideable: boolean;
}

function isFilterMatched(filter: FilterObj, value: string, isString: boolean, mask: number, board: string, site: string): boolean {
  if (filter.boards && !(filter.boards[board] || filter.boards[site])) return false;
  if (filter.excludes && (filter.excludes[board] || filter.excludes[site])) return false;
  if (filter.mask & mask) return false;
  if (isString) {
    return filter.regexp === value;
  }
  return (filter.regexp as RegExp).test(value);
}

function evaluateFilter(
  filter: FilterObj,
  type: FilterType,
  value: string,
  isString: boolean,
  context: EvaluationContext,
  state: FilterState
) {
  const { mask, board, site, hideable } = context;
  if (!isFilterMatched(filter, value, isString, mask, board, site)) return;

  if (filter.hide) {
    if (hideable) {
      state.hide = true;
      if (state.stub) {
        state.stub = filter.stub;
        (state.reasons || (state.reasons = [])).push(filter.reason || `Filtered ${type} ${filter.regexp}`);
      }
    }
  }
  if (filter.hl && !state.hl?.includes(filter.hl)) {
    (state.hl || (state.hl = [])).push(filter.hl);
  }
  if (!state.top) { state.top = !!filter.top; }
  if (filter.noti) state.noti = true;
  if (filter.poster) state.poster = true;
  if (filter.replies) state.replies = true;
}

function addPosterFilter(post: Post, hide: boolean, stub: boolean, replies: boolean, hl: string[] | undefined, reason: string) {
  const { uniqueID } = post.info;
  if (!uniqueID) return;
  const newFilter: FilterObj = {
    regexp: uniqueID,
    boards: false,
    excludes: false,
    mask: 0,
    hide,
    stub,
    replies,
    hl: hl?.[0],
    reason,
  };
  const map = Filter.filters.get('uniqueID') as Map<string, FilterObj[]>;
  if (map) {
    map.get(uniqueID)?.push(newFilter) ?? map.set(uniqueID, [newFilter]);
  } else {
    Filter.filters.set('uniqueID', new Map<string, FilterObj[]>().set(uniqueID, [newFilter]));
  }
}

function hideSamePosterReplies(post: Post, stub: boolean, replies: boolean, reason: string) {
  g.posts!.forEach((p) => {
    if (p.info.uniqueID === post.info.uniqueID && p !== post) {
      PostHiding.hide(p, stub, replies, reason);
      if (replies) {
        Recursive.applyAndAdd(PostHiding.hide, p, stub, undefined, `Hidden recursively from ${p.ID}`);
      }
    }
  });
}

function applyPostHiding(post: Post, stub: boolean, replies: boolean, poster: boolean, reason: string) {
  if (post.isReply) {
    PostHiding.hide(post, stub);
    if (replies) {
      Recursive.applyAndAdd(PostHiding.hide, post, stub, undefined, `Hidden recursively from ${post.ID}`);
    }
    if (poster && post.info.uniqueID) {
      hideSamePosterReplies(post, stub, replies, reason);
    }
  } else {
    ThreadHiding.hide(post.thread, stub);
  }
}

function highlightSamePosterReplies(post: Post, hl: string[], replies: boolean, hlFn: (p: Post, ...h: string[]) => void) {
  g.posts!.forEach((p) => {
    if (p.info.uniqueID === post.info.uniqueID && p !== post) {
      $.addClass(p.nodes.root, ...hl);
      if (replies) Recursive.applyAndAdd(hlFn, p, ...hl);
    }
  });
}

function applyPostHighlight(post: Post, hl: string[], replies: boolean, poster: boolean) {
  post.highlights = hl;
  $.addClass(post.nodes.root, ...hl);
  if (post.isReply) {
    const hlFn = (p: Post, ...h: string[]) => { $.addClass(p.nodes.root, ...h); };
    if (replies) Recursive.applyAndAdd(hlFn, post, ...hl);

    if (poster && post.info.uniqueID) {
      highlightSamePosterReplies(post, hl, replies, hlFn);
    }
  }
}

function evaluateTypeFilters(
  type: FilterType,
  post: Post,
  mask: number,
  board: string,
  site: string,
  hideable: boolean,
  state: FilterState
) {
  const filtersOrMap = Filter.filters.get(type);
  if (!filtersOrMap) return;

  const isString = type === 'uniqueID' || type === 'MD5';
  const context: EvaluationContext = { mask, board, site, hideable };

  for (const value of Filter.values(type, post)) {
    const filtersForType = Array.isArray(filtersOrMap) ? filtersOrMap : filtersOrMap.get(value);
    if (!filtersForType) continue;

    for (const filter of filtersForType) {
      evaluateFilter(filter, type, value, isString, context, state);
    }
  }
}

function addFilter(filters: Map<FilterType, FilterObj[] | Map<string, FilterObj[]>>, type: FilterType, filterObj: FilterObj) {
  let list = filters.get(type);
  if (!list || !Array.isArray(list)) {
    list = [];
    filters.set(type, list);
  }
  list.push(filterObj);
}

function loadFilterLine(filters: Map<FilterType, FilterObj[] | Map<string, FilterObj[]>>, type: FilterType | 'general', line: string) {
  const filterObj = parseFilterLine(type, line);
  if (!filterObj) return;

  if (type === 'general') {
    const options = line.replace(/\/(.*)\/(\w*)/, '');
    const types = /(?:^|;)\s*type:([^;]*)/.exec(options)?.[1].split(',')
      || ['subject', 'name', 'filename', 'comment'];
    for (const t of types) {
      addFilter(filters, t as FilterType, filterObj);
    }
  } else {
    addFilter(filters, type, filterObj);
  }
}

function loadFilters(filters: Map<FilterType, FilterObj[] | Map<string, FilterObj[]>>) {
  for (const key in Config.filter) {
    const type = key as FilterType | 'general';
    for (const line of (Conf[type] as string).split('\n')) {
      loadFilterLine(filters, type, line);
    }
  }
}

function convertFiltersToMaps(filters: Map<FilterType, FilterObj[] | Map<string, FilterObj[]>>) {
  // conversion from array to map for string types
  for (const type of ['MD5', 'uniqueID'] as FilterType[]) {
    const filtersForType = filters.get(type);
    if (!filtersForType || !Array.isArray(filtersForType)) continue;

    const map = new Map<string, FilterObj[]>();
    for (const filter of filtersForType) {
      map.get(filter.regexp as string)?.push(filter) ?? map.set(filter.regexp as string, [filter]);
    }

    filters.set(type, map);
  }
}

const Filter = {
  /**
   * Uses a Map for string types, with the value to filter for as the key.
   * This allows faster lookup than iterating over every filter.
   */
  filters: new Map<FilterType, FilterObj[] | Map<string, FilterObj[]>>(),

  init(this: typeof Filter) {
    if (!['index', 'thread', 'catalog'].includes(g.VIEW!) || !Conf['Filter']) return;
    if ((g.VIEW === 'catalog') && !Conf['Filter in Native Catalog']) return;

    if (!Conf['Filtered Backlinks']) {
      $.addClass(doc, 'hide-backlinks');
    }

    loadFilters(this.filters);

    if (!this.filters.size) return;

    convertFiltersToMaps(this.filters);

    if (g.VIEW === 'catalog') {
      return Filter.catalog();
    } else {
      return Callbacks.Post.push({
        name: 'Filter',
        cb:   this.node
      });
    }
  },

  // Parse comma-separated list of boards.
  // Sites can be specified by a beginning part of the site domain followed by a colon.
  parseBoards(boardsRaw: string) {
    if (!boardsRaw) { return false; }
    let boards = Filter.parseBoardsMemo[boardsRaw];
    if (boards) { return boards; }

    boards = dict();
    let siteFilter = '';
    for (let boardID of boardsRaw.split(',')) {
      if (boardID.includes(':')) {
        [siteFilter, boardID] = boardID.split(':').slice(-2);
      }
      processBoardFilter(boards, boardID, siteFilter);
    }
    Filter.parseBoardsMemo[boardsRaw] = boards;
    return boards;
  },

  parseBoardsMemo: dict(),

  test(post: Post, hideable = true): FilterResults {
    if (post.filterResults) return post.filterResults;
    if (QuoteYou.isYou(post)) {
      hideable = false;
    }
    let mask = (post.isReply ? 2 : 1);
    mask = (mask | (post.file ? 4 : 8));
    const board = `${post.siteID}/${post.boardID}`;
    const site = `${post.siteID}/*`;

    const state: FilterState = {
      hide: false,
      stub: true,
      hl: undefined,
      top: false,
      noti: false,
      poster: false,
      replies: false,
      reasons: undefined,
    };

    for (const type of Filter.filters.keys()) {
      evaluateTypeFilters(type, post, mask, board, site, hideable, state);
    }
    post.filterResults = {
      hide: state.hide,
      stub: state.stub,
      hl: state.hl,
      top: state.top,
      noti: state.noti,
      poster: state.poster,
      replies: state.replies,
      reasons: state.reasons
    };
    return post.filterResults;
  },

  node(this: Post) {
    if (
      this.isClone ||
      // Happens when hovering over a dead link in the catalog.
      (!this.isReply && !this.thread.nodes.root)
    ) return;

    const {hide, stub = true, hl, noti, poster = false, replies = false }: FilterResults = Filter.test(
      this,
      (!this.isFetchedQuote && (this.isReply || (g.VIEW === 'index')))
    );

    // Add temporary filter for the poster ID for future posts.
    let reason = '';
    if (poster && this.info.uniqueID) {
      reason = `Hidden because it's the same poster as ${this.ID} (${this.filterResults.reasons})`;
      addPosterFilter(this, hide, stub, replies, hl ?? undefined, reason);
    }

    if (hide) {
      applyPostHiding(this, stub, replies, poster, reason);
    }
    if (hl) {
      applyPostHighlight(this, hl, replies, poster);
    }
    if (noti && Unread.posts && (this.ID > Unread.lastReadPost!) && !QuoteYou.isYou(this)) {
      Unread.openNotification(this, ' triggered a notification filter');
    }
    if (this.file?.thumbLink) {
      $.on(this.file.thumbLink, 'click', (e: MouseEvent) => {
        if (!e.shiftKey || !Conf['MD5 Quick Filter in Threads']) return;
        Filter.quickFilterMD5.call(this);
        e.preventDefault();
        e.stopImmediatePropagation();
      });
    }
  },

  catalog() {
    const url = g.SITE.urls.catalogJSON?.(g.BOARD!);
    if (!url) { return; }
    Filter.catalogData = dict();
    $.ajax(url,
      {onloadend: Filter.catalogParse});
    return Callbacks.CatalogThreadNative.push({
      name: 'Filter',
      cb:   this.catalogNode
    });
  },

  catalogParse(this: XMLHttpRequest) {
    if (![200, 404].includes(this.status)) {
      const statusText = this.status ? `Error ${this.statusText} (${this.status})` : 'Connection Error';
      const _notice = new Notice('warning', `Failed to fetch catalog JSON data. ${statusText}`, 1);
      return;
    }
    for (const page of this.response) {
      for (const item of page.threads) {
        Filter.catalogData[item.no] = item;
      }
    }
    g.BOARD!.threads.forEach(function(thread) {
      if (thread.catalogViewNative) {
        return Filter.catalogNode.call(thread.catalogViewNative);
      }
    });
  },

  catalogNode(this: Post) {
    if ((this.boardID !== g.BOARD!.ID) || !Filter.catalogData[this.ID]) { return; }
    if (QuoteYou.db?.get({siteID: g.SITE.ID, boardID: this.boardID, threadID: this.ID, postID: this.ID})) { return; }
    const {hide, hl, top} = Filter.test(g.SITE.Build.parseJSON(Filter.catalogData[this.ID], this));
    if (hide) {
      this.nodes.root.hidden = true;
    }
    if (hl) {
      this.highlights = hl;
      $.addClass(this.nodes.root, ...hl);
    }
    if (top) {
      $.prepend(this.nodes.root.parentNode, this.nodes.root);
      g.SITE.catalogPin?.(this.nodes.root);
    }
  },

  isHidden(post: Post) {
    return !!Filter.test(post).hide;
  },

  valueF: {
    postID (post) { return [`${post.ID}`]; },
    name(post) { return post.info.name === undefined ? [] : [post.info.name]; },
    uniqueID(post) { return [post.info.uniqueID || '']; },
    tripcode(post) { return post.info.tripcode === undefined ? [] : [post.info.tripcode]; },
    capcode(post) { return post.info.capcode === undefined ? [] : [post.info.capcode]; },
    pass(post) { return post.info.pass === undefined ? [] : [post.info.pass]; },
    email(post) { return post.info.email === undefined ? [] : [post.info.email]; },
    subject(post) { return [post.info.subject || (post.isReply ? undefined : '')]; },
    comment(post) {
      post.info.comment ??= g.sites[post.siteID]?.Build?.parseComment?.((post.info.commentHTML as any).innerHTML);
      return [post.info.comment];
    },
    flag(post) { return post.info.flag === undefined ? [] : [post.info.flag]; },
    filename(post) { return post.files.map(f => f!.name); },
    dimensions(post) { return post.files.map(f => f!.dimensions); },
    filesize(post) { return post.files.map(f => f!.size); },
    MD5(post) { return post.files.map(f => f!.MD5); }
  } satisfies Record<FilterType, (post: Post) => (string | undefined)[]>,

  values(key: FilterType, post: Post): string[] {
    if ($.hasOwn(Filter.valueF, key)) {
      return Filter.valueF[key](post).filter((v): v is string => v != null);
    } else {
      return [key.split('+').map(function(k) {
        const f = $.getOwn(Filter.valueF, k);
        if (f) {
          return f(post).map(v => v || '').join('\n');
        } else {
          return '';
        }
      }).join('\n')];
    }
  },

  addFilter(type: FilterType, re: string, cb?: () => void) {
    if (!$.hasOwn(Config.filter, type)) { return; }
    return $.get(type, Conf[type], function(item) {
      let save = item[type];
      // Add a new line before the regexp unless the text is empty.
      save =
        save ?
          `${save}\n${re}`
        :
          re;
      return $.set(type, save, cb);
    });
  },

  removeFilters(type: FilterType, res: FilterObj[] | Map<string, FilterObj[]> | string[], cb?: () => void) {
    return $.get(type, Conf[type], function (item) {
      const save = item[type];
      const filterArray = Array.isArray(res) ? res : [...res.values()].flat();
      const stringArray = filterArray.map(f => {
        if (typeof f === 'string') return f;
        return typeof f.regexp === 'string' ? f.regexp : f.regexp.source;
      });
      const r = stringArray.map(str => Filter.escape(str)).join('|');
      const updatedSave = save.replace(new RegExp(`(?:$\n|^)(?:${r})$`, 'mg'), '');
      return $.set(type, updatedSave, cb);
    });
  },

  showFilters(type) {
    return openFilterSettings(type);
  },

  quickFilterMD5(this: any) {
    const post: Post = (this && 'ID' in this) ? this as unknown as Post : Get.postFromNode(this);
    const files = post.files.filter(f => f!.MD5);
    if (!files.length) { return; }
    const filter = files.map(f => `/${f!.MD5}/`).join('\n');
    Filter.addFilter('MD5', filter);
    const origin = (post as any).origin || post;
    if (origin.isReply) {
      PostHiding.hide(origin, undefined, undefined, files.map(f => `Filtered MD5 ${f!.MD5}`).join(' & '));
    } else if (g.VIEW === 'index') {
      ThreadHiding.hide(origin.thread);
    }

    if (!Conf['MD5 Quick Filter Notifications']) {
      // feedback for when nothing gets hidden
      if (post.nodes.post.getBoundingClientRect().height) {
        const _notice = new Notice('info', 'MD5 filtered.', 2);
      }
      return;
    }

    let {notice} = Filter.quickFilterMD5;
    if (notice) {
      notice.filters.push(filter);
      notice.posts.push(origin);
      $('span', notice.el).textContent = `${notice.filters.length} MD5s filtered.`;
      notice.resetTimer();
    } else {
      const msg = $.el('div',
        {innerHTML: "<span>MD5 filtered.</span> [<a href=\"javascript:;\">show</a>] [<a href=\"javascript:;\">undo</a>]"});
      notice = (Filter.quickFilterMD5.notice = new Notice('info', msg, 10, () => delete Filter.quickFilterMD5.notice));
      notice.filters = [filter];
      notice.posts = [origin];
      const links = $$('a', msg);
      $.on(links[0], 'click', Filter.quickFilterCB.show.bind(notice));
      $.on(links[1], 'click', Filter.quickFilterCB.undo.bind(notice));
    }
  },

  quickFilterCB: {
    show(this: any) {
      Filter.showFilters('MD5');
      return this.close();
    },
    undo(this: any) {
      Filter.removeFilters('MD5', this.filters);
      for (const post of this.posts) {
        if (post.isReply) {
          PostHiding.show(post);
        } else if (g.VIEW === 'index') {
          ThreadHiding.show(post.thread);
        }
      }
      return this.close();
    }
  },

  escape(value: string) {
    return value.replace(/[/\\^$\n.(){}[\]?*+|]/g, (c) => {
      if (c === '\n') {
        return String.raw`\n`;
      } else {
        return `\\${c}`;
      }
    });
  },

  menu: {
    init() {
      if (!['index', 'thread'].includes(g.VIEW!) || !Conf['Menu'] || !Conf['Filter']) { return; }

      const div = $.el('div',
        {textContent: 'Filter'});

      const entry = {
        el: div,
        order: 50,
        open(post) {
          Filter.menu.post = post;
          return true;
        },
        subEntries: [] as any[]
      };

      for (const type of [
        ['Name',             'name'],
        ['Unique ID',        'uniqueID'],
        ['Tripcode',         'tripcode'],
        ['Capcode',          'capcode'],
        ['Pass Date',        'pass'],
        ['Email',            'email'],
        ['Subject',          'subject'],
        ['Comment',          'comment'],
        ['Flag',             'flag'],
        ['Filename',         'filename'],
        ['Image dimensions', 'dimensions'],
        ['Filesize',         'filesize'],
        ['Image MD5',        'MD5']
      ] satisfies [string, FilterType][]) {
        // Add a sub entry for each filter type.
        entry.subEntries.push(Filter.menu.createSubEntry(type[0], type[1]));
      }

      return Menu.menu.addEntry(entry);
    },

    createSubEntry(text, type) {
      const el = $.el('a', {
        href: 'javascript:;',
        textContent: text
      }
      );
      el.dataset.type = type;
      $.on(el, 'click', Filter.menu.makeFilter);

      return {
        el,
        open(post) {
          return Filter.values(type, post).length;
        }
      };
    },

    makeFilter(this: HTMLElement & { dataset: { type: FilterType } }) {
      const {type} = this.dataset;
      // Convert value -> regexp, unless type is MD5
      const values = Filter.values(type, Filter.menu.post);
      const res = values.map((value) => {
        if (['uniqueID', 'MD5'].includes(type)) {
          return `/${value}/`;
        } else {
          return `/^${Filter.escape(value)}$/`;
        }
      }).join('\n');

      return Filter.addFilter(type, res, () => Filter.showFilters(type));
    }
  }
};
registerQuickFilterMD5(Filter.quickFilterMD5);

export default Filter;
