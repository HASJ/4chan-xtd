import Notice from "../classes/Notice";
import Post from "../classes/Post";
import Config from "../config/Config";
import Filter from "../Filtering/Filter";
import normalizePost from "./PostNormalizer";
import keyCode from "../Miscellaneous/KeyCode";
import Unread from "../Monitoring/Unread";
import $$ from "../platform/$$";
import $ from "../platform/$";
import UIState from "../globals/UIState";
import { g, Conf, c, d } from "../globals/globals";
import Menu from "../Menu/Menu";

// Linear-time equivalent of `id.match(/\d*$/)[0]`: scans backwards from the
// end instead of retrying `\d*` at every start position (avoids O(n^2) backtracking).
function trailingDigits(id: string): string {
  let i = id.length;
  while (i > 0 && id.codePointAt(i - 1)! >= 48 && id.codePointAt(i - 1)! <= 57) { i--; }
  return id.slice(i);
}

const Test: any = {
  init() {
    if ((g.SITE.software !== 'yotsuba') || !(g.VIEW && ['index', 'thread'].includes(g.VIEW))) { return; }

    if (Conf['Menu']) {
      const a = $.el('a',
        {textContent: 'Test HTML building'});
      $.on(a, 'click', this.cb.testOne);
      Menu.menu.addEntry({
        el: a,
        open(post) {
          a.dataset.fullID = post.fullID;
          return true;
        }
      });
    }

    const a2 = $.el('a',
      {textContent: 'Test HTML building'});
    $.on(a2, 'click', this.cb.testAll);
    UIState.headerMenu.addEntry({
      el: a2});

    if (Unread.posts) {
      const testOrderLink = $.el('a',
        {textContent: 'Test Post Order'});
      $.on(testOrderLink, 'click', this.cb.testOrder);
      UIState.headerMenu.addEntry({
        el: testOrderLink});
    }

    return $.on(d, 'keydown', this.cb.keydown);
  },

  assert(condition) {
    if (!condition()) {
      return new Notice('warning', `Assertion failed: ${condition}`, 30);
    }
  },

  normalize: normalizePost,

  firstDiff(x, y) {
    let x2 = x.cloneNode(false);
    let y2 = y.cloneNode(false);
    if (!x2.isEqualNode(y2)) { return [x2, y2]; }
    let i = 0;
    while (true) {
      x2 = x.childNodes[i];
      y2 = y.childNodes[i];
      if (!x2 || !y2) { return [x2, y2]; }
      if (!x2.isEqualNode(y2)) { return Test.firstDiff(x2, y2); }
      i++;
    }
  },

  domMismatch(post, post2) {
    const x = post.normalizedOriginal;
    const y = post2.normalizedOriginal;
    if (x.isEqualNode(y)) { return false; }
    c.log(`${post.fullID} differs`);
    const [x2, y2] = Test.firstDiff(x, y);
    c.log(x2);
    c.log(y2);
    c.log(x.outerHTML);
    c.log(y.outerHTML);
    return true;
  },

  filterMismatch(post, obj, post2) {
    let fail = false;
    for (const key in Config.filter) {
      if ((key === 'General') || ((key === 'MD5') && (post.board.ID === 'f'))) { continue; }
      const val1 = Filter.values(key, obj);
      const val2 = Filter.values(key, post2);
      if ((val1.length === val2.length) && val1.every((x, i) => x === val2[i])) { continue; }
      fail = true;
      c.log(`${post.fullID} has filter bug in ${key}`);
      c.log(val1);
      c.log(val2);
    }
    return fail;
  },

  testOne(post) {
    Test.postsRemaining++;
    return $.cache(g.SITE.urls.threadJSON({boardID: post.boardID, threadID: post.threadID}), function(this: any) {
      if (!this.response) { return; }
      const {posts} = this.response;
      g.SITE.Build.spoilerRange[post.board.ID] = posts[0].custom_spoiler;
      for (const postData of posts) {
        if (postData.no !== post.ID) { continue; }
        const t1 = Date.now();
        const obj = g.SITE.Build.parseJSON(postData, post.board);
        const root = g.SITE.Build.post(obj);
        Test.time += Date.now() - t1;
        const post2 = new Post(root, post.thread, post.board, {forBuildTest: true});

        const domFail = Test.domMismatch(post, post2);
        const filterFail = Test.filterMismatch(post, obj, post2);

        if (domFail || filterFail) {
          Test.postsFailed++;
        } else {
          c.log(`${post.fullID} correct`);
        }
        Test.postsRemaining--;
        if (Test.postsRemaining === 0) { Test.report(); }
      }
    });
  },

  testAll() {
    g.posts!.forEach(function(post) {
      if (!post.isClone && !post.isFetchedQuote) {
        const abbr = $('.abbr', post.nodes.comment);
        if (!(abbr && /Comment too long\./.test(abbr.textContent))) {
          return Test.testOne(post);
        }
      }
    });
  },

  postsRemaining: 0,
  postsFailed: 0,
  time: 0,

  report() {
    if (Test.postsFailed) {
      const _notice = new Notice('warning', `${Test.postsFailed} post(s) differ (${Test.time} ms)`, 30);
    } else {
      const _notice = new Notice('success', `All correct (${Test.time} ms)`, 5);
    }
    Test.postsFailed = 0;
    Test.time = 0;
  },

  cb: {
    testOne(this: any) {
      Test.testOne(g.posts!.get(this.dataset.fullID));
      return Menu.menu.close();
    },

    testAll() {
      Test.testAll();
      return UIState.headerMenu.close();
    },

    testOrder() {
      let x;
      const list1 = ((() => {
        const result: any[] = [];
        for (x of Unread.order.order()) {           result.push(x.ID);
        }
        return result;
      })());
      const list2 = ((() => {
        const result1: number[] = [];
        for (x of ($$((g.SITE.isOPContainerThread ? `${g.SITE.selectors.thread}, ` : '') + g.SITE.selectors.postContainer))) {           result1.push(+trailingDigits(x.id));
        }
        return result1;
      })());
      const pass = (function() {
        if (list1.length !== list2.length) { return false; }
        for (let i = 0, end = list1.length; i < end; i++) {
          if (list1[i] !== list2[i]) { return false; }
        }
        return true;
      })();
      if (pass) {
        return new Notice('success', `Orders same (${list1.length} posts)`, 5);
      } else {
        const _notice = new Notice('warning', 'Orders differ.', 30);
        c.log(list1);
        return c.log(list2);
      }
    },

    keydown(e) {
      if (keyCode(e) !== 'v') { return; }
      if (['INPUT', 'TEXTAREA'].includes(e.target.nodeName)) { return; }
      Test.testAll();
      e.preventDefault();
      return e.stopPropagation();
    }
  }
};
export default Test;
