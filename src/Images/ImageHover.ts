import Callbacks from "../classes/Callbacks";
import UIState from "../globals/UIState";
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
  resolveHoverElement(post: any, file: any, error: any): HTMLImageElement | HTMLVideoElement;
  setupVideoHover(el: HTMLVideoElement, root: HTMLElement): void;
  computeHoverDimensions(file: any): { width?: number; height?: number };
  error(post: any, file: any): (this: HTMLImageElement | HTMLVideoElement) => void;
}

const ImageHover: ImageHoverType = {
  init() {
    const view = g.VIEW;
    if (!view || !['index', 'thread'].includes(view)) { return; }
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
      if (!doc.contains(this)) { return; }
      const { isVideo } = file;
      if (file.isExpanding || file.isExpanded || (g.SITE as any).isThumbExpanded?.(file)) { return; }
      const error = ImageHover.error(post, file);
      const el = ImageHover.resolveHoverElement(post, file, error);

      if (Conf['Restart when Opened']) {
        ImageCommon.rewind(el);
        ImageCommon.rewind(this);
      }
      el.id = 'ihover';
      $.add(UIState.hoverUI, el);
      if (isVideo) { ImageHover.setupVideoHover(el as HTMLVideoElement, this); }

      const { width, height } = ImageHover.computeHoverDimensions(file);
      if (file.dimensions && (width == null || height == null)) { return; }
      if (width != null && height != null) {
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

  resolveHoverElement(post: any, file: any, error: any): HTMLImageElement | HTMLVideoElement {
    const { isVideo } = file;
    if (ImageCommon.cache?.dataset.fileID === `${post.fullID}.${file.index}`) {
      const el = ImageCommon.popCache();
      $.on(el, 'error', error);
      return el;
    }
    const el = $.el((isVideo ? 'video' : 'img')) as HTMLImageElement | HTMLVideoElement;
    el.dataset.fileID = `${post.fullID}.${file.index}`;
    $.on(el, 'error', error);
    el.src = file.url;
    return el;
  },

  setupVideoHover(video: HTMLVideoElement, root: HTMLElement) {
    video.loop     = true;
    video.controls = false;
    Volume.setup(video);
    if (Conf['Autoplay']) {
      video.play();
      if (root.nodeName === 'VIDEO') {
        (root as HTMLVideoElement).currentTime = video.currentTime;
      }
    }
  },

  computeHoverDimensions(file: any): { width?: number; height?: number } {
    if (!file.dimensions) { return {}; }
    const dims = file.dimensions.split('x').map((x: string) => +x);
    let width = dims[0];
    let height = dims[1];
    if (width == null || height == null) { return { width, height }; }
    const maxWidth = doc.clientWidth;
    const maxHeight = doc.clientHeight - (UI.hover as any).padding;
    const scale = Math.min(1, maxWidth / width, maxHeight / height);
    width *= scale;
    height *= scale;
    return { width, height };
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
