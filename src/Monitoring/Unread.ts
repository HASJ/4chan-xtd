import Callbacks from "../classes/Callbacks";
import DataBoard from "../classes/DataBoard";
import RandomAccessList from "../classes/RandomAccessList";
import Get from "../General/Get";
import UIState from "../globals/UIState";
import { g, Conf, d } from "../globals/globals";
import $ from "../platform/$";
import { debounce, SECOND } from "../platform/helpers";
import QuoteYou from "../Quotelinks/QuoteYou";
import Favicon from "./Favicon";
import { updateWatchedThread } from "./ThreadWatcherBridge";

interface LastSet extends Set<number> {
  last?: number;
}

interface UnreadType {
  db?: DataBoard;
  hr: HTMLHRElement;
  posts: LastSet;
  postsQuotingYou: LastSet;
  order: RandomAccessList;
  position: any;
  thread: any;
  title: string;
  lastReadPost?: number;
  readCount: number;
  linePosition?: any;
  init(): void;
  node(this: any): void;
  ready(): void;
  positionPrev(): any;
  scroll(): void;
  reset(): void;
  sync(): void;
  addPost(this: any): any;
  addPostQuotingYou(post: any): void;
  openNotification(post: any, predicate?: string): any;
  onUpdate(): void;
  readSinglePost(post: any): void;
  read(e?: Event): void;
  updatePosition(): void;
  saveLastReadPost(): void;
  setLine(force?: boolean): void;
  update(): void;
  saveThreadWatcherCount(): void;
  [key: string]: any;
}

function unreadTitle(count: number, countQuotingYou: number): string {
  const titleQuotingYou = Conf['Quoted Title'] && countQuotingYou ? '(!) ' : '';
  const titleCount = count || !Conf['Hide Unread Count at (0)'] ? `(${count}) ` : '';
  let titleDead = Unread.title;
  if (Unread.thread.isDead) {
    const deadText = Unread.thread.isArchived ? '- Archived -' : '- 404 -';
    titleDead = Unread.title.replace('-', deadText);
  }
  return `${titleQuotingYou}${titleCount}${titleDead}`;
}

function unreadFaviconKey(count: number, countQuotingYou: number): string {
  const { isDead } = Unread.thread;
  if (countQuotingYou) { return isDead ? 'unreadDeadY' : 'unreadY'; }
  if (count) { return isDead ? 'unreadDead' : 'unread'; }
  return isDead ? 'dead' : 'default';
}

