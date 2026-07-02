import Redirect from "../Archive/Redirect";
import Notice from "../classes/Notice";
import { g, Conf, d } from "../globals/globals";
import $ from "../platform/$";
import CrossOrigin from "../platform/CrossOrigin";
import ImageHost from "./ImageHost";
import Volume from "./Volume";

interface ImageCommonType {
  cache?: HTMLImageElement | HTMLVideoElement;
  pause(video: HTMLElement): void;
  rewind(el: HTMLElement): any;
  pushCache(el: HTMLImageElement | HTMLVideoElement): void;
  popCache(): HTMLImageElement | HTMLVideoElement;
  cacheError(this: any): void;
  decodeError(file: any, fileObj: any): boolean;
  isFromArchive(file: HTMLImageElement | HTMLVideoElement): boolean;
  error(file: HTMLImageElement | HTMLVideoElement, post: any, fileObj: any, delay: number | null | undefined, cb: (url: string | null) => void): any;
  onControls(e: any): boolean;
  download(this: HTMLAnchorElement, e: MouseEvent): any;
}

const ImageCommon: ImageCommonType = {
  cache: undefined,

  // Pause and mute video in preparation for removing the element from the document.
  pause(video: HTMLElement) {
    if (video.nodeName !== 'VIDEO') { return; }
    const v = video as HTMLVideoElement;
    v.pause();
    $.off(v, 'volumechange', Volume.change);
    v.muted = true;
  },

  rewind(el: HTMLElement) {
    if (el.nodeName === 'VIDEO') {
      const v = el as HTMLVideoElement;
      if (v.readyState >= v.HAVE_METADATA) { return v.currentTime = 0; }
    } else if (/\.gif$/.test((el as HTMLImageElement).src)) {
      const img = el as HTMLImageElement;
      return $.queueTask(() => img.src = img.src);
    }
  },

  pushCache(el: HTMLImageElement | HTMLVideoElement) {
    ImageCommon.cache = el;
    $.on(el, 'error', ImageCommon.cacheError);
  },

  popCache(): HTMLImageElement | HTMLVideoElement {
    const el = ImageCommon.cache!;
    $.off(el, 'error', ImageCommon.cacheError);
    delete ImageCommon.cache;
    return el;
  },

  cacheError(this: HTMLImageElement | HTMLVideoElement) {
    if (ImageCommon.cache === this) { delete ImageCommon.cache; }
  },

  decodeError(file: any, fileObj: any): boolean {
    let message: HTMLElement | null;
    if (file.error?.code !== MediaError.MEDIA_ERR_DECODE) { return false; }
    if (!(message = $('.warning', fileObj.thumb.parentNode))) {
      message = $.el('div', { className: 'warning' });
      $.after(fileObj.thumb, message);
    }
    message.textContent = 'Error: Corrupt or unplayable video';
    return true;
  },

  isFromArchive(file: HTMLImageElement | HTMLVideoElement): boolean {
    return (g.SITE.software === 'yotsuba') && !ImageHost.test(file.src.split('/')[2]);
  },

  error(file: HTMLImageElement | HTMLVideoElement, post: any, fileObj: any, delay: number | null | undefined, cb: (url: string | null) => void) {
    let timeoutID: number;
    const src = fileObj.url.split('/');
    let url: string | null = null;
    if ((g.SITE.software === 'yotsuba') && Conf['404 Redirect']) {
      url = Redirect.to('file', {
        boardID:  post.board.ID,
        filename: src[src.length - 1]
      } as any);
    }
    if (!url || !Redirect.securityCheck(url)) { url = null; }

    if ((post.isDead || fileObj.isDead) && !ImageCommon.isFromArchive(file)) { return cb(url); }

    if (delay != null) { timeoutID = setTimeout((() => cb(url)), delay) as any; }
    if (post.isDead || fileObj.isDead) { return; }
    const redirect = function() {
      if (!ImageCommon.isFromArchive(file)) {
        if (delay != null) { clearTimeout(timeoutID); }
        return cb(url);
      }
    };

    const threadJSON = g.SITE.urls.threadJSON?.(post);
    if (!threadJSON) { return; }
    const parseJSON = function(this: any, isArchiveURL?: boolean) {
      let needle: number, postObj: any;
      if (this.status === 404) {
        let archivedThreadJSON: string | undefined;
        if (!isArchiveURL && (archivedThreadJSON = g.SITE.urls.archivedThreadJSON?.(post))) {
          $.ajax(archivedThreadJSON, { onloadend() { return parseJSON.call(this, true); } });
        } else {
          post.kill(!post.isClone, fileObj.index);
        }
      }
      if (this.status !== 200) { return redirect(); }
      for (const p of this.response.posts) {
        if (p.no === post.ID) {
          postObj = p;
          break;
        }
      }
      if (!postObj || postObj.no !== post.ID) {
        post.kill();
        return redirect();
      } else if ((needle = fileObj.docIndex, g.SITE.Build.parseJSON(postObj, post.board).filesDeleted.includes(needle))) {
        post.kill(true);
        return redirect();
      } else {
        return url = fileObj.url;
      }
    };
    return $.ajax(threadJSON, { onloadend() { return parseJSON.call(this); } });
  },

  // XXX Estimate whether clicks are on the video controls and should be ignored.
  onControls(e: any): boolean {
    return (Conf['Show Controls'] && Conf['Click Passthrough'] && (e.target.nodeName === 'VIDEO')) ||
      (e.target.controls && ((e.target.getBoundingClientRect().bottom - e.clientY) < 35));
  },

  download(this: HTMLAnchorElement, e: MouseEvent) {
    if (this.protocol === 'blob:') { return true; }
    e.preventDefault();
    const { href, download } = this;
    return CrossOrigin.file(href, function(blob) {
      if (blob) {
        const a = $.el('a', {
          href: URL.createObjectURL(blob),
          download,
          hidden: true
        });
        $.add(d.body, a);
        a.click();
        return $.rm(a);
      } else {
        return new Notice('warning', `Could not download ${href}`, 20);
      }
    });
  }
};

export default ImageCommon;
