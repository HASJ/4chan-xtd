import { Conf, d, g } from "../globals/globals";
import $ from "../platform/$";
import { dict, HOUR } from "../platform/helpers";

interface SiteData {
  boards: Record<string, any>;
  lastChecked?: number;
}

type DataBoardData = {
  version?: number;
  [site: string]: any;
};

interface PostInfo {
  /** Defaults to g.SITE.ID */
  siteID?: string,
  boardID: string,
  threadID ?: string | number,
  postID ?: string | number
};

/**
 * This class handles data related to specific threads or posts. This data is automatically cleaned up when the thread
 * ages out.
 * Note: .get and .set aren't fully typed yet.
 */
export default class DataBoard {
  static readonly keys = [
    'hiddenThreads',
    'hiddenPosts',
    'hiddenPosterIds',
    'lastReadPosts',
    'yourPosts',
    'watchedThreads',
    'watcherLastModified',
    'customTitles',
  ] as const;

  declare data: DataBoardData;
  declare changes: any[];
  declare key: (typeof DataBoard.keys)[number];
  declare sync?: () => void;

  constructor(key: (typeof DataBoard.keys)[number], sync?: () => void, dontClean = false) {
    this.changes = [];
    this.onSync = this.onSync.bind(this);
    this.key = key;
    this.initData(Conf[this.key]);
    $.sync(this.key, this.onSync);
    if (!dontClean) this.clean();
    if (!sync) return;
    // Chrome also fires the onChanged callback on the current tab,
    // so we only start syncing when we're ready.
    const init = () => {
      $.off(d, '4chanXInitFinished', init);
      this.sync = sync;
    };
    $.on(d, '4chanXInitFinished', init);
  }

  initData(data: DataBoardData) {
    let boards;
    this.data = data;
    if (this.data.boards) {
      let lastChecked;
      ({boards, lastChecked} = this.data);
      this.data['4chan.org'] = {boards, lastChecked};
      delete this.data.boards;
      delete this.data.lastChecked;
    }
    return this.data[g.SITE.ID] || (this.data[g.SITE.ID] = { boards: dict() });
  }

  save(change: () => void, cb?: () => void) {
    change();
    this.changes.push(change);
    return $.get(this.key, { boards: dict() }, (items: DataBoardData) => {
      if (!this.changes.length) { return; }
      const needSync = ((items[this.key].version || 0) > (this.data.version || 0));
      if (needSync) {
        this.initData(items[this.key]);
        for (change of this.changes) { change(); }
      }
      this.changes = [];
      this.data.version = (this.data.version || 0) + 1;
      return $.set(this.key, this.data, () => {
        if (needSync) { this.sync?.(); }
        return cb?.();
      });
    });
  }

  forceSync(cb) {
    return $.get(this.key, { boards: dict() }, (items: DataBoardData) => {
      if ((items[this.key].version || 0) > (this.data.version || 0)) {
        this.initData(items[this.key]);
        for (const change of this.changes) { change(); }
        this.sync?.();
      }
      return cb?.();
    });
  }

  delete({siteID, boardID, threadID, postID}: any, cb?: any) {
    if (!siteID) { siteID = g.SITE.ID; }
    if (!this.data[siteID]) { return; }
    this.save(() => {
      if (postID) {
        if (!this.data[siteID].boards[boardID]?.[threadID]) { return; }
        delete this.data[siteID].boards[boardID][threadID][postID];
        this.deleteIfEmpty({siteID, boardID, threadID});
      } else if (threadID) {
        if (!this.data[siteID].boards[boardID]) { return; }
        delete this.data[siteID].boards[boardID][threadID];
        this.deleteIfEmpty({siteID, boardID});
      } else {
        delete this.data[siteID].boards[boardID];
      }
    }
    , cb);
  }

  deleteIfEmpty({ siteID, boardID, threadID }: { siteID: string, boardID: string, threadID?: string | number }) {
    if (!this.data[siteID]) { return; }
    if (threadID) {
      if (!Object.keys(this.data[siteID].boards[boardID][threadID]).length) {
        delete this.data[siteID].boards[boardID][threadID];
        this.deleteIfEmpty({siteID, boardID});
      }
    } else if (!Object.keys(this.data[siteID].boards[boardID]).length) {
      delete this.data[siteID].boards[boardID];
    }
  }

  set(data: Parameters<DataBoard['setUnsafe']>[0], cb?: () => void) {
    this.save(() => {
      this.setUnsafe(data);
    }, cb);
  }

