import Callbacks from "../classes/Callbacks";
import DataBoard from "../classes/DataBoard";
import Thread from "../classes/Thread";
import Index from "../General/Index";
import UI from "../General/UI";
import { g, Conf, d, doc } from "../globals/globals";
import Menu from "../Menu/Menu";
import $ from "../platform/$";
import $$ from "../platform/$$";
import { dict } from "../platform/helpers";
import Icon from '../Icons/icon';

interface ThreadHidingType {
  db: DataBoard | null;
  hiddenThreads: Record<string, boolean>;
  init(): void;
  catalogSet(board: any): void;
  catalogWatch(): void;
  catalogSave(): void;
  isHidden(boardID: string, threadID: string | number): boolean;
  node(this: any): void;
  onIndexRefresh(): void;
  menu: {
    thread?: Thread;
    init(): void;
    hide(this: HTMLAnchorElement): boolean;
    show(this: HTMLAnchorElement): boolean;
    hideStub(this: HTMLAnchorElement): void;
  };
  makeButton(thread: Thread, type: 'hide' | 'show'): HTMLAnchorElement;
  makeStub(thread: Thread, root: HTMLElement, reason?: string): void;
  saveHiddenState(thread: Thread, makeStub?: boolean): void;
  toggle(thread: Thread | HTMLAnchorElement): void;
  hide(thread: Thread, makeStub?: boolean, reason?: string): void;
  show(thread: Thread): void;
}

