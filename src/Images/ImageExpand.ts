// @ts-nocheck
import Callbacks from "../classes/Callbacks";
import Config from "../config/Config";
import Get from "../General/Get";
import UIState from "../globals/UIState";
import UI from "../General/UI";
import { Conf, d, doc, g } from "../globals/globals";
import Nav from "../Miscellaneous/Nav";
import $ from "../platform/$";
import { SECOND } from "../platform/helpers";
import ImageCommon from "./ImageCommon";
import Volume from "./Volume";
import Audio from "./Audio";
import type { default as Post, PostClone } from "../classes/Post";
import Icon from "../Icons/icon";

const ImageExpand = {
  init() {
    const enabled = Conf['Image Expansion'] && ['index', 'thread'].includes(g.VIEW);
    this.enabled = enabled;
    if (!enabled) { return; }

    this.EAI = $.el('a', {
      className: 'expand-all-shortcut',
      title: 'Expand All Images',
      href: 'javascript:;'
    });
    Icon.set(this.EAI, 'expand', 'Expand All Images');

    $.on(this.EAI, 'click', this.cb.toggleAll);
    UIState.addShortcut('expand-all', this.EAI, 520);
    $.on(d, 'scroll visibilitychange', this.cb.playVideos);
    this.videoControls = $.el('span', {className: 'video-controls'});
    $.extend(this.videoControls, {innerHTML: " <a href=\"javascript:;\" title=\"You can also contract the video by dragging it to the left.\">contract</a>"});

    return Callbacks.Post.push({
      name: 'Image Expansion',
      cb: this.node
    });
  },

  node(this: Post | PostClone) {
    if (!this.file || (!this.file.isImage && !this.file.isVideo)) { return; }
    $.on(this.file.thumbLink, 'click', ImageExpand.cb.toggle);

    if (this.isClone) {
      if (this.file.isExpanding) {
        // If we clone a post where the image is still loading,
        // make it loading in the clone too.
        ImageExpand.contract(this);
        return ImageExpand.expand(this);

      } else if (this.file.isExpanded && this.file.isVideo) {
        Volume.setup(this.file.fullImage);
        ImageExpand.setupVideoCB(this);
        return ImageExpand.setupVideo(this, !this.origin.file.fullImage?.paused || this.origin.file.wasPlaying, this.file.fullImage.controls);
      }

    } else if (ImageExpand.on && !this.isHidden && !this.isFetchedQuote &&
      (Conf['Expand spoilers'] || !this.file.isSpoiler) &&
      (Conf['Expand videos'] || !this.file.isVideo)) {
        return ImageExpand.expand(this);
      }
  },

  cb: {
    toggle(e) {
      if ($.modifiedClick(e)) { return; }
      const post = Get.postFromNode(this);
      const {file} = post;
      if (file.isExpanded && ImageCommon.onControls(e)) { return; }
      e.preventDefault();
      if (!Conf['Autoplay'] && file.fullImage?.paused) {
        return file.fullImage.play();
      } else {
        return ImageExpand.toggle(post);
      }
    },

    toggleAll() {
      let func;
      $.event('CloseMenu');
      const threadRoot = Nav.getThread();
      const toggle = function(post) {
        const {file} = post;
        if (!file || (!file.isImage && !file.isVideo) || !doc.contains(post.nodes.root)) { return; }
        if (ImageExpand.on &&
          ((!Conf['Expand spoilers']  && file.isSpoiler) ||
          (!Conf['Expand videos']     && file.isVideo) ||
          (Conf['Expand from here']   && (UIState.getTopOf(file.thumb) < 0)) ||
          (Conf['Expand thread only'] && (g.VIEW === 'index') && !threadRoot?.contains(file.thumb)))) {
            return;
          }
        return $.queueTask(func, post);
      };

      const expanding = $.hasClass(ImageExpand.EAI, 'expand-all-shortcut');
      ImageExpand.on = expanding;
      if (expanding) {
        ImageExpand.EAI.className   = 'contract-all-shortcut';
        ImageExpand.EAI.title       = 'Contract All Images';
        Icon.set(ImageExpand.EAI, 'shrink', 'Contract All Images');
        func = ImageExpand.expand;
      } else {
        ImageExpand.EAI.className   = 'expand-all-shortcut';
        ImageExpand.EAI.title       = 'Expand All Images';
        Icon.set(ImageExpand.EAI, 'expand', 'Expand All Images');
        func = ImageExpand.contract;
      }

      return g.posts.forEach(function(post) {
        for (post of [post, ...post.clones]) { toggle(post); }
      });
    },

    playVideos() {
      return g.posts.forEach(function(post) {
        for (post of [post, ...post.clones]) {
          const {file} = post;
          if (!file || !file.isVideo || !file.isExpanded) { continue; }

          const video = file.fullImage;
          const visible = ($.hasAudio(video) && !video.muted) || UIState.isNodeVisible(video);
          if (visible && file.wasPlaying) {
            delete file.wasPlaying;
            video.play();
          } else if (!visible && !video.paused) {
            file.wasPlaying = true;
            video.pause();
          }
        }
      });
    },

    setFitness() {
      return $[this.checked ? 'addClass' : 'rmClass'](doc, this.name.toLowerCase().replace(/\s+/g, '-'));
    }
  },

  toggle(post) {
    if (!post.file.isExpanding && !post.file.isExpanded) {
      post.file.scrollIntoView = Conf['Scroll into view'];
      ImageExpand.expand(post);
      return;
    }

    ImageExpand.contract(post);

    if (Conf['Advance on contract']) {
      let next = post.nodes.root;
      while ((next = $.x("following::div[contains(@class,'postContainer')][1]", next))) {
        if (!$('.stub', next) && (next.offsetHeight !== 0)) { break; }
      }
      if (next) {
        return UIState.scrollTo(next);
      }
    }
  },

  contract(post) {
    const {file} = post;
    const el = file.fullImage;
    const anchor = el && ImageExpand.captureScrollAnchor(el);

    ImageExpand.resetFileState(post);

    if (!el) { return; }

    if (doc.contains(el)) {
      ImageExpand.restoreScrollPosition(post, anchor);
    }

    $.off(el, 'error', ImageExpand.error);
    ImageCommon.pushCache(el);
    if (file.isVideo) {
      ImageCommon.pause(el);
      ImageExpand.teardownVideoCB(el);
    }
    if (Conf['Restart when Opened']) { ImageCommon.rewind(file.thumb); }
    delete file.fullImage;
    $.queueTask(function() {
      // XXX Work around Chrome/Chromium not firing mouseover on the thumbnail.
      if (file.isExpanding || file.isExpanded) { return; }
      $.rmClass(el, 'full-image');
      if (el.id) { return; }
      return $.rm(el);
    });

    ImageExpand.cleanupAudio(file);
  },

  captureScrollAnchor(el) {
    const top = UIState.getTopOf(el);
    const bottom = top + el.getBoundingClientRect().height;
    const oldHeight = d.body.clientHeight;
    const {scrollY} = window;
    return {bottom, oldHeight, scrollY};
  },

  resetFileState(post) {
    const {file} = post;
    $.rmClass(post.nodes.root, 'expanded-image');
    $.rmClass(file.thumb,      'expanding');
    $.rm(file.videoControls);
    file.thumbLink.href   = file.url;
    file.thumbLink.target = '_blank';
    for (const x of ['isExpanding', 'isExpanded', 'videoControls', 'wasPlaying', 'scrollIntoView']) {
      delete file[x];
    }
  },

  restoreScrollPosition(post, anchor) {
    const {bottom, oldHeight, scrollY} = anchor;
    if (bottom <= 0) {
      // For images entirely above us, scroll to remain in place.
      window.scrollBy(0, ((scrollY - window.scrollY) + d.body.clientHeight) - oldHeight);
    } else {
      // For images not above us that would be moved above us, scroll to the thumbnail.
      UIState.scrollToIfNeeded(post.nodes.root);
    }
    if (window.scrollX > 0) {
      // If we have scrolled right viewing an expanded image, return to the left.
      window.scrollBy(-window.scrollX, 0);
    }
  },

  teardownVideoCB(el) {
    for (const eventName in ImageExpand.videoCB) {
      const cb = ImageExpand.videoCB[eventName];
      $.off(el, eventName, cb);
    }
  },

  cleanupAudio(file) {
    if (!file.audio) { return; }
    file.audio.remove();
    delete file.audio;
    if (file.audioSlider) {
      file.audioSlider.remove();
      delete file.audioSlider;
    }
  },

  expand(post: Post, src?: string) {
    const {file} = post;
    const {thumb, isVideo } = file;
    // Do not expand images of hidden/filtered replies, or already expanded pictures.
    if (post.isHidden || file.isExpanding || file.isExpanded) { return; }

    $.addClass(thumb, 'expanding');
    file.isExpanding = true;

    const el = ImageExpand.resolveFullImage(post, src);

    el.className = 'full-image';
    $.after(thumb, el);

    if (isVideo) { ImageExpand.setupExpandedVideo(post, el); }

    if (!isVideo) {
      $.asap((() => el.naturalHeight), () => ImageExpand.completeExpand(post));
    } else if (el.readyState >= el.HAVE_METADATA) {
      ImageExpand.completeExpand(post);
    } else {
      $.on(el, 'loadedmetadata', () => ImageExpand.completeExpand(post));
    }

    ImageExpand.setupSoundPost(post, el, isVideo);
  },

  resolveFullImage(post, src?: string): HTMLImageElement | HTMLVideoElement {
    const {file} = post;
    const {isVideo} = file;
    let el: HTMLImageElement | HTMLVideoElement;
    if (file.fullImage) {
      el = file.fullImage;
    } else if (ImageCommon.cache?.dataset.fileID === `${post.fullID}.${file.index}`) {
      el = (file.fullImage = ImageCommon.popCache());
      $.on(el, 'error', ImageExpand.error);
      if (Conf['Restart when Opened'] && (el.id !== 'ihover')) { ImageCommon.rewind(el); }
      el.removeAttribute('id');
    } else {
      el = (file.fullImage = $.el((isVideo ? 'video' : 'img')));
      el.dataset.fileID = `${post.fullID}.${file.index}`;
      $.on(el, 'error', ImageExpand.error);
      el.src = src || file.url;
    }
    return el;
  },

  setupExpandedVideo(post, el) {
    const {file} = post;
    const {thumbLink} = file;
    // add contract link to file info
    if (!file.videoControls) {
      file.videoControls = ImageExpand.videoControls.cloneNode(true);
      $.add(file.text, file.videoControls);
    }

    // disable link to file so native controls can work
    thumbLink.removeAttribute('href');
    thumbLink.removeAttribute('target');

    el.loop = true;
    Volume.setup(el);
    ImageExpand.setupVideoCB(post);
  },

  setupSoundPost(post, el, isVideo) {
    const {file} = post;
    if (!(Conf['Enable sound posts'] && Conf['Allow Sound'])) { return; }
    const soundUrlMatch = /\[sound=([^\]]+)]/i.exec(file.name);
    if (!soundUrlMatch) { return; }
    let src = decodeURIComponent(soundUrlMatch[1]);
    if (!src.startsWith('http')) src = `https://${src}`;
    const audioEl = $.el('audio', { src }) as HTMLAudioElement;
    Volume.setup(audioEl);
    if (isVideo) {
      Audio.setupSync(el as HTMLVideoElement, audioEl);
      (el as HTMLVideoElement).controls = false;
    }
    audioEl.loop = true;
    audioEl.controls = Conf['Show Controls'];
    audioEl.autoplay = Conf['Autoplay'];

    $.after(el, audioEl);
    file.audio = audioEl;
  },

  completeExpand(post) {
    const {file} = post;
    if (!file.isExpanding) { return; } // contracted before the image loaded

    const bottom = UIState.getTopOf(file.thumb) + file.thumb.getBoundingClientRect().height;
    const oldHeight = d.body.clientHeight;
    const {scrollY} = window;

    $.addClass(post.nodes.root, 'expanded-image');
    $.rmClass(file.thumb,      'expanding');
    file.isExpanded = true;
    delete file.isExpanding;

    // Scroll to keep our place in the thread when images are expanded above us.
    if (doc.contains(post.nodes.root) && (bottom <= 0)) {
      window.scrollBy(0, ((scrollY - window.scrollY) + d.body.clientHeight) - oldHeight);
    }

    // Scroll to display full image.
    if (file.scrollIntoView) {
      delete file.scrollIntoView;
      const imageBottom = Math.min(doc.clientHeight - file.fullImage.getBoundingClientRect().bottom - 25, UIState.getBottomOf(file.fullImage));
      if (imageBottom < 0) {
        window.scrollBy(0, Math.min(-imageBottom, UIState.getTopOf(file.fullImage)));
      }
    }

    if (file.isVideo) {
      return ImageExpand.setupVideo(post, Conf['Autoplay'], Conf['Show Controls']);
    }
  },

  setupVideo(post: Post, playing: boolean, controls: boolean) {
    const {audio} = post.file;
    const fullImage = post.file.fullImage as HTMLVideoElement
    if (!playing && !audio) {
      fullImage.controls = controls;
      return;
    }
    fullImage.controls = false;
    $.asap((() => doc.contains(fullImage)), function() {
      if (!d.hidden && UIState.isNodeVisible(fullImage)) {
        fullImage.play();
      } else {
        post.file.wasPlaying = true;
      }
    });
    fullImage.controls = controls && !audio;
  },

  videoCB: (function() {
    // dragging to the left contracts the video
    let mousedown = false;
    return {
      mouseover() { mousedown = false; },
      mousedown(e) { if (e.button === 0) { mousedown = true; } },
      mouseup(e) { if (e.button === 0) { mousedown = false; } },
      mouseout(e) { if (((e.buttons & 1) || mousedown) && (e.clientX <= this.getBoundingClientRect().left)) { return ImageExpand.toggle(Get.postFromNode(this)); } }
    };
  })(),

  setupVideoCB(post) {
    for (const eventName in ImageExpand.videoCB) {
      const cb = ImageExpand.videoCB[eventName];
      $.on(post.file.fullImage, eventName, cb);
    }
    if (post.file.videoControls) {
      return $.on(post.file.videoControls.firstElementChild, 'click', () => ImageExpand.toggle(post));
    }
  },

  error() {
    const post = Get.postFromNode(this);
    $.rm(this);
    delete post.file.fullImage;
    // Images can error:
    //  - before the image started loading.
    //  - after the image started loading.
    // Don't try to re-expand if it was already contracted.
    if (!post.file.isExpanding && !post.file.isExpanded) { return; }
    if (ImageCommon.decodeError(this, post.file)) {
      return ImageExpand.contract(post);
    }
    // Don't autoretry images from the archive.
    if (ImageCommon.isFromArchive(this)) {
      return ImageExpand.contract(post);
    }
    return ImageCommon.error(this, post, post.file, 10 * SECOND, function(URL) {
      if (post.file.isExpanding || post.file.isExpanded) {
        ImageExpand.contract(post);
        if (URL) { return ImageExpand.expand(post, URL); }
      }
    });
  },

  menu: {
    init() {
      if (!ImageExpand.enabled) { return; }

      const el = $.el('span', {
        textContent: 'Image Expansion',
        className:   'image-expansion-link'
      }
      );

      const {createSubEntry} = ImageExpand.menu;
      const subEntries = [];
      for (const name in Config.imageExpansion) {
        const conf = Config.imageExpansion[name];
        subEntries.push(createSubEntry(name, conf[1]));
      }

      return UIState.headerMenu.addEntry({
        el,
        order: 105,
        subEntries
      });
    },

    createSubEntry(name, desc) {
      const label = UI.checkbox(name, name);
      label.title = desc;
      const input = label.firstElementChild;
      if (['Fit width', 'Fit height'].includes(name)) {
        $.on(input, 'change', ImageExpand.cb.setFitness);
      }
      $.event('change', null, input);
      $.on(input, 'change', $.cb.checked);
      return {el: label};
    }
  }
};
export default ImageExpand;