const Unread: UnreadType = {
  hr: null as any,
  posts: null as any,
  postsQuotingYou: null as any,
  order: null as any,
  position: null,
  thread: null,
  title: '',
  lastReadPost: undefined,
  readCount: 0,
  linePosition: undefined,

  init() {
    if ((g.VIEW !== 'thread') || (
      !Conf['Unread Count'] &&
      !Conf['Unread Favicon'] &&
      !Conf['Unread Line'] &&
      !Conf['Remember Last Read Post'] &&
      !Conf['Desktop Notifications'] &&
      !Conf['Quote Threading']
    )) { return; }

    if (Conf['Remember Last Read Post']) {
      $.sync('Remember Last Read Post', (enabled: boolean) => Conf['Remember Last Read Post'] = enabled);
      this.db = new DataBoard('lastReadPosts', this.sync);
    }

    this.hr = $.el('hr', {
      id: 'unread-line',
      className: 'unread-line'
    }) as HTMLHRElement;
    this.posts = new Set<number>() as LastSet;
    this.postsQuotingYou = new Set<number>() as LastSet;
    this.order = new RandomAccessList();
    this.position = null;

    Callbacks.Thread.push({
      name: 'Unread',
      cb:   this.node
    });

    Callbacks.Post.push({
      name: 'Unread',
      cb:   this.addPost
    });
  },

  node(this: any) {
    Unread.thread = this;
    Unread.title  = d.title;
    Unread.lastReadPost = Unread.db?.get({
      boardID: this.board.ID,
      threadID: this.ID
    }) || 0;
    Unread.readCount = 0;
    for (const ID of this.posts.keys) {
      if (+ID <= Unread.lastReadPost!) {
        Unread.readCount++;
      }
    }
    $.one(d, '4chanXInitFinished', Unread.ready);
    $.on(d, 'PostsInserted',      Unread.onUpdate);
    $.on(d, 'ThreadUpdate',       (e: Event) => {
      if ((e as CustomEvent).detail?.[404]) {
        Unread.update();
      }
    });
    const resetLink = $.el('a', {
      href: 'javascript:;',
      className: 'unread-reset',
      textContent: 'Mark all unread'
    });
    $.on(resetLink, 'click', Unread.reset);
    UIState.headerMenu.addEntry({
      el: resetLink,
      order: 70
    });
  },

  ready() {
    if (Conf['Remember Last Read Post'] && Conf['Scroll to Last Read Post']) { Unread.scroll(); }
    Unread.setLine(true);
    Unread.read();
    Unread.update();
    $.on(d, 'scroll visibilitychange', Unread.read as any);
    if (Conf['Unread Line']) { $.on(d, 'visibilitychange', Unread.setLine as any); }
  },

  positionPrev() {
    if (Unread.position) { return Unread.position.prev; } else { return Unread.order.last; }
  },

  scroll() {
    // Let the header's onload callback handle it.
    const hash = /\d+/.exec(location.hash);
    if (hash && hash[0] in Unread.thread.posts) { return; }

    let position = Unread.positionPrev();
    while (position) {
      const { bottom } = position.data.nodes;
      if (!bottom.getBoundingClientRect().height) {
        // Don't try to scroll to posts with display: none
        position = position.prev;
      } else {
        UIState.scrollToIfNeeded(bottom, true);
        break;
      }
    }
  },

  reset() {
    if (Unread.lastReadPost == null) { return; }

    Unread.posts = new Set<number>() as LastSet;
    Unread.postsQuotingYou = new Set<number>() as LastSet;
    Unread.order = new RandomAccessList();
    Unread.position = null;
    Unread.lastReadPost = 0;
    Unread.readCount = 0;
    Unread.thread.posts.forEach((post: any) => Unread.addPost.call(post));

    ($.forceSync as any)('Remember Last Read Post');
    if (Conf['Remember Last Read Post'] && (!Unread.thread.isDead || Unread.thread.isArchived)) {
      Unread.db!.set({
        boardID:  Unread.thread.board.ID,
        threadID: Unread.thread.ID,
        val:      0
      });
    }

    Unread.updatePosition();
    Unread.setLine();
    Unread.update();
  },

  sync() {
    if (Unread.lastReadPost == null) { return; }
    const lastReadPost = Unread.db!.get({
      boardID: Unread.thread.board.ID,
      threadID: Unread.thread.ID,
      defaultValue: 0
    });
    if (Unread.lastReadPost >= lastReadPost) { return; }
    Unread.lastReadPost = lastReadPost;

    const postIDs = Unread.thread.posts.keys;
    for (let i = Unread.readCount, end = postIDs.length; i < end; i++) {
      const ID = +postIDs[i];
      if (!Unread.thread.posts.get(ID).isFetchedQuote) {
        if (ID > Unread.lastReadPost!) { break; }
        Unread.posts.delete(ID);
        Unread.postsQuotingYou.delete(ID);
      }
      Unread.readCount++;
    }

    Unread.updatePosition();
    Unread.setLine();
    Unread.update();
  },

  addPost(this: any) {
    if (this.isFetchedQuote || this.isClone) return;
    Unread.order.push(this);
    if ((this.ID <= Unread.lastReadPost!) || this.isHidden || QuoteYou.isYou(this)) return;
    Unread.posts.last = this.ID;
    Unread.posts.add(this.ID);
    Unread.addPostQuotingYou(this);
    Unread.position ??= Unread.order[this.ID];
    return Unread.position;
  },

  addPostQuotingYou(post: any) {
    for (const quotelink of post.nodes.quotelinks) {
      if (QuoteYou.db?.get(Get.postDataFromLink(quotelink))) {
        Unread.postsQuotingYou.last = post.ID;
        Unread.postsQuotingYou.add(post.ID);
        Unread.openNotification(post);
        return;
      }
    }
  },

  openNotification(post: any, predicate = ' replied to you') {
    if (!UIState.areNotificationsEnabled) { return; }
    const notif = new Notification(`${post.info.nameBlock}${predicate}`, {
      body: post.commentDisplay(),
      icon: Favicon.logo
    });
    notif.onclick = function() {
      UIState.scrollToIfNeeded(post.nodes.bottom, true);
      window.focus();
    };
    notif.onshow = () => setTimeout(() => notif.close(), 7 * SECOND);
    return notif;
  },

  onUpdate() {
    $.queueTask(() => { // ThreadUpdater may scroll immediately after inserting posts
      Unread.setLine();
      Unread.read();
      Unread.update();
    });
  },

  readSinglePost(post: any) {
    const { ID } = post;
    if (!Unread.posts.has(ID)) { return; }
    Unread.posts.delete(ID);
    Unread.postsQuotingYou.delete(ID);
    Unread.updatePosition();
    Unread.saveLastReadPost();
    Unread.update();
  },

  read: debounce(100, function(e?: Event) {
    // Update the lastReadPost when hidden posts are added to the thread.
    if (!Unread.posts.size && (Unread.readCount !== Unread.thread.posts.keys.length)) {
      Unread.saveLastReadPost();
    }

    if (d.hidden || !Unread.posts.size) { return; }

    let count = 0;
    while (Unread.position) {
      const { ID, data } = Unread.position;
      const { bottom } = data.nodes;
      if (bottom.getBoundingClientRect().height && // post has been hidden
        (UIState.getBottomOf(bottom) <= -1)) { break; }                      // post is completely read
      count++;
      Unread.posts.delete(ID);
      Unread.postsQuotingYou.delete(ID);
      Unread.position = Unread.position.next;
    }

    if (!count) { return; }
    Unread.updatePosition();
    Unread.saveLastReadPost();
    if (e) { Unread.update(); }
  }),

  updatePosition() {
    while (Unread.position && !Unread.posts.has(Unread.position.ID)) {
      Unread.position = Unread.position.next;
    }
  },

  saveLastReadPost: debounce(2 * SECOND, function() {
    let ID: number;
    ($.forceSync as any)('Remember Last Read Post');
    if (!Conf['Remember Last Read Post'] || !Unread.db) { return; }
    const postIDs = Unread.thread.posts.keys;
    for (let i = Unread.readCount, end = postIDs.length; i < end; i++) {
      ID = +postIDs[i];
      if (!Unread.thread.posts.get(ID).isFetchedQuote) {
        if (Unread.posts.has(ID)) { break; }
        Unread.lastReadPost = ID;
      }
      Unread.readCount++;
    }
    if (Unread.thread.isDead && !Unread.thread.isArchived) { return; }
    Unread.db.set({
      boardID:  Unread.thread.board.ID,
      threadID: Unread.thread.ID,
      val:      Unread.lastReadPost
    });
  }),

  setLine(force) {
    if (!Conf['Unread Line']) { return; }
    if (Unread.hr.hidden || d.hidden || (force === true)) {
      const oldPosition = Unread.linePosition;
      Unread.linePosition = Unread.positionPrev();
      if (Unread.linePosition) {
        if (Unread.linePosition !== oldPosition) {
          let node = Unread.linePosition.data.nodes.bottom;
          if (node.nextSibling?.tagName === 'BR') { node = node.nextSibling; }
          $.after(node, Unread.hr);
        }
      } else {
        $.rm(Unread.hr);
      }
    }
    Unread.hr.hidden = Unread.linePosition === Unread.order.last;
  },

  update() {
    const count = Unread.posts.size;
    const countQuotingYou = Unread.postsQuotingYou.size;

    if (Conf['Unread Count']) {
      d.title = unreadTitle(count, countQuotingYou);
    }

    Unread.saveThreadWatcherCount();

    if (Conf['Unread Favicon'] && (g.SITE.software === 'yotsuba')) {
      Favicon.set(unreadFaviconKey(count, countQuotingYou));
    }
  },

  saveThreadWatcherCount: debounce(2 * SECOND, function() {
    ($.forceSync as any)('Remember Last Read Post');
    if (Conf['Remember Last Read Post'] && (!Unread.thread.isDead || Unread.thread.isArchived)) {
      let posts: any[];
      const quotingYou = !Conf['Require OP Quote Link'] && QuoteYou.isYou(Unread.thread.OP) ? Unread.posts : Unread.postsQuotingYou;
      if (!quotingYou.size) {
        quotingYou.last = 0;
      } else if (!quotingYou.has(quotingYou.last!)) {
        quotingYou.last = 0;
        posts = Unread.thread.posts.keys;
        for (let i = posts.length - 1; i >= 0; i--) {
          if (quotingYou.has(+posts[i])) {
            quotingYou.last = posts[i];
            break;
          }
        }
      }
      updateWatchedThread(g.SITE.ID, Unread.thread.board.ID, Unread.thread.ID, {
        last: Unread.thread.lastPost,
        isDead: Unread.thread.isDead,
        isArchived: Unread.thread.isArchived,
        unread: Unread.posts.size,
        quotingYou: (quotingYou.last || 0)
      });
    }
  })
};

export default Unread;
