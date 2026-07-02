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
    this.ID = this.threadID = +(root.dataset.id || root.id).match(/\d*$/)![0];
    this.thread = this.board.threads.get(String(this.ID)) || new Thread(String(this.ID), this.board);
  }
}
