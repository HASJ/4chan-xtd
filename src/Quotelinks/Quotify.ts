import Redirect from "../Archive/Redirect";
import Callbacks from "../classes/Callbacks";
import Post from "../classes/Post";
import { g, Conf, doc } from "../globals/globals";
import ExpandComment from "../Miscellaneous/ExpandComment";
import $ from "../platform/$";
import $$ from "../platform/$$";

interface QuotifyType {
  init(): void;
  node(this: any): void;
  parseArchivelink(this: any, link: HTMLAnchorElement): void;
  parseDeadlink(this: any, deadlink: HTMLElement): void;
  fixDeadlink(deadlink: HTMLElement): void;
}

const Quotify: QuotifyType = {
  init() {
    if (!['index', 'thread'].includes(g.VIEW) || !Conf['Resurrect Quotes']) { return; }

    $.addClass(doc, 'resurrect-quotes');

    if (Conf['Comment Expansion']) {
      ExpandComment.callbacks.push(this.node);
    }

    Callbacks.Post.push({
      name: 'Resurrect Quotes',
      cb:   this.node
    });
  },

  node(this: any) {
    if (this.isClone) {
      this.nodes.archivelinks = $$('a.linkify.quotelink', this.nodes.comment);
      return;
    }
    for (const link of $$('a.linkify', this.nodes.comment) as HTMLAnchorElement[]) {
      Quotify.parseArchivelink.call(this, link);
    }
    for (const deadlink of $$('.deadlink', this.nodes.comment) as HTMLElement[]) {
      Quotify.parseDeadlink.call(this, deadlink);
    }
  },

  parseArchivelink(this: any, link: HTMLAnchorElement) {
    let m: RegExpMatchArray | null;
    if (!(m = link.pathname.match(/^\/([^/]+)\/thread\/S?(\d+)\/?$/))) { return; }
    if (['boards.4chan.org', 'boards.4channel.org'].includes(link.hostname)) { return; }
    const boardID = m[1];
    const threadID = m[2];
    const postID = (link.hash.match(/^#[pq]?(\d+)$|$/) || [])[1] || threadID;
    if (Redirect.to('post', { boardID, postID })) {
      $.addClass(link, 'quotelink');
      $.extend(link.dataset, { boardID, threadID, postID });
      this.nodes.archivelinks.push(link);
    }
  },

  parseDeadlink(this: any, deadlink: HTMLElement) {
    let a: HTMLAnchorElement | undefined, m: RegExpMatchArray | null, post: any, postID: string | undefined;
    if ($.hasClass(deadlink.parentNode as HTMLElement, 'prettyprint')) {
      // Don't quotify deadlinks inside code tags, un-span them.
      Quotify.fixDeadlink(deadlink);
      return;
    }

    const quote = deadlink.textContent || '';
    if (!(postID = (quote.match(/\d+$/) || [])[0])) { return; }
    if (postID[0] === '0') {
      // Fix quotelinks that start with a 0.
      Quotify.fixDeadlink(deadlink);
      return;
    }
    const boardID = (m = quote.match(/^>>>\/([a-z\d]+)/)) ? m[1] : this.board.ID;
    const quoteID = `${boardID}.${postID}`;

    if ((post = g.posts.get(quoteID))) {
      if (!post.isDead) {
        // Don't (Dead) when quotifying in an archived post, and we know the post still exists.
        a = $.el('a', {
          href:        g.SITE.Build.postURL(boardID, post.thread.ID, postID),
          className:   'quotelink',
          textContent: quote
        }) as HTMLAnchorElement;
      } else {
        // Replace the .deadlink span if we can redirect.
        a = $.el('a', {
          href:        g.SITE.Build.postURL(boardID, post.thread.ID, postID),
          className:   'quotelink deadlink',
          textContent: quote
        }) as HTMLAnchorElement;
        $.add(a, Post.deadMark.cloneNode(true));
        $.extend(a.dataset, { boardID, threadID: post.thread.ID, postID });
      }
    } else {
      const redirect = Redirect.to('thread', { boardID, threadID: 0, postID });
      const fetchable = Redirect.to('post', { boardID, postID });
      if (redirect || fetchable) {
        // Replace the .deadlink span if we can redirect or fetch the post.
        a = $.el('a', {
          href:        redirect || 'javascript:;',
          className:   'deadlink',
          textContent: quote
        }) as HTMLAnchorElement;
        $.add(a, Post.deadMark.cloneNode(true));
        if (fetchable) {
          // Make it function as a normal quote if we can fetch the post.
          $.addClass(a, 'quotelink');
          $.extend(a.dataset, { boardID, postID });
        }
      }
    }

    if (!this.quotes.includes(quoteID)) { this.quotes.push(quoteID); }

    if (!a) {
      $.add(deadlink, Post.deadMark.cloneNode(true));
      return;
    }

    $.replace(deadlink, a);
    if ($.hasClass(a, 'quotelink')) {
      this.nodes.quotelinks.push(a);
    }
  },

  fixDeadlink(deadlink: HTMLElement) {
    let el: Node | null;
    if (!(el = deadlink.previousSibling) || (el.nodeName === 'BR')) {
      const green = $.el('span', { className: 'quote' });
      $.before(deadlink, green);
      $.add(green, deadlink);
    }
    $.replace(deadlink, [...deadlink.childNodes]);
  }
};

export default Quotify;
