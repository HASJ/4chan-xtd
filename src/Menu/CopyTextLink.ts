import { g, Conf } from "../globals/globals";
import copyText from "../platform/copyText";
import $ from "../platform/$";
import Menu from "./Menu";

const CopyTextLink: any = {
  init() {
    if (!(g.VIEW && ['index', 'thread'].includes(g.VIEW)) || !Conf['Menu'] || !Conf['Copy Text Link']) { return; }

    const a = $.el('a', {
      className: 'copy-text-link',
      href: 'javascript:;',
      textContent: 'Copy Text'
    }
    );
    $.on(a, 'click', CopyTextLink.copy);

    return Menu.menu.addEntry({
      el: a,
      order: 12,
      open(post) {
        CopyTextLink.text = (post.origin || post).commentOrig();
        return true;
      }
    });
  },

  copy() {
    return copyText(CopyTextLink.text);
  }
};
export default CopyTextLink;
