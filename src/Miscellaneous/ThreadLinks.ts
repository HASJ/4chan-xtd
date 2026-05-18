import Callbacks from "../classes/Callbacks";
import { g, Conf } from "../globals/globals";

interface ThreadLinksType {
  init(): void;
  node(this: any): void;
  catalogNode(this: any): void;
  process(link: HTMLAnchorElement): void;
}

const ThreadLinks: ThreadLinksType = {
  init() {
    if ((g.VIEW !== 'index') || !Conf['Open Threads in New Tab']) { return; }

    Callbacks.Post.push({
      name: 'Thread Links',
      cb:   this.node
    });
    Callbacks.CatalogThread.push({
      name: 'Thread Links',
      cb:   this.catalogNode
    });
  },

  node(this: any) {
    if (this.isReply || this.isClone) { return; }
    ThreadLinks.process(this.nodes.reply);
  },

  catalogNode(this: any) {
    ThreadLinks.process(this.nodes.thumb.parentNode);
  },

  process(link) {
    link.target = '_blank';
  }
};

export default ThreadLinks;
