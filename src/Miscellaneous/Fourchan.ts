import Callbacks from "../classes/Callbacks";
import BoardConfig from "../General/BoardConfig";
import { d, doc, g } from "../globals/globals";
import $ from "../platform/$";
import $$ from "../platform/$$";
import ExpandComment from "./ExpandComment";

interface FourchanType {
  init(): void;
  initBoard(): void;
  initReady(): void;
  code(this: any): void;
  math(this: any): void;
}

const Fourchan: FourchanType = {
  init() {
    if ((g.SITE!.software !== 'yotsuba') || !['index', 'thread', 'archive'].includes(g.VIEW!)) { return; }
    BoardConfig.ready(this.initBoard);
    $.on(d, '4chanXInitFinished', this.initReady);
  },

  initBoard() {
    if (g.BOARD!.config.code_tags) {
      $.on(window, 'prettyprint:cb', function(e: any) {
        let post, pre;
        if (!(post = g.posts!.get(e.detail.ID))) { return; }
        if (!(pre  = ($$('.prettyprint', post.nodes.comment) as HTMLElement[])[+e.detail.i])) { return; }
        if (!$.hasClass(pre, 'prettyprinted')) {
          pre.innerHTML = e.detail.html;
          $.addClass(pre, 'prettyprinted');
        }
      });
      $.global('fourChanPrettyPrintListener');
      Callbacks.Post.push({
        name: 'Parse [code] tags',
        cb:   Fourchan.code
      });
      g.posts!.forEach(function(post) {
        if (post.callbacksExecuted) {
          Callbacks.Post.execute(post, ['Parse [code] tags'], true);
        }
      });
      ExpandComment.callbacks.push(Fourchan.code);
    }

    if (g.BOARD!.config.math_tags) {
      $.global('fourChanMathjaxListener');
      Callbacks.Post.push({
        name: 'Parse [math] tags',
        cb:   Fourchan.math
      });
      g.posts!.forEach(function(post) {
        if (post.callbacksExecuted) {
          Callbacks.Post.execute(post, ['Parse [math] tags'], true);
        }
      });
      ExpandComment.callbacks.push(Fourchan.math);
    }
  },

  // Disable 4chan's ID highlighting (replaced by IDHighlight) and reported post hiding.
  initReady() {
    $.global('disable4chanIdHl');
  },

  code(this: any) {
    if (this.isClone) { return; }
    $.ready(() => {
      const iterable = $$('.prettyprint', this.nodes.comment) as HTMLElement[];
      for (let i = 0; i < iterable.length; i++) {
        const pre = iterable[i];
        if (!$.hasClass(pre, 'prettyprinted')) {
          $.event('prettyprint', {ID: this.fullID, i, html: pre.innerHTML}, window);
        }
      }
    });
  },

  math(this: any) {
    let wbrs;
    if (!/\[(math|eqn)\]/.test(this.nodes.comment.textContent)) { return; }
    // XXX <wbr> tags frequently break MathJax; remove them.
    if ((wbrs = $$('wbr', this.nodes.comment)).length) {
      for (const wbr of wbrs) { $.rm(wbr); }
      this.nodes.comment.normalize();
    }
    const cb = () => {
      if (!doc.contains(this.nodes.comment)) { return; }
      $.off(d, 'PostsInserted', cb);
      $.event('mathjax', null, this.nodes.comment);
    };
    $.on(d, 'PostsInserted', cb);
    cb();
  }
};

export default Fourchan;
