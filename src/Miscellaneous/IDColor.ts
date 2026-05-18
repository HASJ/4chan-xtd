import Callbacks from "../classes/Callbacks";
import { g, Conf } from "../globals/globals";
import $ from "../platform/$";
import { dict } from "../platform/helpers";

interface IDColorType {
  ids: Record<string, any>;
  init(): void;
  node(this: any): void;
  compute(uid: string): any;
}

const IDColor: IDColorType = {
  ids: dict(),

  init() {
    if (!['index', 'thread'].includes(g.VIEW!) || !Conf['Color User IDs']) { return; }
    this.ids['Heaven'] = [0, 0, 0, '#fff'];

    Callbacks.Post.push({
      name: 'Color User IDs',
      cb:   this.node
    });
  },

  node(this: any) {
    let span, uid;
    if (this.isClone || !((uid = this.info.uniqueID) && (span = this.nodes.uniqueID))) { return; }

    const rgb = IDColor.ids[uid] || IDColor.compute(uid);

    // Style the damn node.
    const {style} = span;
    style.color = rgb[3];
    style.backgroundColor = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    $.addClass(span, 'painted');
  },

  compute(uid) {
    // Convert chars to integers, bitshift and math to create a larger integer
    // Create a nice string of binary
    const hash = g.SITE!.uidColor ? g.SITE!.uidColor(uid) : parseInt(uid, 16);

    // Convert binary string to numerical values with bitshift and '&' truncation.
    const rgb = [
      (hash >> 16) & 0xFF,
      (hash >> 8)  & 0xFF,
      hash & 0xFF
    ] as any;

    // Weight color luminance values, assign a font color that should be readable. 
    rgb.push($.luma(rgb) > 125 ?
      '#000'
    :
      '#fff'
    );

    // Cache.
    return this.ids[uid] = rgb;
  }
};

export default IDColor;
