// @ts-nocheck
import Callbacks from "../classes/Callbacks";
import type Post from "../classes/Post";
import RandomAccessList from "../classes/RandomAccessList";
import UIState from "../globals/UIState";
import { Conf, d, g } from "../globals/globals";
import { disableReplyPruning, registerQuoteThreadingInput } from "../Monitoring/ThreadDisplayModes";
import Unread from "../Monitoring/Unread";
import $ from "../platform/$";
import { dict } from "../platform/helpers";

/*
  <3 aeosynth
*/

const QuoteThreading = {
  init() {
    if (!Conf['Quote Threading'] || (g.VIEW !== 'thread')) { return; }

    this.controls = $.el('label',
      {innerHTML: "<input id=\"threadingControl\" name=\"Thread Quotes\" type=\"checkbox\"> Threading"});

    this.threadNewLink = $.el('span', {
      className: 'brackets-wrap threadnewlink',
      hidden: true
    }
    );
    $.extend(this.threadNewLink, {innerHTML: "<a href=\"javascript:;\">Thread New Posts</a>"});

    this.input = $('input', this.controls);
    registerQuoteThreadingInput(this.input);
    this.input.checked = Conf['Thread Quotes'];

    $.on(this.input, 'change', this.setEnabled);
    $.on(this.input, 'change', this.rethread);
    $.on(this.threadNewLink.firstElementChild, 'click', this.rethread);
    $.on(d, '4chanXInitFinished', () => { this.ready = true; });

    this.entry = {
      el:    this.controls,
      order: 99
    };
    UIState.headerMenu.addEntry(this.entry);

    Callbacks.Thread.push({
      name: 'Quote Threading',
      cb:   this.setThread
    });

    Callbacks.Post.push({
      name: 'Quote Threading',
      cb:   this.node
    });
  },

  parent:   dict(),
  children: dict(),
  inserted: dict(),

  toggleThreading() {
    this.setThreadingState(!Conf['Thread Quotes']);
  },

  setThreadingState(enabled) {
    this.input.checked = enabled;
    this.setEnabled.call(this.input);
    this.rethread.call(this.input);
  },

  setEnabled() {
    if (this.checked) {
      $.set('Prune All Threads', false);
      disableReplyPruning();
    }
    $.cb.checked.call(this);
  },

  setThread() {
    QuoteThreading.thread = this;
    $.asap((() => !Conf['Thread Updater'] || $('.navLinksBot > .updatelink')), function() {
      let navLinksBot;
      navLinksBot = $('.navLinksBot');
      if (navLinksBot) { $.add(navLinksBot, [$.tn(' '), QuoteThreading.threadNewLink]); }
    });
  },

  node(this: Post) {
    let parent;
    if (this.isFetchedQuote || this.isClone || !this.isReply) { return; }

    const parents = new Set();
    let lastParent = null;
    for (let quote of this.quotes) {
      parent = g.posts.get(quote);
      if (parent) {
        if (!parent.isFetchedQuote && parent.isReply && (parent.ID < this.ID)) {
          parents.add(parent.ID);
          if (!lastParent || (parent.ID > lastParent.ID)) { lastParent = parent; }
        }
      }
    }

    if (!lastParent) return;

    let ancestor = lastParent;
    while ((ancestor = QuoteThreading.parent[ancestor.fullID])) {
      parents.delete(ancestor.ID);
    }

    if (parents.size === 1) {
      QuoteThreading.parent[this.fullID] = lastParent;
    }
  },

  descendants(post) {
    let children;
    let posts = [post];
    children = QuoteThreading.children[post.fullID];
    if (children) {
      for (let child of children) {
        posts = posts.concat(QuoteThreading.descendants(child));
      }
    }
    return posts;
  },

  hasUnread(descendants) {
    for (let x of descendants) { if (Unread.posts.has(x.ID)) { return true; } }
    return false;
  },

  findInsertIndex(children, post) {
    let i = children.length;
    for (let j = children.length - 1; j >= 0; j--) { if (children[j].ID >= post.ID) { i--; } }
    return i;
  },

  findLastDescendantParent(parent) {
    let prev2;
    let prev = parent;
    for (;;) {
      prev2 = QuoteThreading.children[prev.fullID];
      if (!prev2?.length) { break; }
      prev = prev2[prev2.length-1];
    }
    return prev;
  },

  insertBefore(children, i, post, nodes, descendants, order) {
    const next = children[i];
    for (const x of descendants) { order.before(order[next.ID], order[x.ID]); }
    children.splice(i, 0, post);
    $.before(next.nodes.root, nodes);
  },

  insertAfter(children, post, parent, nodes, descendants, order, threadContainer) {
    const prev = QuoteThreading.findLastDescendantParent(parent);
    for (let k = descendants.length - 1; k >= 0; k--) { order.after(order[prev.ID], order[descendants[k].ID]); }
    children.push(post);
    $.add(threadContainer, nodes);
  },

  insert(post) {
    let parent;
    if (!(
      Conf['Thread Quotes'] &&
      (parent = QuoteThreading.parent[post.fullID]) &&
      !QuoteThreading.inserted[post.fullID]
    )) { return false; }

    const descendants = QuoteThreading.descendants(post);
    if (!Unread.posts.has(parent.ID) && QuoteThreading.hasUnread(descendants)) {
      QuoteThreading.threadNewLink.hidden = false;
      return false;
    }

    const {order} = Unread;
    const children = (QuoteThreading.children[parent.fullID] || (QuoteThreading.children[parent.fullID] = []));
    const threadContainer = parent.nodes.threadContainer || $.el('div', {className: 'threadContainer'});
    const nodes = [post.nodes.root];
    if (post.nodes.threadContainer) { nodes.push(post.nodes.threadContainer); }

    const i = QuoteThreading.findInsertIndex(children, post);
    if (i !== children.length) {
      QuoteThreading.insertBefore(children, i, post, nodes, descendants, order);
    } else {
      QuoteThreading.insertAfter(children, post, parent, nodes, descendants, order, threadContainer);
    }

    QuoteThreading.inserted[post.fullID] = true;

    if (!parent.nodes.threadContainer) {
      parent.nodes.threadContainer = threadContainer;
      $.addClass(parent.nodes.root, 'threadOP');
      $.after(parent.nodes.root, threadContainer);
    }

    return true;
  },

  rethread() {
    if (!QuoteThreading.ready) { return; }
    const {thread} = QuoteThreading;
    const {posts} = thread;

    QuoteThreading.threadNewLink.hidden = true;

    if (Conf['Thread Quotes']) {
      posts.forEach(QuoteThreading.insert);
    } else {
      const nodes = [];
      Unread.order = new RandomAccessList();
      QuoteThreading.inserted = dict();
      posts.forEach(function(post) {
        if (post.isFetchedQuote) { return; }
        Unread.order.push(post);
        if (post.isReply) { nodes.push(post.nodes.root); }
        if (QuoteThreading.children[post.fullID]) {
          delete QuoteThreading.children[post.fullID];
          $.rmClass(post.nodes.root, 'threadOP');
          $.rm(post.nodes.threadContainer);
          delete post.nodes.threadContainer;
        }
      });
      $.add(thread.nodes.root, nodes);
    }

    Unread.position = Unread.order.first;
    Unread.updatePosition();
    Unread.setLine(true);
    Unread.read();
    Unread.update();
  },
};
export default QuoteThreading;

