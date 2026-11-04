import Callbacks from "../classes/Callbacks";
import DataBoard from "../classes/DataBoard";
import Notice from "../classes/Notice";
import Get from "../General/Get";
import UIState from "../globals/UIState";
import { Conf, d, doc, g } from "../globals/globals";
import Menu from "../Menu/Menu";
import ExpandComment from "../Miscellaneous/ExpandComment";
import ScrollMarkers from "../Miscellaneous/ScrollMarkers";
import $ from "../platform/$";
import $$ from "../platform/$$";
import { dict } from "../platform/helpers";
import PostRedirect from "../Posting/PostRedirect";

interface YourPostKey {
  boardID: string;
  threadID: string | number;
  postID: string | number;
}

interface QuoteYouType {
  db: DataBoard;
  /** Permanent copy of `yourPosts`, never cleaned. Undefined while "Remember Your Posts" is off. */
  dbForever?: DataBoard;
  /** Every post in `dbForever` as "siteID/boardID/postID". */
  foreverIndex: Set<string>;
  mark: HTMLElement;
  lastRead?: HTMLElement;
  init(): void;
  isYou(post: any): boolean;
  buildIndex(): void;
  isYouPostID(siteID: string | undefined, boardID: string, postID: string | number): boolean;
  rememberForever(post: YourPostKey, cb?: () => void): void;
  forgetForever(post: YourPostKey): void;
  backfillForever(): void;
  node(this: any): void;
  menu: {
    post?: any;
    init(): void;
    toggle(this: HTMLInputElement): void;
  };
  cb: {
    seek(type: 'preceding' | 'following'): void;
    scroll(root: HTMLElement): boolean;
  };
}

