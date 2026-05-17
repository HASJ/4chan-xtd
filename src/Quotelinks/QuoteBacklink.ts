import Callbacks from "../classes/Callbacks";
import { g, Conf, doc } from "../globals/globals";
import $ from "../platform/$";
import { dict } from "../platform/helpers";
import QuoteInline from "./QuoteInline";
import QuotePreview from "./QuotePreview";
import QuoteYou from "./QuoteYou";

interface QuoteBacklinkType {
  bottomBacklinks?: boolean;
  containers: Record<string, HTMLElement>;
  init(): void;
  firstNode(this: any): void;
  secondNode(this: any): void;
  getContainer(id: string | number): HTMLElement;
}

const QuoteBacklink: QuoteBacklinkType = {
  containers: dict(),
  bottomBacklinks: undefined,

  init() {
    if (!['index', 'thread'].includes(g.VIEW) || !Conf['Quote Backlinks']) { return; }

    // Add a class to differentiate when backlinks are at
    // the top (default) or bottom of a post
    if ((this.bottomBacklinks = Conf['Bottom Backlinks'])) {
      $.addClass(doc, 'bottom-backlinks');
    }

    Callbacks.Post.push({
      name: 'Quote Backlinking Part 1',
      cb:   this.firstNode
    });
    Callbacks.Post.push({
      name: 'Quote Backlinking Part 2',
      cb:   this.secondNode
    });
  },

  firstNode(this: any) {
    if (this.isClone || !this.quotes.length || this.isRebuilt) { return; }
    const markYours = Conf['Mark Quotes of You'] && QuoteYou.isYou(this);
    const a = $.el('a', {
      href: g.SITE.Build.postURL(this.board.ID, this.thread.ID, this.ID),
      className: this.isHidden ? 'filtered backlink' : 'backlink',
      textContent: Conf['backlink'].replace(/%(?:id|%)/g, (x: string) => (({ '%id': this.ID, '%%': '%' } as any)[x]))
    });
    if (markYours) { $.add(a, QuoteYou.mark.cloneNode(true)); }
    for (const quote of this.quotes) {
      let post: any;
      const containers = [QuoteBacklink.getContainer(quote)];
      if ((post = g.posts.get(quote)) && post.nodes.backlinkContainer) {
        // Don't add OP clones when OP Backlinks is disabled,
        // as the clones won't have the backlink containers.
        for (const clone of post.clones) {
          containers.push(clone.nodes.backlinkContainer);
        }
      }
      for (const container of containers) {
        const link = a.cloneNode(true) as HTMLAnchorElement;
        const nodes: (Node | string)[] = container.firstChild ? [$.tn(' '), link] : [link];
        if (Conf['Quote Previewing']) {
          $.on(link, 'mouseover', QuotePreview.mouseover);
        }
        if (Conf['Quote Inlining']) {
          $.on(link, 'click', QuoteInline.toggle);
          if (Conf['Quote Hash Navigation']) {
            const hash = QuoteInline.qiQuote(link, $.hasClass(link, 'filtered'));
            nodes.push(hash);
          }
        }
        $.add(container, nodes);
      }
    }
  },

  secondNode(this: any) {
    if (this.isClone && (this.origin.isReply || Conf['OP Backlinks'])) {
      this.nodes.backlinkContainer = $('.container', this.nodes.post);
      return;
    }
    // Don't backlink the OP.
    if (!this.isReply && !Conf['OP Backlinks']) { return; }
    const container = QuoteBacklink.getContainer(this.fullID);
    this.nodes.backlinkContainer = container;
    if (QuoteBacklink.bottomBacklinks) {
      $.add(this.nodes.post, container);
    } else {
      $.add(this.nodes.info, container);
    }
  },

  getContainer(id: string | number): HTMLElement {
    return this.containers[id] ||
      (this.containers[id] = $.el('span', { className: 'container' }));
  }
};

export default QuoteBacklink;
