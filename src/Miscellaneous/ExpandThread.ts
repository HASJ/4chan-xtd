import Callbacks from "../classes/Callbacks";
import Post from "../classes/Post";
import Get from "../General/Get";
import Index from "../General/Index";
import { g, Conf, d } from "../globals/globals";
import $ from "../platform/$";
import $$ from "../platform/$$";
import { dict } from "../platform/helpers";

const ExpandThread: any = {
  statuses: dict(),
  init() {
    if (!((g.VIEW === 'index') && Conf['Thread Expansion'])) { return; }
    if (Conf['JSON Index']) {
      $.on(d, 'IndexRefreshInternal', this.onIndexRefresh);
    } else {
      Callbacks.Thread.push({
        name: 'Expand Thread',
        cb() { ExpandThread.setButton(this); }
      });
    }
  },

  setButton(thread) {
    if (!thread.nodes.root) return;
    const a = $('a.summary', thread.nodes.root);
    if (!a) return;
    a.textContent = g.SITE.Build.summaryText('+', ...a.textContent.match(/\d+/g));
    a.style.cursor = 'pointer';
    $.on(a, 'click', ExpandThread.cbToggle);
  },

  disconnect(refresh) {
    if ((g.VIEW === 'thread') || !Conf['Thread Expansion']) { return; }
    for (const threadID in ExpandThread.statuses) {
      const status = ExpandThread.statuses[threadID];
      const oldReq = status.req;
      if (oldReq) {
        delete status.req;
        oldReq.abort();
      }
      delete ExpandThread.statuses[threadID];
    }

    if (!refresh) $.off(d, 'IndexRefreshInternal', this.onIndexRefresh);
  },

  onIndexRefresh() {
    ExpandThread.disconnect(true);
    g.BOARD.threads.forEach(thread => ExpandThread.setButton(thread));
  },

  cbToggle(e) {
    if ($.modifiedClick(e)) { return; }
    e.preventDefault();
    ExpandThread.toggle(Get.threadFromNode(this));
  },

  cbToggleBottom(e) {
    if ($.modifiedClick(e)) { return; }
    e.preventDefault();
    const thread = Get.threadFromNode(this);
    $.rm(this); // remove before fixing bottom of thread position
    const {bottom} = thread.nodes.root.getBoundingClientRect();
    ExpandThread.toggle(thread);
    return window.scrollBy(0, (thread.nodes.root.getBoundingClientRect().bottom - bottom));
  },

  toggle(thread) {
    if (!thread.nodes.root) return;
    const a = $('a.summary', thread.nodes.root);
    if (!a) return;
    if (thread.ID in ExpandThread.statuses) {
      ExpandThread.contract(thread, a, thread.nodes.root);
    } else {
      ExpandThread.expand(thread, a);
    }
  },

  expand(thread, a) {
    let status;
    ExpandThread.statuses[thread] = (status = {});
    a.textContent = g.SITE.Build.summaryText('...', ...a.textContent.match(/\d+/g));
    status.req = $.cache(g.SITE.urls.threadJSON({boardID: thread.board.ID, threadID: thread.ID}), function() {
      if (this !== status.req) { return; } // aborted
      delete status.req;
      ExpandThread.parse(this, thread, a);
    });
    status.numReplies = $$(g.SITE.selectors.replyOriginal, thread.nodes.root).length;
  },

  contract(thread, a, threadRoot) {
    const status = ExpandThread.statuses[thread];
    delete ExpandThread.statuses[thread];
    const oldReq = status.req;
    if (oldReq) {
      delete status.req;
      oldReq.abort();
      if (a) { a.textContent = g.SITE.Build.summaryText('+', ...a.textContent.match(/\d+/g)); }
      return;
    }

    let replies = $$('.thread > .replyContainer', threadRoot);
    if (status.numReplies) { replies = replies.slice(0, (-status.numReplies)); }
    let postsCount = 0;
    let filesCount = 0;
    for (const reply of replies) {
      // rm clones
      if (Conf['Quote Inlining']) { let inlined;
      while ((inlined = $('.inlined', reply))) { inlined.click(); } }
      postsCount++;
      if ('file' in Get.postFromRoot(reply)) { filesCount++; }
      $.rm(reply);
    }
    if (Index.enabled) { // otherwise handled by Main.addPosts
      $.event('PostsRemoved', null, a.parentNode);
    }
    a.textContent = g.SITE.Build.summaryText('+', postsCount, filesCount);
    $.rm($('.summary-bottom', threadRoot));
  },

  processPostData(postData, thread, posts, files) {
    if (postData.no === thread.ID) { return null; }
    let post = thread.posts.get(postData.no);
    let root;
    if (post && !post.isFetchedQuote) {
      root = post.nodes.root;
    } else {
      root = g.SITE.Build.postFromObject(postData, thread.board.ID);
      post = new Post(root, thread, thread.board);
      posts.push(post);
    }
    if ('file' in post) { files.count++; }
    return root;
  },

  parse(req, thread, a) {
    let root;
    if (![200, 304].includes(req.status)) {
      a.textContent = req.status ? `Error ${req.statusText} (${req.status})` : 'Connection Error';
      return;
    }

    g.SITE.Build.spoilerRange[thread.board] = req.response.posts[0].custom_spoiler;

    const posts      = [];
    const postsRoot  = [];
    const files = { count: 0 };
    for (const postData of req.response.posts) {
      const currentRoot = ExpandThread.processPostData(postData, thread, posts, files);
      if (currentRoot) {
        root = currentRoot;
        postsRoot.push(root);
      }
    }
    let filesCount = files.count;
    for (const post of posts) { Callbacks.Post.execute(post); }
    $.after(a, postsRoot);
    $.event('PostsInserted', null, a.parentNode);

    const postsCount    = postsRoot.length;
    a.textContent = g.SITE.Build.summaryText('-', postsCount, filesCount);

    if (root) {
      const a2 = a.cloneNode(true);
      a2.classList.add('summary-bottom');
      $.on(a2, 'click', ExpandThread.cbToggleBottom);
      $.after(root, a2);
    }
  }
};
export default ExpandThread;

