import Callbacks from "../classes/Callbacks";
import DataBoard from "../classes/DataBoard";
import Get from "../General/Get";
import Header from "../General/Header";
import Index from "../General/Index";
import { g, Conf, d } from "../globals/globals";
import ExpandThread from "../Miscellaneous/ExpandThread";
import $ from "../platform/$";
import { dict } from "../platform/helpers";
import QuoteYou from "../Quotelinks/QuoteYou";
import ThreadWatcher from "./ThreadWatcher";

interface UnreadIndexType {
  lastReadPost: Record<string, number>;
  hr: Record<string, HTMLHRElement>;
  markReadLink: Record<string, HTMLAnchorElement>;
  enabled?: boolean;
  db?: DataBoard;
  init(): void;
  node(this: any): void;
  onIndexRefresh(e: Event): void;
  onPostsInserted(e: Event): void;
  sync(): void;
  update(thread: any): void;
  markRead(this: HTMLElement): void;
}

const UnreadIndex: UnreadIndexType = {
  lastReadPost: dict(),
  hr:           dict(),
  markReadLink: dict(),
  enabled: undefined,

  init() {
    if ((g.VIEW !== 'index') || !Conf['Remember Last Read Post'] || !Conf['Unread Line in Index']) { return; }

    this.enabled = true;
    this.db = new DataBoard('lastReadPosts', this.sync);

    Callbacks.Thread.push({
      name: 'Unread Line in Index',
      cb:   this.node
    });

    $.on(d, 'IndexRefreshInternal', this.onIndexRefresh);
    $.on(d, 'PostsInserted PostsRemoved', this.onPostsInserted);
  },

  node(this: any) {
    UnreadIndex.lastReadPost[this.fullID] = UnreadIndex.db!.get({
      boardID: this.board.ID,
      threadID: this.ID
    }) || 0;
    if (!Index.enabled) { // let onIndexRefresh handle JSON Index
      UnreadIndex.update(this);
    }
  },

  onIndexRefresh(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail?.isCatalog) { return; }
    for (const threadID of detail?.threadIDs || []) {
      const thread = g.threads.get(threadID);
      if (thread) {
        UnreadIndex.update(thread);
      }
    }
  },

  onPostsInserted(e: Event) {
    if (e.target === Index.root) { return; } // onIndexRefresh handles this case
    const thread = Get.threadFromNode(e.target as Node);
    if (!thread || (thread.nodes.root !== e.target)) { return; }
    const wasVisible = !!UnreadIndex.hr[thread.fullID]?.parentNode;
    UnreadIndex.update(thread);
    if (Conf['Scroll to Last Read Post'] && (e.type === 'PostsInserted') && !wasVisible && !!UnreadIndex.hr[thread.fullID]?.parentNode) {
      Header.scrollToIfNeeded(UnreadIndex.hr[thread.fullID], true);
    }
  },

  sync() {
    g.threads.forEach((thread: any) => {
      const lastReadPost = UnreadIndex.db!.get({
        boardID: thread.board.ID,
        threadID: thread.ID
      }) || 0;
      if (lastReadPost !== UnreadIndex.lastReadPost[thread.fullID]) {
        UnreadIndex.lastReadPost[thread.fullID] = lastReadPost;
        if (thread.nodes.root?.parentNode) {
          UnreadIndex.update(thread);
        }
      }
    });
  },

  update(thread: any) {
    let divider: HTMLElement | null;
    const lastReadPost = UnreadIndex.lastReadPost[thread.fullID];
    let repliesShown = 0;
    let repliesRead = 0;
    let firstUnread: any = null;
    thread.posts.forEach((post: any) => {
      if (post.isReply && thread.nodes.root.contains(post.nodes.root)) {
        repliesShown++;
        if (post.ID <= lastReadPost) {
          repliesRead++;
        } else if ((!firstUnread || (post.ID < firstUnread.ID)) && !post.isHidden && !QuoteYou.isYou(post)) {
          firstUnread = post;
        }
      }
    });

    let hr = UnreadIndex.hr[thread.fullID];
    if (firstUnread && (repliesRead || ((lastReadPost === thread.OP.ID) && (!$(g.SITE.selectors.summary, thread.nodes.root) || thread.ID in ExpandThread.statuses)))) {
      if (!hr) {
        hr = (UnreadIndex.hr[thread.fullID] = $.el('hr', { className: 'unread-line' }) as HTMLHRElement);
      }
      $.before(firstUnread.nodes.root, hr);
    } else {
      $.rm(hr);
    }

    const hasUnread = repliesShown ?
      (firstUnread || !repliesRead)
    : Index.enabled ?
      (thread.lastPost > lastReadPost)
    :
      (thread.OP.ID > lastReadPost);
    thread.nodes.root.classList.toggle('unread-thread', !!hasUnread);

    let link = UnreadIndex.markReadLink[thread.fullID];
    if (!link) {
      link = (UnreadIndex.markReadLink[thread.fullID] = $.el('a', {
        className: 'unread-mark-read brackets-wrap',
        href: 'javascript:;',
        textContent: 'Mark Read'
      }) as HTMLAnchorElement);
      $.on(link, 'click', UnreadIndex.markRead);
    }
    if ((divider = $(g.SITE.selectors.threadDivider, thread.nodes.root) as HTMLElement | null)) { // divider inside thread as in Tinyboard
      $.before(divider, link);
    } else {
      $.add(thread.nodes.root, link);
    }
  },

  markRead(this: HTMLElement) {
    const thread = Get.threadFromNode(this) as any;
    if (!thread) { return; }
    UnreadIndex.lastReadPost[thread.fullID] = thread.lastPost;
    UnreadIndex.db!.set({
      boardID:  thread.board.ID,
      threadID: thread.ID,
      val:      thread.lastPost
    });
    $.rm(UnreadIndex.hr[thread.fullID]);
    thread.nodes.root.classList.remove('unread-thread');
    ThreadWatcher.update(g.SITE.ID, thread.board.ID, thread.ID, {
      last: thread.lastPost,
      unread: 0,
      quotingYou: 0
    });
  }
};

export default UnreadIndex;
