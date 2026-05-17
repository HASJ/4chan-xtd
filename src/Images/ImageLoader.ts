import Callbacks from "../classes/Callbacks";
import Header from "../General/Header";
import { g, Conf, d, doc } from "../globals/globals";
import Icon from "../Icons/icon";
import $ from "../platform/$";

interface ImageLoaderType {
  prefetchEnabled?: boolean;
  init(): void;
  node(this: any): void;
  replaceVideo(post: any, file: any): void;
  prefetch(post: any, file: any): void;
  prefetchAll(post: any): void;
  toggle(this: HTMLElement): void;
  playVideos(): void;
}

const ImageLoader: ImageLoaderType = {
  prefetchEnabled: undefined,

  init() {
    if (!['index', 'thread', 'archive'].includes(g.VIEW)) { return; }
    const replace = Conf['Replace JPG'] || Conf['Replace PNG'] || Conf['Replace GIF'] || Conf['Replace WEBM'];
    if (!Conf['Image Prefetching'] && !replace) { return; }

    Callbacks.Post.push({
      name: 'Image Replace',
      cb:   this.node
    });

    $.on(d, 'PostsInserted', () => {
      if (ImageLoader.prefetchEnabled || replace) {
        g.posts.forEach(ImageLoader.prefetchAll);
      }
    });

    if (Conf['Replace WEBM']) {
      $.on(d, 'scroll visibilitychange 4chanXInitFinished PostsInserted', this.playVideos);
    }

    if (!Conf['Image Prefetching'] || !['index', 'thread'].includes(g.VIEW)) { return; }

    const el = $.el('a', {
      href: 'javascript:;',
      title: 'Prefetch Images',
      className: 'disabled',
    });
    (Icon as any).set(el, 'bolt', 'Prefetch');

    $.on(el, 'click', this.toggle);

    Header.addShortcut('prefetch', el, 525);
  },

  node(this: any) {
    if (this.isClone) { return; }
    for (const file of this.files) {
      if (Conf['Replace WEBM'] && file.isVideo) { ImageLoader.replaceVideo(this, file); }
      ImageLoader.prefetch(this, file);
    }
  },

  replaceVideo(post: any, file: any) {
    const { thumb } = file;
    const video = $.el('video', {
      preload:     'none',
      loop:        true,
      muted:       true,
      poster:      thumb.src || thumb.dataset.src,
      textContent: thumb.alt,
      className:   thumb.className
    }) as HTMLVideoElement;
    video.setAttribute('muted', 'muted');
    video.dataset.md5 = thumb.dataset.md5;
    for (const attr of ['height', 'width', 'maxHeight', 'maxWidth']) {
      (video.style as any)[attr] = thumb.style[attr];
    }
    video.src = file.url;
    $.replace(thumb, video);
    file.thumb = video;
    file.videoThumb = true;
  },

  prefetch(post: any, file: any) {
    let clone: any, type: string;
    const { isImage, isVideo, thumb, url } = file;
    if (file.isPrefetched || !(isImage || isVideo) || post.isHidden || post.thread.isHidden) { return; }
    if (isVideo) {
      type = 'WEBM';
    } else {
      type = (url.match(/\.([^.]+)$/) || [])[1]?.toUpperCase() || '';
      if (type === 'JPEG') { type = 'JPG'; }
    }
    const replace = Conf[`Replace ${type}`] && !/spoiler/.test(thumb.src || thumb.dataset.src);
    if (!replace && !ImageLoader.prefetchEnabled) { return; }
    if ($.hasClass(doc, 'catalog-mode')) { return; }
    if (![post, ...post.clones].some((clone: any) => doc.contains(clone.nodes.root))) { return; }
    file.isPrefetched = true;
    if (file.videoThumb) {
      for (clone of post.clones) { clone.file.thumb.preload = 'auto'; }
      thumb.preload = 'auto';
      // XXX Cloned video elements with poster in Firefox cause momentary display of image loading icon.
      if ($.engine === 'gecko') {
        $.on(thumb, 'loadeddata', function(this: HTMLElement) { this.removeAttribute('poster'); });
      }
      return;
    }

    const el = $.el(isImage ? 'img' : 'video') as HTMLImageElement | HTMLVideoElement;
    if (isVideo) { (el as HTMLVideoElement).preload = 'auto'; }
    if (replace && isImage) {
      $.on(el, 'load', () => {
        for (clone of post.clones) { clone.file.thumb.src = url; }
        thumb.src = url;
      });
    }
    el.src = url;
  },

  prefetchAll(post: any) {
    for (const file of post.files) {
      ImageLoader.prefetch(post, file);
    }
  },

  toggle(this: HTMLElement) {
    ImageLoader.prefetchEnabled = !ImageLoader.prefetchEnabled;
    this.classList.toggle('disabled', !ImageLoader.prefetchEnabled);
    if (ImageLoader.prefetchEnabled) {
      g.posts.forEach(ImageLoader.prefetchAll);
    }
  },

  playVideos() {
    // Special case: Quote previews are off screen when inserted into document, but quickly moved on screen.
    const qpClone = $.id('qp')?.firstElementChild;
    g.posts.forEach((post: any) => {
      for (const p of [post, ...post.clones]) {
        for (const file of p.files) {
          if (file.videoThumb) {
            const { thumb } = file;
            if (Header.isNodeVisible(thumb) || (p.nodes.root === qpClone)) {
              thumb.play();
            } else {
              thumb.pause();
            }
          }
        }
      }
    });
  }
};

export default ImageLoader;
