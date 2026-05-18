import Callbacks from "../classes/Callbacks";
import Get from "../General/Get";
import { g, Conf } from "../globals/globals";
import $ from "../platform/$";

interface IDPostCountType {
  thread?: any;
  init(): void;
  node(this: any): void;
  count(this: HTMLElement): void;
}

const IDPostCount: IDPostCountType = {
  init() {
    if ((g.VIEW !== 'thread') || !Conf['Count Posts by ID']) { return; }
    Callbacks.Thread.push({
      name: 'Count Posts by ID',
      cb(this: any) { IDPostCount.thread = this; }
    });
    Callbacks.Post.push({
      name: 'Count Posts by ID',
      cb:   this.node
    });
  },

  node(this: any) {
    if (this.nodes.uniqueID && (this.thread === IDPostCount.thread)) {
      $.on(this.nodes.uniqueID, 'mouseover', IDPostCount.count);
    }
  },

  count(this: HTMLElement) {
    const {uniqueID} = Get.postFromNode(this).info;
    let n = 0;
    IDPostCount.thread.posts.forEach(function(post: any) {
      if (post.info.uniqueID === uniqueID) { n++; }
    });
    this.title = `${n} post${n === 1 ? '' : 's'} by this ID`;
  }
};

export default IDPostCount;
