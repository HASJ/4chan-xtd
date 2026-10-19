import Callbacks from '../classes/Callbacks';
import ThreadHiding from '../Filtering/ThreadHiding';
import { Conf, g } from '../globals/globals';
import Icon from '../Icons/icon';
import $ from '../platform/$';
import copyText from '../platform/copyText';

const CopyThreadURL: any = {
  init() {
    if (g.VIEW !== 'index' || !Conf.Menu || !Conf['Copy Thread URL Button']) { return; }

    this.button = $.el('a', {
      ariaLabel: 'Copy thread URL',
      className: 'copy-thread-url-button',
      href: 'javascript:;',
      title: 'Copy thread URL',
    });
    Icon.set(this.button, 'clipboard');
    return Callbacks.CatalogThread.push({
      name: 'Copy Thread URL Button',
      cb: this.catalogNode,
    });
  },

  catalogNode() {
    const button = CopyThreadURL.button.cloneNode(true);
    $.on(button, 'click', () => {
      const link = $('.catalog-link', this.nodes.root) as HTMLAnchorElement | null;
      if (!link || !copyText(link.href) || !Conf['Hide Thread After Copying']) { return; }
      ThreadHiding.hide(this.thread, undefined, 'Hidden manually');
      ThreadHiding.saveHiddenState(this.thread);
    });
    return $.after(this.nodes.icons, button);
  },
};

export default CopyThreadURL;
