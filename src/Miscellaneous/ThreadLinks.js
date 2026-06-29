// @ts-nocheck
import Callbacks from "../classes/Callbacks";
import { g, Conf } from "../globals/globals";

var ThreadLinks = {
  init() {
    if ((g.VIEW !== 'index') || !Conf['Open Threads in New Tab']) { return; }

    Callbacks.Post.push({
      name: 'Thread Links',
      cb:   this.node
    });
    return Callbacks.CatalogThread.push({
      name: 'Thread Links',
      cb:   this.catalogNode
    });
  },

  node() {
    if (this.isReply || this.isClone) { return; }
    return ThreadLinks.process(this.nodes.reply);
  },

  catalogNode() {
    return ThreadLinks.process(this.nodes.thumb.parentNode);
  },

  process(link) {
    return link.target = '_blank';
  }
};
export default ThreadLinks;

