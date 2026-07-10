import { g } from "../globals/globals";
import $ from "../platform/$";
import Board from "./Board";
import Thread from "./Thread";

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
    const id = /\d*$/.exec(root.dataset.id || root.id)?.[0] ?? '';
    this.ID = this.threadID = +id;
    this.thread = this.board.threads.get(String(this.ID)) || new Thread(String(this.ID), this.board);
  }
}
