import Callbacks from "../classes/Callbacks";
import { g, Conf, d } from "../globals/globals";
import $ from "../platform/$";

interface MarkNewIPsType {
  ipCount: number;
  postCount: number;
  init(): void;
  node(this: any): void;
  onUpdate(e: Event): void;
  markNew(post: any, ipCount: number): void;
  markOld(post: any): void;
}

const MarkNewIPs: MarkNewIPsType = {
  ipCount: 0,
  postCount: 0,

  init() {
    if ((g.SITE.software !== 'yotsuba') || (g.VIEW !== 'thread') || !Conf['Mark New IPs']) { return; }
    Callbacks.Thread.push({
      name: 'Mark New IPs',
      cb:   this.node
    });
  },

  node(this: any) {
    MarkNewIPs.ipCount = this.ipCount;
    MarkNewIPs.postCount = this.posts.keys.length;
    $.on(d, 'ThreadUpdate', MarkNewIPs.onUpdate);
  },

  onUpdate(e: Event) {
    let fullID: string;
    const detail = (e as CustomEvent).detail;
    if (!detail) { return; }
    const { ipCount, postCount, newPosts, deletedPosts } = detail;
    if (ipCount == null) { return; }

    switch (ipCount - MarkNewIPs.ipCount) {
      case (postCount - MarkNewIPs.postCount) + deletedPosts.length: {
        let i = MarkNewIPs.ipCount;
        for (fullID of newPosts) {
          MarkNewIPs.markNew(g.posts.get(fullID), ++i);
        }
        break;
      }
      case -deletedPosts.length: {
        for (fullID of newPosts) {
          MarkNewIPs.markOld(g.posts.get(fullID));
        }
        break;
      }
    }
    MarkNewIPs.ipCount = ipCount;
    MarkNewIPs.postCount = postCount;
  },

  markNew(post: any, ipCount: number) {
    const suffix = ((Math.floor(ipCount / 10)) % 10) === 1 ?
      'th'
    :
      ['st', 'nd', 'rd'][(ipCount % 10) - 1] || 'th'; // fuck switches
    const counter = $.el('span', {
      className: 'ip-counter',
      textContent: `(${ipCount})`
    });
    post.nodes.nameBlock.title = `This is the ${ipCount}${suffix} IP in the thread.`;
    $.add(post.nodes.nameBlock, [$.tn(' '), counter]);
    $.addClass(post.nodes.root, 'new-ip');
  },

  markOld(post: any) {
    post.nodes.nameBlock.title = 'Not the first post from this IP.';
    $.addClass(post.nodes.root, 'old-ip');
  }
};

export default MarkNewIPs;
