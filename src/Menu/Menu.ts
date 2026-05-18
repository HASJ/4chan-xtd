import Callbacks from "../classes/Callbacks";
import UI from "../General/UI";
import { g, Conf } from "../globals/globals";
import $ from "../platform/$";
import Icon from "../Icons/icon";

interface MenuType {
  button: HTMLAnchorElement;
  menu: any;
  init(): void;
  node(this: any): void;
  catalogNode(this: any): void;
  makeButton(post: any, button?: HTMLAnchorElement): HTMLAnchorElement;
}

const Menu: MenuType = {
  button: null as any,
  menu: null,

  init() {
    if (!['index', 'thread'].includes(g.VIEW!) || !Conf['Menu']) { return; }

    this.button = $.el('a', {
      className: 'menu-button',
      href:      'javascript:;'
    }) as HTMLAnchorElement;

    Icon.set(this.button, 'caretDown');

    this.menu = new UI.Menu('post');
    Callbacks.Post.push({
      name: 'Menu',
      cb:   this.node
    });

    Callbacks.CatalogThread.push({
      name: 'Menu',
      cb:   this.catalogNode
    });
  },

  node(this: any) {
    if (this.isClone) {
      const button = $('.menu-button', this.nodes.info) as HTMLAnchorElement;
      if (button) {
        $.rmClass(button, 'active');
        $.rm($('.dialog', this.nodes.info)!);
        Menu.makeButton(this, button);
      }
      return;
    }
    $.add(this.nodes.info, Menu.makeButton(this));
  },

  catalogNode(this: any) {
    $.after(this.nodes.icons, Menu.makeButton(this.thread.OP));
  },

  makeButton(post, button) {
    if (!button) { button = Menu.button.cloneNode(true) as HTMLAnchorElement; }
    $.on(button, 'click', function(e) {
      Menu.menu.toggle(e, this, post);
    });
    return button;
  }
};

export default Menu;
