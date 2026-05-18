import Notice from "../classes/Notice";
import Post from "../classes/Post";
import Config from "../config/Config";
import Filter from "../Filtering/Filter";
import ImageHost from "../Images/ImageHost";
import Keybinds from "../Miscellaneous/Keybinds";
import Unread from "../Monitoring/Unread";
import $$ from "../platform/$$";
import $ from "../platform/$";
import Header from "./Header";
import { g, Conf, c, d } from "../globals/globals";
import Menu from "../Menu/Menu";

interface TestType {
  init(): void;
  assert(condition: () => boolean): void;
  normalize(root: Node): Node;
  firstDiff(x: Node, y: Node): [Node | null, Node | null];
  testOne(post: any): void;
  testAll(): void;
  postsRemaining: number;
  postsFailed: number;
  time: number;
  report(): void;
  cb: {
    testOne(this: HTMLElement): void;
    testAll(): void;
    testOrder(): void;
    keydown(e: KeyboardEvent): void;
  };
}

const Test: TestType = {
  postsRemaining: 0,
  postsFailed: 0,
  time: 0,

  init() {
    if ((g.SITE!.software !== 'yotsuba') || !['index', 'thread'].includes(g.VIEW!)) { return; }

    if (Conf['Menu']) {
      const a = $.el('a', {textContent: 'Test HTML building'}) as HTMLAnchorElement;
      $.on(a, 'click', this.cb.testOne);
      Menu.menu.addEntry({
        el: a,
        open(post: any) {
          a.dataset.fullID = post.fullID;
          return true;
        }
      });
    }

    const a2 = $.el('a', {textContent: 'Test HTML building'}) as HTMLAnchorElement;
    $.on(a2, 'click', this.cb.testAll);
    Header.menu.addEntry({el: a2});

    if (Unread.posts) {
      const testOrderLink = $.el('a', {textContent: 'Test Post Order'}) as HTMLAnchorElement;
      $.on(testOrderLink, 'click', this.cb.testOrder);
      Header.menu.addEntry({el: testOrderLink});
    }

    $.on(d, 'keydown', this.cb.keydown);
  },

  assert(condition) {
    if (!condition()) {
      new Notice('warning', `Assertion failed: ${condition}`, 30);
    }
  },

  normalize(root) {
    let node: Node | null;
    const root2 = root.cloneNode(true) as HTMLElement;
    for (const el of $$('.mobile', root2)) {
      $.rm(el);
    }
    for (const el of $$('a[href]', root2) as HTMLAnchorElement[]) {
      let {href} = el;
      href = href.replace(/(^\w+:\/\/boards\.4chan(?:nel)?\.org\/[^\/]+\/thread\/\d+)\/.*/, '$1');
      el.setAttribute('href', href);
    }
    ImageHost.fixLinks($$('.fileText > a, a.fileThumb', root2) as HTMLAnchorElement[]);
    for (const el of $$('img[src]', root2) as HTMLImageElement[]) {
      el.src = el.src.replace(/(spoiler-\w+)\d(\.png)$/, '$11$2');
    }
    for (const el of $$('pre.prettyprinted', root2) as HTMLElement[]) {
      const snapshot = $.X('.//br|.//wbr|.//text()', el);
      let i = 0;
      const nodes: Node[] = [];
      while (node = snapshot.snapshotItem(i++)) {
        nodes.push(node);
      }
      $.rmAll(el);
      $.add(el, nodes);
      el.normalize();
      $.rmClass(el, 'prettyprinted');
    }
    for (const el of $$('pre[style=""]', root2) as HTMLElement[]) {
      el.removeAttribute('style');
    }
    $('.fileInfo[data-md5]', root2)?.removeAttribute('data-md5');
    const textNodes = $.X('.//text()', root2);
    let i = 0;
    while (node = textNodes.snapshotItem(i++)) {
      const textNode = node as Text;
      textNode.data = textNode.data.replace(/\ +/g, ' ');
      if (textNode.previousSibling?.nodeName === 'BR') { textNode.data = textNode.data.replace(/^\n+/g, ''); }
      if (textNode.nextSibling?.nodeName === 'BR') { textNode.data = textNode.data.replace(/\n+$/g, ''); }
      if (textNode.data === '') { $.rm(textNode); }
    }
    return root2;
  },

  firstDiff(x, y) {
    let x2: Node | null = x.cloneNode(false);
    let y2: Node | null = y.cloneNode(false);
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

  testOne(post) {
    Test.postsRemaining++;
    $.cache(g.SITE!.urls.threadJSON({boardID: post.boardID, threadID: post.threadID}), function(this: XMLHttpRequest) {
      if (!this.response) { return; }
      const {posts} = this.response;
      g.SITE!.Build.spoilerRange[post.board.ID] = posts[0].custom_spoiler;
      for (const postData of posts) {
        if (postData.no === post.ID) {
          const t1 = new Date().getTime();
          const obj = g.SITE!.Build.parseJSON(postData, post.board);
          const root = g.SITE!.Build.post(obj);
          const t2 = new Date().getTime();
          Test.time += t2 - t1;
          const post2 = new Post(root, post.thread, post.board, {forBuildTest: true} as any);
          let fail = false;

          const x = post.normalizedOriginal;
          const y = post2.normalizedOriginal;
          if (!x.isEqualNode(y)) {
            fail = true;
            c.log(`${post.fullID} differs`);
            const [x2, y2] = Test.firstDiff(x, y);
            c.log(x2);
            c.log(y2);
            c.log(x.outerHTML);
            c.log(y.outerHTML);
          }

          for (const key in Config.filter) {
            if ((key !== 'General') && !((key === 'MD5') && (post.board.ID === 'f'))) {
              const val1 = Filter.values(key, obj);
              const val2 = Filter.values(key, post2);
              if ((val1.length !== val2.length) || !val1.every((x, i) => x === val2[i])) {
                fail = true;
                c.log(`${post.fullID} has filter bug in ${key}`);
                c.log(val1);
                c.log(val2);
              }
            }
          }

          if (fail) {
            Test.postsFailed++;
          } else {
            c.log(`${post.fullID} correct`);
          }
          Test.postsRemaining--;
          if (Test.postsRemaining === 0) { Test.report(); }
        }
      }
    });
  },

  testAll() {
    g.posts!.forEach(function(post: Post) {
      if (!post.isClone && !post.isFetchedQuote) {
        let abbr;
        if (!((abbr = $('.abbr', post.nodes.comment)) && /Comment too long\./.test(abbr.textContent!))) {
          Test.testOne(post);
        }
      }
    });
  },

  report() {
    if (Test.postsFailed) {
      new Notice('warning', `${Test.postsFailed} post(s) differ (${Test.time} ms)`, 30);
    } else {
      new Notice('success', `All correct (${Test.time} ms)`, 5);
    }
    Test.postsFailed = 0;
    Test.time = 0;
  },

  cb: {
    testOne(this: HTMLElement) {
      Test.testOne(g.posts!.get(this.dataset.fullID!)!);
      Menu.menu.close();
    },

    testAll() {
      Test.testAll();
      Header.menu.close();
    },

    testOrder() {
      let x;
      const list1 = (() => {
        const result = [];
        for (x of Unread.order!.order()) {
          result.push(x.ID);
        }
        return result;
      })();
      const list2 = (() => {
        const result1 = [];
        for (x of ($$((g.SITE!.isOPContainerThread ? `${g.SITE!.selectors.thread}, ` : '') + g.SITE!.selectors.postContainer) as HTMLElement[])) {
          result1.push(+x.id.match(/\d*$/)![0]);
        }
        return result1;
      })();
      const pass = (function() {
        if (list1.length !== list2.length) { return false; }
        for (let i = 0, end = list1.length; i < end; i++) {
          if (list1[i] !== list2[i]) { return false; }
        }
        return true;
      })();
      if (pass) {
        new Notice('success', `Orders same (${list1.length} posts)`, 5);
      } else {
        new Notice('warning', 'Orders differ.', 30);
        c.log(list1);
        c.log(list2);
      }
    },

    keydown(e) {
      if (Keybinds.keyCode(e) !== 'v') { return; }
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).nodeName)) { return; }
      Test.testAll();
      e.preventDefault();
      e.stopPropagation();
    }
  }
};

export default Test;
