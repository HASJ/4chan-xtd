import { Conf, g } from "../globals/globals";
import $ from "../platform/$";

interface GetType {
  url(type: string, IDs: any, ...args: any[]): string | undefined;
  threadExcerpt(thread: any): string;
  threadFromRoot(root: HTMLElement | null): any;
  threadFromNode(node: Node): any;
  postFromRoot(root: HTMLElement | null): any;
  postFromNode(root: Node): any;
  postDataFromLink(link: HTMLAnchorElement): { boardID: string, threadID: number, postID: number };
  allQuotelinksLinkingTo(post: any): HTMLAnchorElement[];
}

const Get: GetType = {
  url(type, IDs, ...args) {
    let f, site;
    if ((site = g.sites[IDs.siteID]) && (f = $.getOwn(site.urls, type))) {
      return f(IDs, ...args);
    } else {
      return undefined;
    }
  },

  threadExcerpt(thread) {
    const {OP} = thread;
    const excerpt = (`/${decodeURIComponent(thread.board.ID)}/ - `) + (
      OP.info.subject?.trim() ||
      OP.commentDisplay().replace(/\n+/g, ' // ') ||
      OP.file?.name ||
      `No.${OP}`);
    if (excerpt.length > 73) { return `${excerpt.slice(0, 70)}...`; }
    return excerpt;
  },

  threadFromRoot(root) {
    if (root == null) { return null; }
    const {board} = root.dataset;
    return g.threads!.get(`${board ? encodeURIComponent(board) : g.BOARD!.ID}.${root.id.match(/\d*$/)![0]}`);
  },

  threadFromNode(node) {
    return Get.threadFromRoot($.x(`ancestor-or-self::${g.SITE!.xpath.thread}`, node) as HTMLElement);
  },

  postFromRoot(root) {
    if (root == null) { return null; }
    const post  = g.posts!.get(root.dataset.fullID!);
    if (!post) { return null; }
    const index = root.dataset.clone;
    if (index) { return post.clones[+index]; } else { return post; }
  },

  postFromNode(root) {
    return Get.postFromRoot($.x(`ancestor-or-self::${g.SITE!.xpath.postContainer}[1]`, root) as HTMLElement);
  },

  postDataFromLink(link) {
    let boardID: string, postID: string, threadID: string;
    if (link.dataset.postID) { // resurrected quote
      ({boardID, threadID, postID} = link.dataset as any);
      if (!threadID) { threadID = '0'; }
    } else {
      const match = link.href.match(g.SITE!.regexp.quotelink);
      if (match) {
        [boardID, threadID, postID] = match.slice(1);
        if (!postID) { postID = threadID; }
      } else {
        boardID = '';
        threadID = '0';
        postID = '0';
      }
    }
    return {
      boardID,
      threadID: +threadID,
      postID:   +postID
    };
  },

  allQuotelinksLinkingTo(post) {
    // Get quotelinks & backlinks linking to the given post.
    const quotelinks: HTMLAnchorElement[] = [];
    const posts = g.posts!;
    const {fullID} = post;
    const handleQuotes = function(qPost: any, type: 'quotelinks' | 'backlinks') {
      quotelinks.push(...(qPost.nodes[type] || []));
      for (const clone of qPost.clones) { quotelinks.push(...(clone.nodes[type] || [])); }
    };
    // First:
    //   In every posts,
    //   if it did quote this post,
    //   get all their backlinks.
    posts.forEach(function(qPost: any) {
      if (qPost.quotes.includes(fullID)) {
        handleQuotes(qPost, 'quotelinks');
      }
    });

    // Second:
    //   If we have quote backlinks:
    //   in all posts this post quoted
    //   and their clones,
    //   get all of their backlinks.
    if (Conf['Quote Backlinks']) {
      for (const quote of post.quotes) {
        let qPost;
        if ((qPost = posts.get(quote))) { handleQuotes(qPost, 'backlinks'); }
      }
    }

    // Third:
    //   Filter out irrelevant quotelinks.
    return quotelinks.filter(function(quotelink) {
      const {boardID, postID} = Get.postDataFromLink(quotelink);
      return (boardID === post.board.ID) && (postID === post.ID);
    });
  }
};

export default Get;