const QuoteYou: QuoteYouType = {
  db: null as any,
  mark: null as any,
  dbForever: undefined,
  lastRead: undefined,

  init() {
    if (!Conf['Remember Your Posts']) { return; }

    this.db = new DataBoard('yourPosts');
    // Permanent copy of your posts, never cleaned. Value = time the post was recorded (ms).
    this.dbForever = new DataBoard('yourPostsForever', QuoteYou.buildIndex, true);
    QuoteYou.buildIndex();
    QuoteYou.backfillForever();
    $.sync('Remember Your Posts', (enabled: boolean) => Conf['Remember Your Posts'] = enabled);
    $.on(d, 'QRPostSuccessful', (e: CustomEvent) => {
      const cb = PostRedirect.delay();
      const cbForever = PostRedirect.delay();
      $.get('Remember Your Posts', Conf['Remember Your Posts'], (items: any) => {
        if (!items['Remember Your Posts']) { return; }
        const { boardID, threadID, postID } = e.detail;
        QuoteYou.rememberForever({ boardID, threadID, postID }, cbForever);
        QuoteYou.db.set({ boardID, threadID, postID, val: true }, cb);
      });
    });

    if (!(g.VIEW && ['index', 'thread', 'archive'].includes(g.VIEW))) { return; }

    if (Conf['Highlight Own Posts']) {
      $.addClass(doc, 'highlight-own');
    }

    if (Conf['Highlight Posts Quoting You']) {
      $.addClass(doc, 'highlight-you');
    }

    if (Conf['Comment Expansion']) {
      ExpandComment.callbacks.push(this.node);
    }

    // \u00A0 is nbsp
    this.mark = $.el('span', {
      textContent: '\u00A0(You)',
      className:   'qmark-you'
    });

    Callbacks.Post.push({
      name: 'Mark Quotes of You',
      cb:   this.node
    });

    QuoteYou.menu.init();
  },

  isYou(post: any): boolean {
    return !!QuoteYou.db?.get({
      boardID:  post.boardID,
      threadID: post.threadID,
      postID:   post.ID
    });
  },

  // Index of `yourPostsForever` as "siteID/boardID/postID". Post numbers are unique per board,
  // so the thread number is not needed to recognize a post as yours.
  foreverIndex: new Set<string>(),

  buildIndex() {
    const index = new Set<string>();
    const data = QuoteYou.dbForever?.data || {};
    for (const siteID in data) {
      const boards = data[siteID]?.boards;
      if (!boards || typeof boards !== 'object') { continue; }
      for (const boardID in boards) {
        for (const threadID in boards[boardID]) {
          for (const postID in boards[boardID][threadID]) {
            index.add(`${siteID}/${boardID}/${postID}`);
          }
        }
      }
    }
    QuoteYou.foreverIndex = index;
  },

  isYouPostID(siteID: string | undefined, boardID: string, postID: string | number) {
    return QuoteYou.foreverIndex.has(`${siteID || g.SITE.ID}/${boardID}/${postID}`);
  },

  rememberForever({ boardID, threadID, postID }: YourPostKey, cb?: () => void) {
    if (!QuoteYou.dbForever) { cb?.(); return; }
    QuoteYou.foreverIndex.add(`${g.SITE.ID}/${boardID}/${postID}`);
    QuoteYou.dbForever.set({ boardID, threadID, postID, val: Date.now() }, cb);
  },

  forgetForever({ boardID, threadID, postID }: YourPostKey) {
    if (!QuoteYou.dbForever) { return; }
    QuoteYou.foreverIndex.delete(`${g.SITE.ID}/${boardID}/${postID}`);
    QuoteYou.dbForever.delete({ boardID, threadID, postID });
  },

  // One time: copy everything already in `yourPosts` into `yourPostsForever`, dated now.
  backfillForever() {
    $.get('yourPostsForeverBackfilled', false, ({ yourPostsForeverBackfilled }: any) => {
      if (yourPostsForeverBackfilled) { return; }
      const now = Date.now();
      QuoteYou.dbForever.save(() => {
        const from = QuoteYou.db.data;
        const to = QuoteYou.dbForever.data;
        for (const siteID in from) {
          const boards = from[siteID]?.boards;
          if (!boards || typeof boards !== 'object') { continue; }
          to[siteID] ||= { boards: dict() };
          const toBoards = to[siteID].boards;
          for (const boardID in boards) {
            for (const threadID in boards[boardID]) {
              const posts = boards[boardID][threadID];
              if (!posts || typeof posts !== 'object') { continue; }
              for (const postID in posts) {
                if (!posts[postID]) { continue; }
                toBoards[boardID] ||= dict();
                toBoards[boardID][threadID] ||= dict();
                toBoards[boardID][threadID][postID] ??= now;
              }
            }
          }
        }
      }, () => {
        QuoteYou.buildIndex();
        $.set('yourPostsForeverBackfilled', true);
      });
      QuoteYou.buildIndex();
    });
  },

  node(this: any) {
    if (this.isClone) { return; }

    if (QuoteYou.isYou(this)) {
      $.addClass(this.nodes.root, 'yourPost');
      ScrollMarkers.markScroll();
    }

    // Stop there if there's no quotes in that post.
    if (!this.quotes.length) { return; }

    for (const quotelink of this.nodes.quotelinks) {
      if (QuoteYou.db.get(Get.postDataFromLink(quotelink))) {
        if (Conf['Mark Quotes of You']) { $.add(quotelink, QuoteYou.mark.cloneNode(true)); }
        $.addClass(quotelink, 'you');
        $.addClass(this.nodes.root, 'quotesYou');
      }
    }
  },

  menu: {
    post: undefined,

    init() {
      const label = $.el('label', { className: 'toggle-you' }, { innerHTML: '<input type="checkbox"> You' });
      const input = $('input', label) as HTMLInputElement;
      $.on(input, 'change', QuoteYou.menu.toggle);
      Menu.menu?.addEntry({
        el: label,
        order: 80,
        open(post) {
          QuoteYou.menu.post = (post.origin || post);
          input.checked = QuoteYou.isYou(post);
          return true;
        }
      });
    },

    toggle(this: HTMLInputElement) {
      const post = QuoteYou.menu.post;
      const data = { boardID: post.board.ID, threadID: post.thread.ID, postID: post.ID, val: true };
      if (this.checked) {
        QuoteYou.db.set(data);
        QuoteYou.rememberForever(data);
      } else {
        QuoteYou.db.delete(data);
        QuoteYou.forgetForever(data);
      }
      for (const clone of [post].concat(post.clones)) {
        clone.nodes.root.classList.toggle('yourPost', this.checked);
      }
      for (const quotelink of Get.allQuotelinksLinkingTo(post)) {
        if (this.checked) {
          if (Conf['Mark Quotes of You']) { $.add(quotelink, QuoteYou.mark.cloneNode(true)); }
        } else {
          $.rm($('.qmark-you', quotelink));
        }
        quotelink.classList.toggle('you', this.checked);
        if ($.hasClass(quotelink, 'quotelink')) {
          const quoter = Get.postFromNode(quotelink).nodes.root;
          quoter.classList.toggle('quotesYou', !!$('.quotelink.you', quoter));
        }
      }
      ScrollMarkers.markScroll();
    }
  },

  cb: {
    seek(type: 'preceding' | 'following') {
      let highlighted: HTMLElement | null, post: HTMLElement | null;
      let result: XPathResult;
      const highlight = g.SITE.classes.highlight;
      highlighted = $(`.${highlight}`);
      if (highlighted) { $.rmClass(highlighted, highlight); }

      if (!QuoteYou.lastRead || !doc.contains(QuoteYou.lastRead) || !$.hasClass(QuoteYou.lastRead, 'quotesYou')) {
        post = (QuoteYou.lastRead = $('.quotesYou') as HTMLElement);
        if (!post) {
          const _notice = new Notice('warning', 'No posts are currently quoting you, loser.', 20);
          return;
        }
        if (QuoteYou.cb.scroll(post)) { return; }
      } else {
        post = QuoteYou.lastRead;
      }

      const str = `${type}::div[contains(@class,'quotesYou')]`;

      for (;;) {
        result = $.X(str, post);
        post = result.snapshotItem(type === 'preceding' ? result.snapshotLength - 1 : 0) as HTMLElement;
        if (!post) { break; }
        if (QuoteYou.cb.scroll(post)) { return; }
      }

      const posts = $$('.quotesYou') as HTMLElement[];
      QuoteYou.cb.scroll(posts[type === 'following' ? 0 : posts.length - 1]);
    },

    scroll(root: HTMLElement): boolean {
      const post = Get.postFromRoot(root);
      if (!post.nodes.post.getBoundingClientRect().height) {
        return false;
      } else {
        QuoteYou.lastRead = root;
        location.href = Get.url('post', post);
        UIState.scrollTo(post.nodes.post);
        if (post.isReply) {
          const sel = `${g.SITE.selectors.postContainer}${g.SITE.selectors.highlightable.reply}`;
          let node = post.nodes.root;
          if (!node.matches(sel)) { node = $(sel, node); }
          $.addClass(node, g.SITE.classes.highlight);
        }
        return true;
      }
    }
  }
};

export default QuoteYou;
