import Callbacks from "../classes/Callbacks";
import Get from "../General/Get";
import { g, Conf } from "../globals/globals";
import $ from "../platform/$";
import $$ from "../platform/$$";

const ExpandComment: any = {
  init() {
    if ((g.VIEW !== 'index') || !Conf['Comment Expansion'] || Conf['JSON Index']) { return; }

    return Callbacks.Post.push({
      name: 'Comment Expansion',
      cb:   this.node
    });
  },

  node() {
    const a = $('.abbr > a:not([onclick])', this.nodes.comment);
    if (a) {
      return $.on(a, 'click', ExpandComment.cb);
    }
  },

  callbacks: [],

  cb(e) {
    e.preventDefault();
    return ExpandComment.expand(Get.postFromNode(this));
  },

  expand(post) {
    if (post.nodes.longComment && !post.nodes.longComment.parentNode) {
      $.replace(post.nodes.shortComment, post.nodes.longComment);
      post.nodes.comment = post.nodes.longComment;
      return;
    }
    const a = $('.abbr > a', post.nodes.comment);
    if (!a) { return; }
    a.textContent = `Post No.${post} Loading...`;
    return $.cache(g.SITE.urls.threadJSON({boardID: post.boardID, threadID: post.threadID}), function() { return ExpandComment.parse(this, a, post); });
  },

  contract(post) {
    if (!post.nodes.shortComment) { return; }
    const a = $('.abbr > a', post.nodes.shortComment);
    a.textContent = 'here';
    $.replace(post.nodes.longComment, post.nodes.shortComment);
    post.nodes.comment = post.nodes.shortComment;
    return post.nodes.comment;
  },

  parse(req, a, post) {
    let postObj;
    const {status} = req;
    if (![200, 304].includes(status)) {
      a.textContent = status ? `Error ${req.statusText} (${status})` : 'Connection Error';
      return;
    }

    const {
      posts
    } = req.response;
    const spoilerRange = posts[0].custom_spoiler;
    if (spoilerRange) {
      g.SITE.Build.spoilerRange[g.BOARD.ID] = spoilerRange;
    }

    for (postObj of posts) {
      if (postObj.no === post.ID) { break; }
    }
    if (postObj.no !== post.ID) {
      a.textContent = `Post No.${post} not found.`;
      return;
    }

    const {comment} = post.nodes;
    const clone = comment.cloneNode(false);
    clone.innerHTML = postObj.com;
    // Fix pathnames
    for (const quote of $$('.quotelink', clone)) {
      const href = quote.getAttribute('href');
      if (href[0] === '/') { continue; } // Cross-board quote, or board link
      if (href[0] === '#') {
        quote.href = `${a.pathname.split(/\/+/).splice(0,4).join('/')}${href}`;
      } else {
        quote.href = `${a.pathname.split(/\/+/).splice(0,3).join('/')}/${href}`;
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
export default ExpandComment;;

