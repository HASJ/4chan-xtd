import Callbacks from "../classes/Callbacks";
import DataBoard from "../classes/DataBoard";
import Notice from "../classes/Notice";
import Get from "../General/Get";
import Header from "../General/Header";
import { Conf, d, doc, g } from "../globals/globals";
import Menu from "../Menu/Menu";
import ExpandComment from "../Miscellaneous/ExpandComment";
import $ from "../platform/$";
import $$ from "../platform/$$";
import { debounce } from "../platform/helpers";
import PostRedirect from "../Posting/PostRedirect";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
var QuoteYou = {
  init() {
    if (!Conf['Remember Your Posts']) { return; }

    this.db = new DataBoard('yourPosts');
    $.sync('Remember Your Posts', enabled => Conf['Remember Your Posts'] = enabled);
    $.on(d, 'QRPostSuccessful', function(e) {
      const cb = PostRedirect.delay();
      return $.get('Remember Your Posts', Conf['Remember Your Posts'], function(items) {
        if (!items['Remember Your Posts']) { return; }
        const {boardID, threadID, postID} = e.detail;
        return QuoteYou.db.set({boardID, threadID, postID, val: true}, cb);
      });
    });

    if (!['index', 'thread', 'archive'].includes(g.VIEW)) { return; }

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
    }
    );
    Callbacks.Post.push({
      name: 'Mark Quotes of You',
      cb:   this.node
    });

    QuoteYou.menu.init();

    QuoteYou.scrollMarkerContainer = $.el('div', { classList: 'scroll-marker-container' });
    doc.insertAdjacentElement('afterbegin', QuoteYou.scrollMarkerContainer);
    $.on( QuoteYou.scrollMarkerContainer, 'click', (e) => {
      const { postId } = /** @type {HTMLElement} */ (e.target).dataset;
      if (postId) Header.scrollTo(g.posts[postId].nodes.root);
    })
    // $.on(d, 'PostsInserted', QuoteYou.markScroll);
    // $.on(d, 'PostsRemoved', QuoteYou.markScroll);
    $.on(window, 'resize', QuoteYou.markScroll);
    new ResizeObserver(QuoteYou.markScroll).observe(doc)
  },

  isYou(post) {
    return !!QuoteYou.db?.get({
      boardID:  post.boardID,
      threadID: post.threadID,
      postID:   post.ID
    });
  },

  node() {
    if (this.isClone) { return; }

    if (QuoteYou.isYou(this)) {
      $.addClass(this.nodes.root, 'yourPost');
      QuoteYou.markScroll();
    }

    // Stop there if there's no quotes in that post.
    if (!this.quotes.length) { return; }

    for (var quotelink of this.nodes.quotelinks) {
      if (QuoteYou.db.get(Get.postDataFromLink(quotelink))) {
        if (Conf['Mark Quotes of You']) { $.add(quotelink, QuoteYou.mark.cloneNode(true)); }
        $.addClass(quotelink, 'you');
        $.addClass(this.nodes.root, 'quotesYou');
      }
    }
  },

  menu: {
    init() {
      const label = $.el('label',
        {className: 'toggle-you'}
      ,
        {innerHTML: '<input type="checkbox"> You'});
      const input = $('input', label);
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

    toggle() {
      const {post} = QuoteYou.menu;
      const data = {boardID: post.board.ID, threadID: post.thread.ID, postID: post.ID, val: true};
      if (this.checked) {
        QuoteYou.db.set(data);
      } else {
        QuoteYou.db.delete(data);
      }
      for (var clone of [post].concat(post.clones)) {
        clone.nodes.root.classList.toggle('yourPost', this.checked);
      }
      for (var quotelink of Get.allQuotelinksLinkingTo(post)) {
        if (this.checked) {
          if (Conf['Mark Quotes of You']) { $.add(quotelink, QuoteYou.mark.cloneNode(true)); }
        } else {
          $.rm($('.qmark-you', quotelink));
        }
        quotelink.classList.toggle('you', this.checked);
        if ($.hasClass(quotelink, 'quotelink')) {
          var quoter = Get.postFromNode(quotelink).nodes.root;
          quoter.classList.toggle('quotesYou', !!$('.quotelink.you', quoter));
        }
      }
      QuoteYou.markScroll();
    }
  },

  markScroll: debounce(100, () => {
    // Remove previous
    QuoteYou.scrollMarkerContainer.innerText = '';

    g.posts?.forEach((post) => {
      const postEl = post.nodes.root;
      let isReply = false;
      if ($.hasClass(postEl, 'quotesYou')) {
        isReply = true;
      } else if (!$.hasClass(postEl, 'yourPost')) {
        return;
      }

      const postPosition = postEl.getBoundingClientRect();
      const top = (((postPosition.top + window.scrollY) / doc.scrollHeight) * 100).toFixed(1);
      const height = Math.max(1, (postPosition.height / doc.scrollHeight) * 100).toFixed(1);

      const marker = $.el('div', {
        classList: `post-scroll-marker ${isReply ? 'reply' : 'you'}-scroll-marker`,
        ariaHidden: true,
      });
      marker.style.top = `${top}vh`;
      marker.style.height = `${height}vh`;
      marker.dataset.postId = `${post.boardID}.${post.ID}`;

      $.add(QuoteYou.scrollMarkerContainer, marker);
    })
  }, false),

  cb: {
    seek(type) {
      let highlighted, post;
      let result;
      const {highlight} = g.SITE.classes;
      if (highlighted = $(`.${highlight}`)) { $.rmClass(highlighted, highlight); }

      if (!QuoteYou.lastRead || !doc.contains(QuoteYou.lastRead) || !$.hasClass(QuoteYou.lastRead, 'quotesYou')) {
        if (!(post = (QuoteYou.lastRead = $('.quotesYou')))) {
          new Notice('warning', 'No posts are currently quoting you, loser.', 20);
          return;
        }
        if (QuoteYou.cb.scroll(post)) { return; }
      } else {
        post = QuoteYou.lastRead;
      }

      const str = `${type}::div[contains(@class,'quotesYou')]`;

      while (post = (result = $.X(str, post)).snapshotItem(type === 'preceding' ? result.snapshotLength - 1 : 0)) {
        if (QuoteYou.cb.scroll(post)) { return; }
      }

      const posts = $$('.quotesYou');
      return QuoteYou.cb.scroll(posts[type === 'following' ? 0 : posts.length - 1]);
    },

    scroll(root) {
      const post = Get.postFromRoot(root);
      if (!post.nodes.post.getBoundingClientRect().height) {
        return false;
      } else {
        QuoteYou.lastRead = root;
        location.href = Get.url('post', post);
        Header.scrollTo(post.nodes.post);
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