  setUnsafe({ siteID, boardID, threadID, postID, val }: PostInfo & { val?: any }) {
    if (!siteID) { siteID = g.SITE.ID; }
    if (!this.data[siteID!]) this.data[siteID!] = { boards: dict() };
    const boards = this.data[siteID!].boards;
    if (postID !== undefined) {
      const base = boards[boardID] || (boards[boardID] = dict());
      (base[threadID!] || (base[threadID!] = dict()))[postID] = val;
    } else if (threadID !== undefined) {
      (boards[boardID] || (boards[boardID] = dict()))[threadID] = val;
    } else {
      boards[boardID] = val;
    }
  }

  extend(
    { siteID, boardID, threadID, postID, val }: PostInfo & { val?: any },
    cb?: () => void,
  ) {
    this.save(() => {
      const oldVal = this.get({ siteID, boardID, threadID, postID, defaultValue: dict() });
      for (const key in val) {
        const subVal = val[key];
        if (subVal === undefined) {
          delete oldVal[key];
        } else {
          oldVal[key] = subVal;
        }
      }
      this.setUnsafe({siteID, boardID, threadID, postID, val: oldVal});
    }, cb);
  }

  setLastChecked(key='lastChecked') {
    this.save(() => {
      this.data[key] = Date.now();
    });
  }

  get({ siteID, boardID, threadID, postID, defaultValue }: PostInfo & { defaultValue?: any }) {
    if (!siteID) { siteID = g.SITE.ID; }
    const board = this.data[siteID!]?.boards[boardID];
    const val = board ? this.getFromBoard(board, threadID, postID) : undefined;
    return val || defaultValue;
  }

  getFromBoard(board: any, threadID: PostInfo['threadID'], postID: PostInfo['postID']) {
    if (threadID == null) {
      if (postID == null) { return board; }
      for (let thread: any = 0; thread < board.length; thread++) {
        if (postID in thread) { return thread[postID]; }
      }
      return undefined;
    }
    const thread = board[threadID];
    if (!thread) { return undefined; }
    return postID != null ? thread[postID] : thread;
  }

  clean() {
    let boardID, middle;
    const siteID = g.SITE.ID;
    for (boardID in this.data[siteID].boards) {
      this.deleteIfEmpty({siteID, boardID});
    }
    const now = Date.now();
    if (now - (2 * HOUR) >= ((middle = this.data[siteID].lastChecked || 0)) || middle > now) {
      this.data[siteID].lastChecked = now;
      for (boardID in this.data[siteID].boards) {
        this.ajaxClean(boardID);
      }
    }
  }

  ajaxClean(boardID) {
    const siteID = g.SITE.ID;
    const threadsList = g.SITE.urls.threadsListJSON?.({siteID, boardID});
    if (!threadsList) { return; }
    const ajaxCleanParse = this.ajaxCleanParse.bind(this);
    ($ as any).cache(threadsList, function(this: XMLHttpRequest) {
      if (this.status !== 200) { return; }
      const archiveList = g.SITE.urls.archiveListJSON?.({siteID, boardID});
      if (!archiveList) return ajaxCleanParse(boardID, this.response);
      const response1 = this.response;
      ($ as any).cache(archiveList, function(this: XMLHttpRequest) {
        if ((this.status !== 200) && (!!g.SITE.archivedBoardsKnown || (this.status !== 404))) { return; }
        ajaxCleanParse(boardID, response1, this.response);
      });
    });
  }

  ajaxCleanParse(boardID: string, response1: any, response2?: any) {
    const siteID = g.SITE.ID;
    const board = this.data[siteID].boards[boardID];
    if (!board) { return; }
    const threads = this.filterLiveThreads(board, response1, response2);
    this.data[siteID].boards[boardID] = threads;
    this.deleteIfEmpty({siteID, boardID});
    $.set(this.key, this.data);
  }

  filterLiveThreads(board: any, response1: any, response2?: any) {
    const threads = dict();
    if (response1) { this.collectLiveThreadsFromPages(threads, board, response1); }
    if (response2) { this.collectLiveThreadsFromIDs(threads, board, response2); }
    return threads;
  }

  collectLiveThreadsFromPages(threads: any, board: any, response1: any) {
    for (const page of response1) {
      for (const thread of page.threads) {
        const id = thread.no;
        if (id in board) { threads[id] = board[id]; }
      }
    }
  }

  collectLiveThreadsFromIDs(threads: any, board: any, response2: any) {
    for (const id of response2) {
      if (id in board) { threads[id] = board[id]; }
    }
  }

  onSync(data) {
    if ((data.version || 0) <= (this.data.version || 0)) { return; }
    this.initData(data);
    this.sync?.();
  }
}
