import Callbacks from "../classes/Callbacks";
import Post from "../classes/Post";
import Get from "../General/Get";
import Index from "../General/Index";
import { g, Conf, d } from "../globals/globals";
import $ from "../platform/$";
import $$ from "../platform/$$";
import { dict } from "../platform/helpers";

interface ExpandThreadType {
  statuses: Record<string, any>;
  init(): void;
  setButton(thread: any): void;
  disconnect(refresh?: boolean): void;
  onIndexRefresh(): void;
  cbToggle(this: HTMLElement, e: MouseEvent): void;
  cbToggleBottom(this: HTMLElement, e: MouseEvent): void;
  toggle(thread: any): void;
  expand(thread: any, a: HTMLAnchorElement): void;
  contract(thread: any, a: HTMLAnchorElement | null, threadRoot: HTMLElement): void;
  parse(req: XMLHttpRequest, thread: any, a: HTMLAnchorElement): void;
}

const ExpandThread: ExpandThreadType = {
  statuses: dict(),

  init() {
    if (!((g.VIEW === 'index') && Conf['Thread Expansion'])) { return; }
    if (Conf['JSON Index']) {
      $.on(d, 'IndexRefreshInternal', this.onIndexRefresh);
    } else {
      Callbacks.Thread.push({
        name: 'Expand Thread',
        cb(this: any) { ExpandThread.setButton(this); }
      });
    }
  },

  setButton(thread) {
    if (!thread.nodes.root) return;
    const a = $('a.summary', thread.nodes.root) as HTMLAnchorElement;
    if (!a) return;
    a.textContent = g.SITE!.Build.summaryText('+', ...(a.textContent!.match(/\d+/g) || []));
    a.style.cursor = 'pointer';
    $.on(a, 'click', ExpandThread.cbToggle);
  },

  disconnect(refresh) {
    if ((g.VIEW === 'thread') || !Conf['Thread Expansion']) { return; }
    for (const threadID in ExpandThread.statuses) {
      let oldReq;
      const status = ExpandThread.statuses[threadID];
      if (oldReq = status.req) {
        delete status.req;
        oldReq.abort();
      }
      delete ExpandThread.statuses[threadID];
    }

    if (!refresh) $.off(d, 'IndexRefreshInternal', this.onIndexRefresh);
  },

  onIndexRefresh() {
    ExpandThread.disconnect(true);
    g.BOARD!.threads.forEach(thread => ExpandThread.setButton(thread));
  },

  cbToggle(this: HTMLElement, e: MouseEvent) {
    if ($.modifiedClick(e)) { return; }
    e.preventDefault();
    ExpandThread.toggle(Get.threadFromNode(this));
  },

  cbToggleBottom(this: HTMLElement, e: MouseEvent) {
    if ($.modifiedClick(e)) { return; }
    e.preventDefault();
    const thread = Get.threadFromNode(this);
    $.rm(this); // remove before fixing bottom of thread position
    const {bottom} = thread.nodes.root.getBoundingClientRect();
    ExpandThread.toggle(thread);
    window.scrollBy(0, (thread.nodes.root.getBoundingClientRect().bottom - bottom));
  },

  toggle(thread) {
    if (!thread.nodes.root) return;
    const a = $('a.summary', thread.nodes.root) as HTMLAnchorElement;
    if (!a) return;
    if (thread.ID in ExpandThread.statuses) {
      ExpandThread.contract(thread, a, thread.nodes.root);
    } else {
      ExpandThread.expand(thread, a);
    }
  },

  expand(thread, a) {
    let status: any;
    ExpandThread.statuses[thread.ID] = (status = {});
    a.textContent = g.SITE!.Build.summaryText('...', ...(a.textContent!.match(/\d+/g) || []));
    status.req = $.cache(g.SITE!.urls.threadJSON({boardID: thread.board.ID, threadID: thread.ID}), function(this: XMLHttpRequest) {
      if (this !== status.req) { return; } // aborted
      delete status.req;
      ExpandThread.parse(this, thread, a);
    });
    status.numReplies = $$(g.SITE!.selectors.replyOriginal, thread.nodes.root).length;
  },

  contract(thread, a, threadRoot) {
    let oldReq;
    const status = ExpandThread.statuses[thread.ID];
    delete ExpandThread.statuses[thread.ID];
    if (oldReq = status.req) {
      delete status.req;
      oldReq.abort();
      if (a) { a.textContent = g.SITE!.Build.summaryText('+', ...(a.textContent!.match(/\d+/g) || [])); }
      return;
    }

    let replies = $$('.thread > .replyContainer', threadRoot) as HTMLElement[];
    if (status.numReplies) { replies = replies.slice(0, (-status.numReplies)); }
    let postsCount = 0;
    let filesCount = 0;
    for (const reply of replies) {
      if (Conf['Quote Inlining']) {
        let inlined;
        while ((inlined = $('.inlined', reply) as HTMLElement)) { inlined.click(); }
      }
      postsCount++;
      if ('file' in Get.postFromRoot(reply)) { filesCount++; }
      $.rm(reply);
    }
    if (Index.enabled) {
      $.event('PostsRemoved', null, a!.parentNode as HTMLElement);
    }
    a!.textContent = g.SITE!.Build.summaryText('+', postsCount, filesCount);
    const summaryBottom = $('.summary-bottom', threadRoot);
    if (summaryBottom) { $.rm(summaryBottom); }
  },

  parse(req, thread, a) {
    let root: HTMLElement | null = null;
    if (![200, 304].includes(req.status)) {
      a.textContent = req.status ? `Error ${req.statusText} (${req.status})` : 'Connection Error';
      return;
    }

    g.SITE!.Build.spoilerRange[thread.board.ID] = req.response.posts[0].custom_spoiler;

    const posts: Post[]      = [];
    const postsRoot: HTMLElement[]  = [];
    let filesCount = 0;
    for (const postData of req.response.posts) {
      let post;
      if (postData.no === thread.ID) { continue; }
      if ((post = thread.posts.get(postData.no)) && !post.isFetchedQuote) {
        if ('file' in post) { filesCount++; }
        root = post.nodes.root;
        postsRoot.push(root);
        continue;
      }
      root = g.SITE!.Build.postFromObject(postData, thread.board.ID);
      post = new Post(root!, thread, thread.board);
      if ('file' in post) { filesCount++; }
      posts.push(post);
      postsRoot.push(root!);
    }
    for (const post of posts) { Callbacks.Post.execute(post); }
    $.after(a, postsRoot);
    $.event('PostsInserted', null, a.parentNode as HTMLElement);

    const postsCount    = postsRoot.length;
    a.textContent = g.SITE!.Build.summaryText('-', postsCount, filesCount);

    if (root) {
      const a2 = a.cloneNode(true) as HTMLAnchorElement;
      a2.classList.add('summary-bottom');
      $.on(a2, 'click', ExpandThread.cbToggleBottom);
      $.after(root, a2);
    }
  }
};

export default ExpandThread;