const ThreadHiding: ThreadHidingType = {
  db: null,
  hiddenThreads: {},

  init() {
    if (!['index', 'catalog'].includes(g.VIEW!) || !Conf['Thread Hiding Buttons'] && !(Conf['Menu'] && Conf['Thread Hiding Link']) && !Conf['JSON Index']) { return; }
    this.db = new DataBoard('hiddenThreads');
    if (g.VIEW === 'catalog') {
      this.catalogWatch();
      return;
    }
    this.catalogSet(g.BOARD);
    $.on(d, 'IndexRefreshInternal', this.onIndexRefresh);
    if (Conf['Thread Hiding Buttons']) {
      $.addClass(doc, 'thread-hide');
    }
    Callbacks.Post.push({
      name: 'Thread Hiding',
      cb:   this.node
    });
  },

  catalogSet(board) {
    if (!$.hasStorage || (g.SITE.software !== 'yotsuba')) { return; }
    const hiddenThreads = this.db!.get({
      boardID: board.ID,
      defaultValue: dict()
    });
    for (const threadID in hiddenThreads) { hiddenThreads[threadID] = true; }
    localStorage.setItem(`4chan-hide-t-${board}`, JSON.stringify(hiddenThreads));
  },

  catalogWatch() {
    if (!$.hasStorage || (g.SITE.software !== 'yotsuba')) { return; }
    this.hiddenThreads = JSON.parse(localStorage.getItem(`4chan-hide-t-${g.BOARD}`)!) || {};
    $.on(d, '4chanXInitFinished', () => // 4chan's catalog sets the style to "display: none;" when hiding or unhiding a thread.
    new MutationObserver(this.catalogSave.bind(this)).observe($.id('threads')!, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style']
    }));
  },

  catalogSave() {
    let threadID: string;
    const hiddenThreads2 = JSON.parse(localStorage.getItem(`4chan-hide-t-${g.BOARD}`)!) || {};
    for (threadID in hiddenThreads2) {
      if (!$.hasOwn(this.hiddenThreads, threadID)) {
        this.db!.set({
          boardID:  g.BOARD!.ID,
          threadID,
          val:      {makeStub: Conf['Stubs']}});
      }
    }
    for (threadID in this.hiddenThreads) {
      if (!$.hasOwn(hiddenThreads2, threadID)) {
        this.db!.delete({
          boardID:  g.BOARD!.ID,
          threadID
        });
      }
    }
    this.hiddenThreads = hiddenThreads2;
  },

  isHidden(boardID, threadID) {
    return !!(this.db && this.db.get({boardID, threadID}));
  },

  node(this: any) {
    let data;
    if (this.isReply || this.isClone || this.isFetchedQuote) { return; }

    if (Conf['Thread Hiding Buttons']) {
      $.prepend(this.nodes.root, ThreadHiding.makeButton(this.thread, 'hide'));
    }

    if (data = ThreadHiding.db!.get({boardID: this.board.ID, threadID: this.ID})) {
      ThreadHiding.hide(this.thread, data.makeStub, 'Hidden manually');
    }
  },

  onIndexRefresh() {
    g.BOARD!.threads.forEach(function(thread: Thread) {
      const {root} = thread.nodes;
      if (thread.isHidden && thread.stub && !root.contains(thread.stub)) {
        ThreadHiding.makeStub(thread, root);
      }
    });
  },

  menu: {
    init() {
      if ((g.VIEW !== 'index') || !Conf['Menu'] || !Conf['Thread Hiding Link']) { return; }

      const hideDiv = $.el('div', {
        className: 'hide-thread-link',
        textContent: 'Hide'
      });

      const apply = $.el('a', {
        textContent: 'Apply',
        href: 'javascript:;'
      });
      $.on(apply, 'click', this.hide);

      const makeStub = UI.checkbox('Stubs', 'Make stub');

      Menu.menu.addEntry({
        el: hideDiv,
        order: 20,
        open({thread, isReply}) {
          if (isReply || thread.isHidden || (Conf['JSON Index'] && (Conf['Index Mode'] === 'catalog'))) {
            return false;
          }
          ThreadHiding.menu.thread = thread;
          return true;
        },
        subEntries: [{el: apply}, {el: makeStub}]});

      const showLink = $.el('a', {
        className: 'show-thread-link',
        textContent: 'Show',
        href: 'javascript:;'
      }) as HTMLAnchorElement;
      $.on(showLink, 'click', this.show);

      Menu.menu.addEntry({
        el: showLink,
        order: 20,
        open({thread, isReply}) {
          if (isReply || !thread.isHidden || (Conf['JSON Index'] && (Conf['Index Mode'] === 'catalog'))) {
            return false;
          }
          ThreadHiding.menu.thread = thread;
          return true;
        }
      });

      const hideStubLink = $.el('a', {
        textContent: 'Hide stub',
        href: 'javascript:;'
      }) as HTMLAnchorElement;
      $.on(hideStubLink, 'click', this.hideStub);

      Menu.menu.addEntry({
        el: hideStubLink,
        order: 15,
        open({thread, isReply}) {
          if (isReply || !thread.isHidden || (Conf['JSON Index'] && (Conf['Index Mode'] === 'catalog'))) {
            return false;
          }
          ThreadHiding.menu.thread = thread;
          return true;
        }
      });
    },

    hide(this: HTMLAnchorElement) {
      const makeStub = ($('input', this.parentNode as HTMLElement) as HTMLInputElement).checked;
      const thread = ThreadHiding.menu.thread!;
      ThreadHiding.hide(thread, makeStub, 'Hidden manually');
      ThreadHiding.saveHiddenState(thread, makeStub);
      return $.event('CloseMenu', undefined);
    },

    show(this: HTMLAnchorElement) {
      const thread = ThreadHiding.menu.thread!;
      ThreadHiding.show(thread);
      ThreadHiding.saveHiddenState(thread);
      return $.event('CloseMenu', undefined);
    },

    hideStub(this: HTMLAnchorElement) {
      const thread = ThreadHiding.menu.thread!;
      ThreadHiding.show(thread);
      ThreadHiding.hide(thread, false);
      ThreadHiding.saveHiddenState(thread, false);
      $.event('CloseMenu', undefined);
    }
  },

  makeButton(thread, type) {
    const span = $.el('span', {
      className: 'stub-icon',
    });
    const a = $.el('a', {
      className: `${type}-post-button ${type}-thread-button`,
      href:      'javascript:;'
    }) as HTMLAnchorElement;
    Icon.set(span, type === 'hide' ? 'squareMinus' : 'squarePlus');
    $.add(a, span);
    a.dataset.fullID = thread.fullID;
    $.on(a, 'click', this.toggle);
    return a;
  },

  makeStub(thread, root, reason) {
    let summary, threadDivider;
    let numReplies  = $$(g.SITE!.selectors.replyOriginal, root).length;
    if (summary = $(g.SITE!.selectors.summary, root)) { numReplies += +(summary.textContent!.match(/\d+/) || [0])[0]; }

    const a = this.makeButton(thread, 'show');
    const { nameBlock, subject } = thread.OP.info;

    if (subject) {
      $.add(a, $.el('span', {
        className: 'stub-subject',
        textContent: subject
      }));
    }
    $.add(a, $.el('span', {
      className: 'stub-name',
      textContent: nameBlock
    }));
    $.add(a, $.el('span', {
      className: 'stub-replies',
      textContent: `(${numReplies} repl${numReplies === 1 ? 'y' : 'ies'})`
    }));

    let reasons = thread.OP.filterResults?.reasons || [];
    if (reason) reasons = [...reasons, reason];

    if (Conf['Filter Reason'] && reasons.length) {
      const reasonsSpan = $.el('span', { className: 'stub-reasons' });
      $.add(reasonsSpan, reasons.map(re => $.el('span', { className: 'stub-reason', textContent: re })));
      a.appendChild(reasonsSpan);
    }

    thread.stub = $.el('div', {className: 'stub'});

    if (Conf['Menu']) {
      $.add(thread.stub, [a, Menu.makeButton(thread.OP)]);
    } else {
      $.add(thread.stub, a);
    }
    if (!Conf['Filter Reason'] && reasons.length) thread.stub.title = reasons.join(' & ');
    $.prepend(root, thread.stub);

    // Prevent hiding of thread divider on sites that put it inside the thread
    if (threadDivider = $(g.SITE!.selectors.threadDivider, root)) {
      $.addClass(threadDivider, 'threadDivider');
    }
  },

  saveHiddenState(thread, makeStub) {
    if (thread.isHidden) {
      this.db!.set({
        boardID:  thread.board.ID,
        threadID: thread.ID,
        val: {makeStub}});
    } else {
      this.db!.delete({
        boardID:  thread.board.ID,
        threadID: thread.ID
      });
    }
    this.catalogSet(thread.board);
  },

  toggle(thread) {
    if (!(thread instanceof Thread)) {
      thread = g.threads!.get((thread as any).dataset.fullID)!;
    }
    if (thread.isHidden) {
      ThreadHiding.show(thread);
    } else {
      ThreadHiding.hide(thread, undefined, 'Hidden manually');
    }
    ThreadHiding.saveHiddenState(thread);
  },

  hide(thread, makeStub=Conf['Stubs'], reason) {
    if (thread.isHidden) { return; }
    const threadRoot = thread.nodes.root;
    thread.isHidden = true;
    Index.updateHideLabel();
    if (thread.catalogView && !Index.showHiddenThreads) {
      $.rm(thread.catalogView.nodes.root);
      $.event('PostsRemoved', null, Index.root);
    }

    if (!makeStub) {
      threadRoot.hidden = true;
      return;
    }

    this.makeStub(thread, threadRoot, reason);
  },

  show(thread) {
    if (thread.stub) {
      $.rm(thread.stub);
      delete thread.stub;
    }
    const threadRoot = thread.nodes.root;
    threadRoot.hidden = (thread.isHidden = false);
    Index.updateHideLabel();
    if (thread.catalogView && Conf['Index Mode'] === 'catalog') {
      const { root } = thread.catalogView.nodes;

      if (Index.showHiddenThreads) {
        $.rm(root);
        $.event('PostsRemoved', null, Index.root);
      } else {
        let i = Index.sortedThreadIDs.indexOf(thread.ID as number) - 1;

        while (true) {
          if (i < 0) {
            $('.board')!.insertAdjacentElement('afterbegin', root);
            break;
          }
          const rootPrevious = d.getElementById(`t${Index.sortedThreadIDs[i]}`);
          if (rootPrevious) {
            rootPrevious.insertAdjacentElement('afterend', root);
            break;
          }
          --i;
        }

        $.event('PostsInserted', null, Index.root);
      }
    }
  }
};

export default ThreadHiding;
