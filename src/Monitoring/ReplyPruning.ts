import Callbacks from "../classes/Callbacks";
import Header from "../General/Header";
import UI from "../General/UI";
import { g, Conf, E, d } from "../globals/globals";
import $ from "../platform/$";
import QuoteThreading from "../Quotelinks/QuoteThreading";

interface ReplyPruningType {
  container: DocumentFragment;
  summary: HTMLElement;
  inputs: {
    enabled: HTMLInputElement;
    replies: HTMLInputElement;
  };
  position: number;
  hidden: number;
  hiddenFiles: number;
  total: number;
  totalFiles: number;
  thread: any;
  active: boolean;
  init(): void;
  setEnabled(this: HTMLInputElement): void;
  showIfHidden(id: string): void;
  node(this: any): void;
  updateCount(e: Event): void;
  update(): void;
}

const ReplyPruning: ReplyPruningType = {
  container: null as any,
  summary: null as any,
  inputs: null as any,
  position: 0,
  hidden: 0,
  hiddenFiles: 0,
  total: 0,
  totalFiles: 0,
  thread: null,
  active: false,

  init() {
    if ((g.VIEW !== 'thread') || !Conf['Reply Pruning']) { return; }

    this.container = $.frag();

    this.summary = $.el('span', {
      hidden:    true,
      className: 'summary'
    });
    this.summary.style.cursor = 'pointer';
    $.on(this.summary, 'click', () => {
      this.inputs.enabled.checked = !this.inputs.enabled.checked;
      $.event('change', null, this.inputs.enabled);
    });

    const label = UI.checkbox('Prune Replies', 'Show Last', Conf['Prune All Threads']) as HTMLElement;
    const el = $.el('span',
      { title: 'Maximum number of replies to show.' },
      { innerHTML: " <input type=\"number\" name=\"Max Replies\" min=\"0\" step=\"1\" value=\"" + E(Conf["Max Replies"]) + "\" class=\"field\">" }
    );
    $.prepend(el, label);

    this.inputs = {
      enabled: label.firstElementChild as HTMLInputElement,
      replies: el.lastElementChild as HTMLInputElement
    };

    this.setEnabled.call(this.inputs.enabled);
    $.on(this.inputs.enabled, 'change', this.setEnabled);
    $.on(this.inputs.replies, 'change', $.cb.value);

    Header.menu.addEntry({
      el,
      order: 190
    });

    Callbacks.Thread.push({
      name: 'Reply Pruning',
      cb:   this.node
    });
  },

  setEnabled(this: HTMLInputElement) {
    const other = (QuoteThreading as any).input;
    if (this.checked && other?.checked) {
      other.checked = false;
      $.event('change', null, other);
    }
    ReplyPruning.active = this.checked;
  },

  showIfHidden(id: string) {
    if (ReplyPruning.container && $(`#${id}`, ReplyPruning.container as any)) {
      ReplyPruning.inputs.enabled.checked = false;
      $.event('change', null, ReplyPruning.inputs.enabled);
    }
  },

  node(this: any) {
    let middle: number;
    ReplyPruning.thread = this;

    if (this.isSticky) {
      ReplyPruning.active = (ReplyPruning.inputs.enabled.checked = true);
      if ((QuoteThreading as any).input) {
        // Disable Quote Threading for this thread but don't save the setting.
        Conf['Thread Quotes'] = ((QuoteThreading as any).input.checked = false);
      }
    }

    this.posts.forEach((post: any) => {
      if (post.isReply) {
        ReplyPruning.total++;
        if (post.file) { ReplyPruning.totalFiles++; }
      }
    });

    // If we're linked to a post that we would hide, don't hide the posts in the first place.
    if (
      ReplyPruning.active &&
      /^#p\d+$/.test(location.hash) &&
      (1 <= (middle = this.posts.keys.indexOf(location.hash.slice(2))) && middle < 1 + Math.max(ReplyPruning.total - +Conf["Max Replies"], 0))
    ) {
      ReplyPruning.active = (ReplyPruning.inputs.enabled.checked = false);
    }

    $.after(this.OP.nodes.root, ReplyPruning.summary);

    $.on(ReplyPruning.inputs.enabled, 'change', ReplyPruning.update);
    $.on(ReplyPruning.inputs.replies, 'change', ReplyPruning.update);
    $.on(d, 'ThreadUpdate', ReplyPruning.updateCount);
    $.on(d, 'ThreadUpdate', ReplyPruning.update);

    ReplyPruning.update();
  },

  updateCount(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail?.[404]) { return; }
    for (const fullID of detail?.newPosts || []) {
      ReplyPruning.total++;
      if (g.posts.get(fullID)?.file) { ReplyPruning.totalFiles++; }
    }
  },

  update() {
    let boardTop: number, node: Node | null, post: any;
    const hidden1 = ReplyPruning.hidden;
    const hidden2 = ReplyPruning.active ?
      Math.max(ReplyPruning.total - +Conf["Max Replies"], 0)
    :
      0;

    // Record position from bottom of document
    const oldPos = d.body.clientHeight - window.scrollY;

    const { posts } = ReplyPruning.thread;

    if (ReplyPruning.hidden < hidden2) {
      while ((ReplyPruning.hidden < hidden2) && (ReplyPruning.position < posts.keys.length)) {
        post = posts.get(posts.keys[ReplyPruning.position++]);
        if (post.isReply && !post.isFetchedQuote) {
          while ((node = ReplyPruning.summary.nextSibling) && (node !== post.nodes.root)) {
            $.add(ReplyPruning.container, node);
          }
          $.add(ReplyPruning.container, post.nodes.root);
          ReplyPruning.hidden++;
          if (post.file) { ReplyPruning.hiddenFiles++; }
        }
      }
    } else if (ReplyPruning.hidden > hidden2) {
      const frag = $.frag();
      while ((ReplyPruning.hidden > hidden2) && (ReplyPruning.position > 0)) {
        post = posts.get(posts.keys[--ReplyPruning.position]);
        if (post.isReply && !post.isFetchedQuote) {
          while ((node = ReplyPruning.container.lastChild) && (node !== post.nodes.root)) {
            $.prepend(frag, node);
          }
          $.prepend(frag, post.nodes.root);
          ReplyPruning.hidden--;
          if (post.file) { ReplyPruning.hiddenFiles--; }
        }
      }
      $.after(ReplyPruning.summary, frag);
      $.event('PostsInserted', null, ReplyPruning.summary.parentNode as HTMLElement);
    }

    ReplyPruning.summary.textContent = ReplyPruning.active ?
      (g.SITE.Build as any).summaryText('+', ReplyPruning.hidden, ReplyPruning.hiddenFiles)
    :
      (g.SITE.Build as any).summaryText('-', ReplyPruning.total, ReplyPruning.totalFiles);
    ReplyPruning.summary.hidden = (ReplyPruning.total <= +Conf["Max Replies"]);

    // Maintain position in thread when posts are added/removed above
    if ((hidden1 !== hidden2) && ((boardTop = Header.getTopOf($('.board') as HTMLElement)) < 0)) {
      window.scrollBy(0, Math.max(d.body.clientHeight - oldPos, window.scrollY + boardTop) - window.scrollY);
    }
  }
};

export default ReplyPruning;
