import Callbacks from "../classes/Callbacks";
import Header from "../General/Header";
import UI from "../General/UI";
import { Conf, doc, g } from "../globals/globals";
import $ from "../platform/$";

interface FappeTymeType {
  nodes: Record<string, HTMLInputElement>;
  enabled: Record<string, boolean>;
  init(): void;
  node(this: any): void;
  catalogNode(this: any): void;
  set(type: string, enabled: boolean): void;
  toggle(type: string): void;
}

const FappeTyme: FappeTymeType = {
  nodes: {},
  enabled: {},

  init() {
    if ((!Conf['Fappe Tyme'] && !Conf['Werk Tyme']) || !['index', 'thread', 'archive'].includes(g.VIEW)) { return; }

    this.nodes = {};
    this.enabled = {
      fappe: false,
      werk:  Conf['werk']
    };

    for (const type of ["Fappe", "Werk"]) {
      if (Conf[`${type} Tyme`]) {
        const lc = type.toLowerCase();
        const el = UI.checkbox(lc, `${type} Tyme`, false) as HTMLElement;
        el.title = `${type} Tyme`;

        this.nodes[lc] = el.firstElementChild as HTMLInputElement;
        if (Conf[lc]) { this.set(lc, true); }
        $.on(this.nodes[lc], 'change', this.toggle.bind(this, lc));

        Header.menu.addEntry({
          el,
          order: 97
        });

        const indicator = $.el('span', {
          className: 'indicator',
          textContent: type[0],
          title: `${type} Tyme active`
        });
        $.on(indicator, 'click', function(this: HTMLElement) {
          const check = $.getOwn(FappeTyme.nodes, (this.parentNode as HTMLElement).id.replace('shortcut-', '')) as HTMLInputElement;
          check.checked = !check.checked;
          $.event('change', null, check);
        });
        Header.addShortcut(lc, indicator, 410);
      }
    }

    if (Conf['Werk Tyme']) {
      $.sync('werk', this.set.bind(this, 'werk'));
    }

    Callbacks.Post.push({
      name: 'Fappe Tyme',
      cb:   this.node
    });

    Callbacks.CatalogThread.push({
      name: 'Werk Tyme',
      cb:   this.catalogNode
    });
  },

  node(this: any) {
    this.nodes.root.classList.toggle('noFile', !this.files.length);
  },

  catalogNode(this: any) {
    const file = this.thread.OP.files[0];
    if (!file) { return; }
    const filename = $.el('div', {
      textContent: file.name,
      className:   'werkTyme-filename'
    });
    $.add(this.nodes.thumb.parentNode, filename);
  },

  set(type: string, enabled: boolean) {
    this.enabled[type] = (this.nodes[type].checked = enabled);
    const action = enabled ? 'addClass' : 'rmClass';
    $[action](doc, `${type}Tyme`);
  },

  toggle(type: string) {
    this.set(type, !this.enabled[type]);
    if (type === 'werk') {
      ($.cb as any).checked.call(this.nodes[type]);
    }
  }
};

export default FappeTyme;
