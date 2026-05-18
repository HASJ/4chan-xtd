import Notice from "../classes/Notice";
import { g, Conf } from "../globals/globals";
import $ from "../platform/$";
import { dict, HOUR } from "../platform/helpers";

interface BoardConfigType {
  cbs: (() => void)[];
  boards?: Record<string, any>;
  init(): void;
  load(this: XMLHttpRequest): void;
  set(boards: Record<string, any>): void;
  ready(cb: () => void): void;
  sfwBoards(sfw: boolean): string[];
  isSFW(board: string): boolean;
  domain(board: string): string;
  isArchived(board: string): boolean;
  noAudio(boardID: string): boolean;
  title(boardID: string): string;
}

const BoardConfig: BoardConfigType = {
  cbs: [],
  boards: undefined,

  init() {
    let middle;
    if (g.SITE!.software !== 'yotsuba') { return; }
    const now = Date.now();
    if (now - (2 * HOUR) >= ((middle = Conf['boardConfig'].lastChecked || 0)) || middle > now) {
      $.ajax(`${location.protocol}//a.4cdn.org/boards.json`, {
        onloadend: this.load
      });
    } else {
      const {boards} = Conf['boardConfig'];
      this.set(boards);
    }
  },

  load(this: XMLHttpRequest) {
    let boards: Record<string, any>;
    if ((this.status === 200) && this.response && this.response.boards) {
      boards = dict();
      for (const board of this.response.boards) {
        boards[board.board] = board;
      }
      $.set('boardConfig', {boards, lastChecked: Date.now()});
    } else {
      boards = Conf['boardConfig'].boards;
      const err = (() => { switch (this.status) {
        case 0:   return 'Connection Error';
        case 200: return 'Invalid Data';
        default:          return `Error ${this.statusText} (${this.status})`;
      } })();
      new Notice('warning', `Failed to load board configuration. ${err}`, 20);
    }
    BoardConfig.set(boards);
  },

  set(boards) {
    this.boards = boards;
    for (const ID in g.boards) {
      const board = g.boards[ID];
      board.config = this.boards[ID] || {};
    }
    for (const cb of this.cbs) {
      $.queueTask(cb);
    }
  },

  ready(cb) {
    if (this.boards) {
      cb();
    } else {
      this.cbs.push(cb);
    }
  },

  sfwBoards(sfw) {
    const result = [];
    const object = this.boards || Conf['boardConfig'].boards;
    for (const board in object) {
      const data = object[board];
      if (!!data.ws_board === sfw) {
        result.push(board);
      }
    }
    return result;
  },

  isSFW(board) {
    return !!(this.boards || Conf['boardConfig'].boards)[board]?.ws_board;
  },

  domain(board) {
    return 'boards.4chan.org';
  },

  isArchived(board) {
    // assume archive exists if no data available to prevent cleaning of archived threads
    const data = (this.boards || Conf['boardConfig'].boards)[board];
    return !data || data.is_archived;
  },

  noAudio(boardID) {
    if (g.SITE!.software !== 'yotsuba') { return false; }
    const boards = this.boards || Conf['boardConfig'].boards;
    return boards && boards[boardID] && !boards[boardID].webm_audio;
  },

  title(boardID) {
    return (this.boards || Conf['boardConfig'].boards)?.[boardID]?.title || '';
  }
};

export default BoardConfig;
