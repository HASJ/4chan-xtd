import Callbacks from "../classes/Callbacks";
import { Conf, g, E } from "../globals/globals";
import $ from "../platform/$";
import $$ from "../platform/$$";
import Icon from "../Icons/icon";

interface PostJumperType {
  buttons?: HTMLElement;
  init(): void;
  node(this: any): void;
  addButtons(post: any, type: string): void;
  addListeners(buttons: HTMLElement): void;
  buttonClick(this: HTMLElement): void;
  find(jumper: HTMLElement, dir: number): HTMLElement | null;
  makeButtons(): HTMLElement;
  scroll(fromJumper: HTMLElement, toJumper: HTMLElement): void;
}

const PostJumper: PostJumperType = {
  init() {
    if (!Conf['Unique ID and Capcode Navigation'] || !['index', 'thread'].includes(g.VIEW!)) { return; }

    this.buttons = this.makeButtons();
    Icon.set(this.buttons.firstChild as HTMLElement, 'arrowUpLong');
    Icon.set(this.buttons.lastChild as HTMLElement, 'arrowDownLong');

    Callbacks.Post.push({
      name: 'Post Jumper',
      cb:   this.node
    });
  },

  node(this: any) {
    if (this.isClone) {
      for (const buttons of $$('.postJumper', this.nodes.info) as HTMLElement[]) {
        PostJumper.addListeners(buttons);
      }
      return;
    }

    if (this.nodes.uniqueIDRoot) {
      PostJumper.addButtons(this,'uniqueID');
    }

    if (this.nodes.capcode) {
      PostJumper.addButtons(this,'capcode');
    }
  },

  addButtons(post, type) {
    const value = post.info[type];
    const buttons = PostJumper.buttons!.cloneNode(true) as HTMLElement;
    $.extend(buttons.dataset, {type, value});
    $.after(post.nodes[type+(type === 'capcode' ? '' : 'Root')], buttons);
    PostJumper.addListeners(buttons);
  },

  addListeners(buttons) {
    $.on(buttons.firstChild as HTMLElement, 'click', PostJumper.buttonClick);
    $.on(buttons.lastChild as HTMLElement, 'click', PostJumper.buttonClick);
  },

  buttonClick(this: HTMLElement) {
    let toJumper;
    const dir = $.hasClass(this, 'prev') ? -1 : 1;
    if (toJumper = PostJumper.find(this.parentNode as HTMLElement, dir)) {
      PostJumper.scroll(this.parentNode as HTMLElement, toJumper);
    }
  },

  find(jumper, dir) {
    const {type, value} = jumper.dataset;
    const xpath = `span[contains(@class,"postJumper") and @data-value="${value}" and @data-type="${type}"]`;
    const axis = dir < 0 ? 'preceding' : 'following';
    let jumper2: HTMLElement | null = jumper;
    while (jumper2 = $.x(`${axis}::${xpath}`, jumper2) as HTMLElement | null) {
      if (jumper2.getBoundingClientRect().height) { return jumper2; }
    }
    if (jumper2 = $.x(`(//${xpath})[${dir < 0 ? 'last()' : '1'}]`) as HTMLElement | null) {
      if (jumper2.getBoundingClientRect().height) { return jumper2; }
    }
    while ((jumper2 = $.x(`${axis}::${xpath}`, jumper2) as HTMLElement | null) && (jumper2 !== jumper)) {
      if (jumper2.getBoundingClientRect().height) { return jumper2; }
    }
    return null;
  },

  makeButtons() {
    const charPrev = '\u23EB';
    const charNext = '\u23EC';
    const classPrev = 'prev';
    const classNext = 'next';
    const span = $.el('span', {className: 'postJumper'}) as HTMLSpanElement;
    $.extend(span, {innerHTML: "<a href=\"javascript:;\" class=\"" + E(classPrev) + "\">" + E(charPrev) + "</a><a href=\"javascript:;\" class=\"" + E(classNext) + "\">" + E(charNext) + "</a>"});
    return span;
  },

  scroll(fromJumper, toJumper) {
    const prevPos = fromJumper.getBoundingClientRect().top;
    const destPos = toJumper.getBoundingClientRect().top;
    window.scrollBy(0, destPos-prevPos);
  }
};

export default PostJumper;
