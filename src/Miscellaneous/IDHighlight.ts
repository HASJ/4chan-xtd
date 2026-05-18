import Callbacks from "../classes/Callbacks";
import { g } from "../globals/globals";
import $ from "../platform/$";

interface IDHighlightType {
  init(): void;
  uniqueID: string | null;
  node(this: any): void;
  set(post: any): void;
  click(post: any): (this: HTMLElement) => void;
}

const IDHighlight: IDHighlightType = {
  uniqueID: null,

  init() {
    if (!['index', 'thread'].includes(g.VIEW!)) { return; }

    Callbacks.Post.push({
      name: 'Highlight by User ID',
      cb:   this.node
    });
  },

  node(this: any) {
    if (this.nodes.uniqueIDRoot) { $.on(this.nodes.uniqueIDRoot, 'click', IDHighlight.click(this)); }
    if (this.nodes.capcode) { $.on(this.nodes.capcode,      'click', IDHighlight.click(this)); }
    if (!this.isClone) { IDHighlight.set(this); }
  },

  set(post) {
    const match = (post.info.uniqueID || post.info.capcode) === IDHighlight.uniqueID;
    $[match ? 'addClass' : 'rmClass'](post.nodes.post, 'highlight');
  },

  click(post) {
    return function(this: HTMLElement) {
      const uniqueID = post.info.uniqueID || post.info.capcode;
      IDHighlight.uniqueID = IDHighlight.uniqueID === uniqueID ? null : uniqueID;
      g.posts!.forEach(IDHighlight.set);
    };
  }
};

export default IDHighlight;
