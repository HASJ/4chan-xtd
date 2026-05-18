import { g, Conf, d } from "../globals/globals";
import $ from "../platform/$";
import Menu from "./Menu";

interface CopyTextLinkType {
  text: string;
  init(): void;
  copy(this: HTMLAnchorElement): void;
}

const CopyTextLink: CopyTextLinkType = {
  text: '',

  init() {
    if (!['index', 'thread'].includes(g.VIEW!) || !Conf['Menu'] || !Conf['Copy Text Link']) { return; }

    const a = $.el('a', {
      className: 'copy-text-link',
      href: 'javascript:;',
      textContent: 'Copy Text'
    }) as HTMLAnchorElement;
    $.on(a, 'click', this.copy.bind(this));

    Menu.menu.addEntry({
      el: a,
      order: 12,
      open(post: any) {
        CopyTextLink.text = (post.origin || post).commentOrig();
        return true;
      }
    });
  },

  copy() {
    const el = $.el('textarea', {
      className: 'copy-text-element',
      value: this.text
    }) as HTMLTextAreaElement;
    $.add(d.body, el);
    el.select();
    try {
      d.execCommand('copy');
    } catch (error) {}
    $.rm(el);
  }
};

export default CopyTextLink;
