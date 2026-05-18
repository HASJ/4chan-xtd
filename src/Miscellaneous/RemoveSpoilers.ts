import Callbacks from "../classes/Callbacks";
import { Conf, doc, g } from "../globals/globals";
import $ from "../platform/$";
import $$ from "../platform/$$";

interface RemoveSpoilersType {
  init(): void;
  node(this: any): void;
  unspoiler(el: HTMLElement | null): void;
}

const RemoveSpoilers: RemoveSpoilersType = {
  init() {
    if (Conf['Reveal Spoilers']) {
      $.addClass(doc, 'reveal-spoilers');
    }

    if (!Conf['Remove Spoilers']) { return; }

    Callbacks.Post.push({
      name: 'Reveal Spoilers',
      cb:   this.node
    });

    if (g.VIEW === 'archive') {
      $.ready(() => RemoveSpoilers.unspoiler($.id('arc-list')));
    }
  },

  node(this: any) {
    RemoveSpoilers.unspoiler(this.nodes.comment);
  },

  unspoiler(el) {
    if (!el) { return; }
    const spoilers = $$(g.SITE!.selectors.spoiler, el) as HTMLElement[];
    for (const spoiler of spoilers) {
      const span = $.el('span', {className: 'removed-spoiler'}) as HTMLSpanElement;
      $.replace(spoiler, span);
      $.add(span, [...spoiler.childNodes]);
    }
  }
};

export default RemoveSpoilers;
