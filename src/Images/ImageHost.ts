import Callbacks from "../classes/Callbacks";
import { Conf, g } from "../globals/globals";
import $$ from "../platform/$$";

interface ImageHostType {
  useFaster?: boolean;
  init(): void;
  suggestions: string[];
  host(): string;
  flashHost(): string;
  thumbHost(): string;
  test(hostname: string): boolean;
  regex: RegExp;
  node(this: any): void;
  fixLinks(links: HTMLAnchorElement[]): void;
}

const ImageHost: ImageHostType = {
  useFaster: undefined,
  suggestions: ['i.4cdn.org', 'is2.4chan.org'],
  regex: /^is\d*\.4chan(?:nel)?\.org$/,

  init() {
    if ((!(this.useFaster = /\S/.test(Conf['fourchanImageHost']))) || (g.SITE.software !== 'yotsuba') || !['index', 'thread'].includes(g.VIEW)) { return; }
    Callbacks.Post.push({
      name: 'Image Host Rewriting',
      cb:   this.node
    });
  },

  host() {
    return Conf['fourchanImageHost'].trim() || 'i.4cdn.org';
  },

  flashHost() {
    return 'i.4cdn.org';
  },

  thumbHost() {
    return 'i.4cdn.org';
  },

  test(hostname: string): boolean {
    return (hostname === 'i.4cdn.org') || ImageHost.regex.test(hostname);
  },

  node(this: any) {
    if (this.isClone) { return; }
    const host = ImageHost.host();
    if (this.file && ImageHost.test(this.file.url.split('/')[2]) && !/\.swf$/.test(this.file.url)) {
      this.file.link.hostname = host;
      if (this.file.thumbLink) { this.file.thumbLink.hostname = host; }
      this.file.url = this.file.link.href;
    }
    ImageHost.fixLinks($$('a', this.nodes.comment) as HTMLAnchorElement[]);
  },

  fixLinks(links: HTMLAnchorElement[]) {
    for (const link of links) {
      if (ImageHost.test(link.hostname) && !/\.swf$/.test(link.pathname)) {
        const host = ImageHost.host();
        if (link.hostname !== host) { link.hostname = host; }
      }
    }
  }
};

export default ImageHost;
