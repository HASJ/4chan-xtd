import Callbacks from "../classes/Callbacks";
import Header from "../General/Header";
import UI from "../General/UI";
import { g, Conf, doc } from "../globals/globals";
import $ from "../platform/$";
import { SECOND } from "../platform/helpers";
import ImageCommon from "./ImageCommon";
import Volume from "./Volume";

interface ImageHoverType {
  init(): void;
  node(this: any): void;
  catalogNode(this: any): void;
  mouseover(post: any, file: any): (this: HTMLElement, e: MouseEvent) => void;
  error(post: any, file: any): (this: HTMLImageElement | HTMLVideoElement) => void;
}

const ImageHover: ImageHoverType = {
  init() {
    if (!['index', 'thread'].includes(g.VIEW)) { return; }
    if (Conf['Image Hover']) {
      Callbacks.Post.push({
        name: 'Image Hover',
        cb:   this.node
      });
    }
    if (Conf['Image Hover in Catalog']) {
      Callbacks.CatalogThread.push({
        name: 'Image Hover',
        cb:   this.catalogNode
      });
    }
  },

  node(this: any) {
    this.files.filter((file: any) => (file.isImage || file.isVideo) && file.thumb).map((file: any) =>
      $.on(file.thumb, 'mouseover', ImageHover.mouseover(this, file)));
  },

  catalogNode(this: any) {
    const file = this.thread.OP.files[0];
    if (!file || (!file.isImage && !file.isVideo)) { return; }
    $.on(this.nodes.thumb, 'mouseover', ImageHover.mouseover(this.thread.OP, file));
  },

  mouseover(post: any, file: any) {
    return function(this: HTMLElement, e: MouseEvent) {
      let el: HTMLImageElement | HTMLVideoElement, height: number | undefined, width: number | undefined;
      if (!doc.contains(this)) { return; }
      const { isVideo } = file;
      if (file.isExpanding || file.isExpanded || (g.SITE as any).isThumbExpanded?.(file)) { return; }
      const error = ImageHover.error(post, file);
      if (ImageCommon.cache?.dataset.fileID === `${post.fullID}.${file.index}`) {
        el = ImageCommon.popCache();
        $.on(el, 'error', error);
      } else {
        el = $.el((isVideo ? 'video' : 'img')) as HTMLImageElement | HTMLVideoElement;
        el.dataset.fileID = `${post.fullID}.${file.index}`;
        $.on(el, 'error', error);
        el.src = file.url;
      }

      if (Conf['Restart when Opened']) {
        ImageCommon.rewind(el);
        ImageCommon.rewind(this);
      }
      el.id = 'ihover';
      $.add(Header.hover, el);
      if (isVideo) {
        const video = el as HTMLVideoElement;
        video.loop     = true;
        video.controls = false;
        Volume.setup(video);
        if (Conf['Autoplay']) {
          video.play();
          if (this.nodeName === 'VIDEO') {
            (this as HTMLVideoElement).currentTime = video.currentTime;
          }
        }
      }
      if (file.dimensions) {
        const dims = file.dimensions.split('x').map((x: string) => +x);
        width = dims[0];
        height = dims[1];
        const maxWidth = doc.clientWidth;
        const maxHeight = doc.clientHeight - (UI.hover as any).padding;
        const scale = Math.min(1, maxWidth / width, maxHeight / height);
        width *= scale;
        height *= scale;
        el.style.maxWidth  = `${width}px`;
        el.style.maxHeight = `${height}px`;
      }
      UI.hover({
        root: this,
        el,
        latestEvent: e,
        endEvents: 'mouseout click',
        height,
        width,
        noRemove: true,
        cb() {
          $.off(el, 'error', error);
          ImageCommon.pushCache(el);
          ImageCommon.pause(el);
          $.rm(el);
          el.removeAttribute('style');
        }
      } as any);
    };
  },

  error(post: any, file: any) {
    return function(this: HTMLImageElement | HTMLVideoElement) {
      if (ImageCommon.decodeError(this, file)) { return; }
      ImageCommon.error(this, post, file, 3 * SECOND, (URL) => {
        if (URL) {
          this.src = URL + (this.src === URL ? '?' + Date.now() : '');
        } else {
          $.rm(this);
        }
      });
    };
  }
};

export default ImageHover;
