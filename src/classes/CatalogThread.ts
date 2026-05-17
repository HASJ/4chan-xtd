import $ from "../platform/$";
import type Thread from "./Thread";

export default class CatalogThread {
  thread: Thread;
  ID: string | number;
  board: any;
  nodes: {
    root: HTMLElement;
    thumb: HTMLElement | null;
    icons: HTMLElement | null;
    postCount: HTMLElement | null;
    fileCount: HTMLElement | null;
    pageCount: HTMLElement | null;
    replies: HTMLElement | null;
  };

  toString(): string | number {
    return this.ID;
  }

  constructor(root: HTMLElement, thread: Thread) {
    this.thread = thread;
    this.ID = this.thread.ID;
    this.board = this.thread.board;
    const { post } = this.thread.OP.nodes;
    this.nodes = {
      root,
      thumb: $('.catalog-thumb', post),
      icons: $('.catalog-icons', post),
      postCount: $('.post-count', post),
      fileCount: $('.file-count', post),
      pageCount: $('.page-count', post),
      replies: null
    };
    this.thread.catalogView = this;
  }
}
