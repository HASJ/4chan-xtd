import Callbacks from "../classes/Callbacks";
import Fetcher from "../classes/Fetcher";
import Get from "../General/Get";
import Header from "../General/Header";
import UI from "../General/UI";
import { Conf, d, doc, g } from "../globals/globals";
import ExpandComment from "../Miscellaneous/ExpandComment";
import $ from "../platform/$";
import { registerQuotePreviewMouseover } from "./QuotePreviewActions";

interface QuotePreviewType {
  init(): void;
  node(this: any): void;
  mouseover(this: HTMLElement, e: MouseEvent): void;
  mouseout(this: { el: HTMLElement }): void;
}

const QuotePreview: QuotePreviewType = {
  init() {
    if (!Conf['Quote Previewing']) { return; }

    if (g.VIEW === 'archive') {
      $.on(d, 'mouseover', function(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if ((target.nodeName === 'A') && $.hasClass(target, 'quotelink')) {
          QuotePreview.mouseover.call(target, e);
        }
      });
    }

    if (!['index', 'thread'].includes(g.VIEW)) { return; }

    if (Conf['Comment Expansion']) {
      ExpandComment.callbacks.push(this.node);
    }

    Callbacks.Post.push({
      name: 'Quote Previewing',
      cb:   this.node
    });
  },

  node(this: any) {
    for (const link of this.nodes.quotelinks.concat([...this.nodes.backlinks], this.nodes.archivelinks)) {
      $.on(link, 'mouseover', QuotePreview.mouseover);
    }
  },

  mouseover(this: HTMLElement, e: MouseEvent) {
    let origin: any;
    if (($.hasClass(this, 'inlined') && !$.hasClass(doc, 'catalog-mode')) || !d.contains(this)) { return; }

    const { boardID, threadID, postID } = Get.postDataFromLink(this);

    const qp = $.el('div', {
      id: 'qp',
      className: 'dialog'
    });

    $.add(Header.hover, qp);
    new Fetcher(boardID, +threadID, String(postID), qp, Get.postFromNode(this));

    UI.hover({
      root: this,
      el: qp,
      latestEvent: e,
      endEvents: 'mouseout click',
      cb: QuotePreview.mouseout
    } as any);

    if (Conf['Quote Highlighting'] && (origin = g.posts.get(`${boardID}.${postID}`))) {
      const posts = [origin].concat(origin.clones);
      // Remove the clone that's in the qp from the array.
      posts.pop();
      for (const post of posts) {
        $.addClass(post.nodes.post, 'qphl');
      }
    }
  },

  mouseout(this: { el: HTMLElement }) {
    // Stop if it only contains text.
    let root: HTMLElement | null;
    if (!(root = this.el.firstElementChild as HTMLElement)) { return; }

    $.event('PostsRemoved', null, Header.hover);

    const clone = Get.postFromRoot(root);
    let post = clone.origin;
    post.rmClone(root.dataset.clone);

    if (!Conf['Quote Highlighting']) { return; }
    for (post of [post].concat(post.clones)) {
      $.rmClass(post.nodes.post, 'qphl');
    }
  }
};

registerQuotePreviewMouseover(QuotePreview.mouseover);

export default QuotePreview;
