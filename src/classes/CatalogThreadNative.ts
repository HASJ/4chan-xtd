import { g } from "../globals/globals";
import $ from "../platform/$";
import Board from "./Board";
import Thread from "./Thread";

// Linear-time equivalent of `/\d*$/.exec(s)?.[0] ?? ''`: scans backwards from
// the end instead of retrying `\d*` at every start position.
function trailingDigits(id: string): string {
  let i = id.length;
  while (i > 0 && id.codePointAt(i - 1)! >= 48 && id.codePointAt(i - 1)! <= 57) { i--; }
  return id.slice(i);
}

export default class CatalogThreadNative {
  nodes: {
    root: HTMLElement;
    thumb: HTMLElement;
  };
  siteID: string;
  boardID: string;
  board: Board;
  ID: number;
  threadID: number;
  thread: Thread;

  toString(): number {
    return this.ID;
  }

  constructor(root: HTMLElement) {
    const thumb = $(g.SITE.selectors.catalog.thumb, root) as HTMLElement;
    this.nodes = {
      root,
      thumb
    };
    this.siteID = g.SITE.ID;
    const parentNode = this.nodes.thumb.parentNode as HTMLAnchorElement;
    this.boardID = parentNode.pathname.split(/\/+/)[1];
    this.board = g.boards[this.boardID] || new Board(this.boardID);
    const id = trailingDigits(root.dataset.id || root.id);
    this.ID = this.threadID = +id;
    this.thread = this.board.threads.get(String(this.ID)) || new Thread(String(this.ID), this.board);
  }
}
