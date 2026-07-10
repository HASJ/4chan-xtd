import Callbacks from "../classes/Callbacks";
import Fetcher from "../classes/Fetcher";
import Get from "../General/Get";
import { g, Conf, doc } from "../globals/globals";
import ExpandComment from "../Miscellaneous/ExpandComment";
import Unread from "../Monitoring/Unread";
import $ from "../platform/$";

interface QuoteInlineType {
  init(): void;
  node(this: any): void;
  process(link: HTMLAnchorElement, clone: boolean): void;
  qiQuote(link: HTMLAnchorElement, hidden: boolean): HTMLElement;
  toggle(this: HTMLElement, e: MouseEvent): void;
  findBacklinkRoot(quotelink: HTMLElement): Node;
  findQuoteRoot(quotelink: HTMLElement): Node;
  add(quotelink: HTMLElement, boardID: string, threadID: string | number, postID: string | number, context: any, quoter: any): void;
  rm(quotelink: HTMLElement, boardID: string, threadID: string | number, postID: string | number, context: any): void;
}

const QuoteInline: QuoteInlineType = {
  init() {
    if (!(g.VIEW && ['index', 'thread'].includes(g.VIEW)) || !Conf['Quote Inlining']) { return; }

    if (Conf['Comment Expansion']) {
      ExpandComment.callbacks.push(this.node);
    }

    Callbacks.Post.push({
      name: 'Quote Inlining',
      cb:   this.node
    });
  },

  node(this: any) {
    const { process } = QuoteInline;
    const { isClone } = this;
    for (const link of this.nodes.quotelinks.concat([...this.nodes.backlinks], this.nodes.archivelinks)) {
      process(link, isClone);
    }
  },

  process(link: HTMLAnchorElement, clone: boolean) {
    if (Conf['Quote Hash Navigation']) {
      if (!clone) { $.after(link, QuoteInline.qiQuote(link, $.hasClass(link, 'filtered'))); }
    }
    $.on(link, 'click', QuoteInline.toggle);
  },

  qiQuote(link: HTMLAnchorElement, hidden: boolean): HTMLElement {
    let name = "hashlink";
    if (hidden) { name += " filtered"; }
    return $.el('a', {
      className: name,
      textContent: '#',
      href: link.href
    });
  },

  toggle(this: HTMLElement, e: MouseEvent) {
    if ($.modifiedClick(e)) { return; }

    const { boardID, threadID, postID } = Get.postDataFromLink(this);
    if (!boardID) { return; }
    if (Conf['Inline Cross-thread Quotes Only'] && (g.VIEW === 'thread') && g.posts?.get(`${boardID}.${postID}`)?.nodes.root.offsetParent) { return; } // exists and not hidden
    if ($.hasClass(doc, 'catalog-mode')) { return; }

    e.preventDefault();
    const quoter = Get.postFromNode(this);
    const { context } = quoter;
    if ($.hasClass(this, 'inlined')) {
      QuoteInline.rm(this, boardID, threadID, postID, context);
    } else {
      if ($.x(`ancestor::div[@data-full-i-d='${boardID}.${postID}']`, this)) { return; }
      QuoteInline.add(this, boardID, threadID, postID, context, quoter);
    }
    this.classList.toggle('inlined');
  },

  findBacklinkRoot(quotelink: HTMLElement): Node {
    return $.x('ancestor::*[parent::*[contains(@class,"post")]][1]', quotelink);
  },

  findQuoteRoot(quotelink: HTMLElement): Node {
    return $.x('ancestor-or-self::*[parent::blockquote][1]', quotelink);
  },

  add(quotelink: HTMLElement, boardID: string, threadID: string | number, postID: string | number, context: any, quoter: any) {
    let post: any;
    const isBacklink = $.hasClass(quotelink, 'backlink');
    const inline = $.el('div', { className: 'inline' });
    inline.dataset.fullID = `${boardID}.${postID}`;
    const root = (isBacklink ? QuoteInline.findBacklinkRoot(quotelink) : QuoteInline.findQuoteRoot(quotelink)) as HTMLElement;
    $.after(root, inline);

    const qroot = $.x('ancestor::*[contains(@class,"postContainer")][1]', root) as HTMLElement;

    $.addClass(qroot, 'hasInline');
    const _fetcher = new Fetcher(boardID, +threadID, String(postID), inline, quoter);

    post = g.posts?.get(`${boardID}.${postID}`);
    if (!post || context.thread !== post.thread) { return; }

    // Hide forward post if it's a backlink of a post in this thread.
    // Will only unhide if there's no inlined backlinks of it anymore.
    if (isBacklink && Conf['Forward Hiding']) {
      $.addClass(post.nodes.root, 'forwarded');
      post.forwarded++ || (post.forwarded = 1);
    }

    // Decrease the unread count if this post
    // is in the array of unread posts.
    if (!Unread.posts) { return; }
    Unread.readSinglePost(post);
  },

  rm(quotelink: HTMLElement, boardID: string, threadID: string | number, postID: string | number, context: any) {
    let el: HTMLElement | null;
    let inlined: HTMLElement | null;
    const isBacklink = $.hasClass(quotelink, 'backlink');
    // Select the corresponding inlined quote, and remove it.
    let root = (isBacklink ? QuoteInline.findBacklinkRoot(quotelink) : QuoteInline.findQuoteRoot(quotelink)) as HTMLElement;
    root = $.x(`following-sibling::div[@data-full-i-d='${boardID}.${postID}'][1]`, root) as HTMLElement;
    const qroot = $.x('ancestor::*[contains(@class,"postContainer")][1]', root) as HTMLElement;
    const parentNode = root.parentNode!;
    $.rm(root);
    $.event('PostsRemoved', null, parentNode);

    if (!$('.inline', qroot)) {
      $.rmClass(qroot, 'hasInline');
    }

    // Stop if it only contains text.
    el = root.firstElementChild as HTMLElement;
    if (!el) { return; }

    // Dereference clone.
    const post = g.posts?.get(`${boardID}.${postID}`) as any;
    if (!post) { return; }
    post.rmClone(el.dataset.clone);

    // Decrease forward count and unhide.
    if (Conf['Forward Hiding'] &&
      isBacklink &&
      (context.thread === g.threads?.get(`${boardID}.${threadID}`)) &&
      !--post.forwarded) {
        delete post.forwarded;
        $.rmClass(post.nodes.root, 'forwarded');
      }

    // Repeat.
    while ((inlined = $('.inlined', el) as HTMLElement)) {
      ({ boardID, threadID, postID } = Get.postDataFromLink(inlined));
      QuoteInline.rm(inlined, boardID, threadID, postID, context);
      $.rmClass(inlined, 'inlined');
    }
  }
};

export default QuoteInline;
