import Callbacks from "../classes/Callbacks";
import Get from "../General/Get";
import { g, Conf } from "../globals/globals";
import $ from "../platform/$";
import $$ from "../platform/$$";

interface ExpandCommentType {
  callbacks: ((this: any) => void)[];
  init(): void;
  node(this: any): void;
  cb(this: HTMLElement, e: MouseEvent): void;
  expand(post: any): void;
  contract(post: any): void;
  parse(req: XMLHttpRequest, a: HTMLAnchorElement, post: any): void;
}

const ExpandComment: ExpandCommentType = {
  callbacks: [],

  init() {
    if ((g.VIEW !== 'index') || !Conf['Comment Expansion'] || Conf['JSON Index']) { return; }

    Callbacks.Post.push({
      name: 'Comment Expansion',
      cb:   this.node
    });
  },

  node(this: any) {
    let a;
    if (a = $('.abbr > a:not([onclick])', this.nodes.comment) as HTMLAnchorElement) {
      $.on(a, 'click', ExpandComment.cb);
    }
  },

  cb(this: HTMLElement, e: MouseEvent) {
    e.preventDefault();
    ExpandComment.expand(Get.postFromNode(this));
  },

  expand(post) {
    let a: HTMLAnchorElement | null;
    if (post.nodes.longComment && !post.nodes.longComment.parentNode) {
      $.replace(post.nodes.shortComment, post.nodes.longComment);
      post.nodes.comment = post.nodes.longComment;
      return;
    }
    if (!(a = $('.abbr > a', post.nodes.comment) as HTMLAnchorElement)) { return; }
    a.textContent = `Post No.${post} Loading...`;
    $.cache(g.SITE!.urls.threadJSON({boardID: post.boardID, threadID: post.threadID}), function(this: XMLHttpRequest) {
      ExpandComment.parse(this, a!, post);
    });
  },

  contract(post) {
    if (!post.nodes.shortComment) { return; }
    const a = $('.abbr > a', post.nodes.shortComment) as HTMLAnchorElement;
    a.textContent = 'here';
    $.replace(post.nodes.longComment, post.nodes.shortComment);
    post.nodes.comment = post.nodes.shortComment;
  },

  parse(req, a, post) {
    let postObj: any, spoilerRange;
    const {status} = req;
    if (![200, 304].includes(status)) {
      a.textContent = status ? `Error ${req.statusText} (${status})` : 'Connection Error';
      return;
    }

    const {posts} = req.response;
    if (spoilerRange = posts[0].custom_spoiler) {
      g.SITE!.Build.spoilerRange[g.BOARD!.ID] = spoilerRange;
    }

    for (postObj of posts) {
      if (postObj.no === post.ID) { break; }
    }
    if (postObj.no !== post.ID) {
      a.textContent = `Post No.${post} not found.`;
      return;
    }

    const {comment} = post.nodes;
    const clone = comment.cloneNode(false) as HTMLElement;
    clone.innerHTML = postObj.com;
    // Fix pathnames
    for (const quote of $$('.quotelink', clone) as HTMLAnchorElement[]) {
      const href = quote.getAttribute('href') || '';
      if (href[0] === '/') { continue; } // Cross-board quote, or board link
      if (href[0] === '#') {
        quote.href = `${a.pathname.split(/\/+/).slice(0,4).join('/')}${href}`;
      } else {
        quote.href = `${a.pathname.split(/\/+/).slice(0,3).join('/')}/${href}`;
      }
    }
    post.nodes.shortComment = comment;
    $.replace(comment, clone);
    post.nodes.comment = (post.nodes.longComment = clone);
    post.parseComment();
    post.parseQuotes();

    for (const callback of ExpandComment.callbacks) {
      callback.call(post);
    }
  }
};

export default ExpandComment;
