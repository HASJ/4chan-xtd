
import galleryPage from './Gallery/Gallery.html';
import $ from '../platform/$';
import Callbacks from '../classes/Callbacks';
import Notice from '../classes/Notice';
import { disableKeybindHandler, enableKeybindHandler } from '../Miscellaneous/KeybindEvents';
import keyCode from '../Miscellaneous/KeyCode';
import $$ from '../platform/$$';
import ImageCommon from './ImageCommon';
import Sauce from './Sauce';
import Volume from './Volume';
import Header from '../General/Header';
import { Conf, d, doc, g } from '../globals/globals';
import UI from '../General/UI';
import Get from '../General/Get';
import { debounce, dict, SECOND } from '../platform/helpers';
import Icon from '../Icons/icon';

interface GalleryType {
  enabled?: boolean;
  delay: number;
  images: HTMLAnchorElement[];
  nodes: any;
  fileIDs: Record<string, boolean>;
  slideshow: boolean;
  timeoutID?: any;
  cache?: any;
  init(): void;
  node(this: any): void;
  build(image?: HTMLElement): void;
  generateThumb(post: any, file: any): void;
  load(thumb: HTMLAnchorElement, errorCB: (this: any) => void): HTMLElement;
  open(thumb: HTMLAnchorElement): void;
  error(this: any): void;
  cacheError(): void;
  cleanupTimer(): void;
  startTimer(): number;
  setupTimer(): void;
  checkTimer(): void;
  cb: {
    keybinds(e: KeyboardEvent): void;
    open(this: HTMLAnchorElement | void, e?: MouseEvent): void;
    image(this: HTMLElement, e: MouseEvent): void;
    prev(): void;
    next(): void;
    click(e: MouseEvent): void;
    advance(): void;
    toggle(): void;
    blank(this: HTMLElement, e: MouseEvent): void;
    toggleSlideshow(): void;
    download(): void;
    pause(): void;
    start(): void;
    stop(): void;
    rotateLeft(): void;
    rotateRight(): void;
    rotate: any;
    close(): void;
    setFitness(this: HTMLInputElement): void;
    setHeight: any;
    setDelay(this: HTMLInputElement): void;
  };
  menu: {
    init(): void;
    createSubEntry(name: string): { el: HTMLElement };
    createSubEntries(): { el: HTMLElement }[];
  };
}

const Gallery: GalleryType = {
  enabled: undefined,
  delay: 0,
  images: [],
  nodes: null,
  fileIDs: {},
  slideshow: false,
  timeoutID: undefined,
  cache: undefined,

  init() {
    if (!(this.enabled = Conf['Gallery'] && ['index', 'thread'].includes(g.VIEW))) { return; }

    this.delay = Conf['Slide Delay'];

    const el = $.el('a', {
      href: 'javascript:;',
      title: 'Gallery',
    });
    (Icon as any).set(el, 'image', 'Gallery');

    $.on(el, 'click', this.cb.toggle);

    Header.addShortcut('gallery', el, 530);

    Callbacks.Post.push({
      name: 'Gallery',
      cb:   this.node
    });
  },

  node(this: any) {
    for (const file of this.files) {
      if (file.thumb) {
        if (Gallery.nodes) {
          Gallery.generateThumb(this, file);
          Gallery.nodes.total.textContent = Gallery.images.length;
        }

        if (!Conf['Image Expansion'] && ((g.SITE.software !== 'tinyboard') || !$.hasClass(doc, 'js-enabled'))) {
          $.on(file.thumbLink, 'click', Gallery.cb.image);
        }
      }
    }
  },

  build(image?: HTMLElement) {
    let dialog: HTMLElement, thumb: HTMLAnchorElement | null = null;
    const cb = Gallery.cb;

    if (Conf['Fullscreen Gallery']) {
      $.one(d, 'fullscreenchange mozfullscreenchange webkitfullscreenchange', () => $.on(d, 'fullscreenchange mozfullscreenchange webkitfullscreenchange', cb.close));
      (doc as any).mozRequestFullScreen?.();
      (doc as any).webkitRequestFullScreen?.((Element as any).ALLOW_KEYBOARD_INPUT);
    }

    Gallery.images  = [];
    const nodes = (Gallery.nodes = {} as any);
    Gallery.fileIDs = dict();
    Gallery.slideshow = false;

    nodes.el = (dialog = $.el('div', { id: 'a-gallery' }));
    $.extend(dialog, { innerHTML: galleryPage });

    const object = {
      buttons: '.gal-buttons',
      frame:   '.gal-image',
      name:    '.gal-name',
      count:   '.count',
      total:   '.total',
      sauce:   '.gal-sauce',
      thumbs:  '.gal-thumbnails',
      next:    '.gal-image a',
      current: '.gal-image img'
    };
    for (const key in object) {
      const value = (object as any)[key];
      nodes[key] = $(value, dialog);
    }

    const menuButton = $('.menu-button', dialog) as HTMLElement;
    nodes.menu = new (UI.Menu as any)('gallery');

    $.on(nodes.frame, 'click', cb.blank);
    if (Conf['Mouse Wheel Volume']) { $.on(nodes.frame, 'wheel', Volume.wheel); }
    $.on(nodes.next,  'click', cb.click);
    $.on(nodes.name,  'click', ImageCommon.download);

    const prev =  $('.gal-prev',  dialog) as HTMLElement;
    const next =  $('.gal-next',  dialog) as HTMLElement;
    const start = $('.gal-start', dialog) as HTMLElement;
    const stop =  $('.gal-stop',  dialog) as HTMLElement;
    const close = $('.gal-close', dialog) as HTMLElement;

    $.on(prev,  'click', cb.prev);
    $.on(next,  'click', cb.next);
    $.on(start, 'click', cb.start);
    $.on(stop,  'click', cb.stop);
    $.on(close, 'click', cb.close);

    $.on(menuButton, 'click', function(this: HTMLElement, e: MouseEvent) {
      nodes.menu.toggle(e, this, g);
    });

    (Icon as any).set(menuButton, 'caretDown');
    (Icon as any).set(start, 'play');
    (Icon as any).set(stop, 'stop');
    (Icon as any).set(close, 'xmark');
    (Icon as any).set(prev, 'caretLeft');
    (Icon as any).set(next, 'caretRight');

    for (const entry of Gallery.menu.createSubEntries()) {
      (entry as any).order = 0;
      nodes.menu.addEntry(entry);
    }

    $.on(d, 'keydown', cb.keybinds);
    disableKeybindHandler();

    $.on(window, 'resize', Gallery.cb.setHeight);

    for (const postThumb of $$(g.SITE.selectors.file.thumb) as HTMLElement[]) {
      let post: any;
      if (!(post = Get.postFromNode(postThumb))) { continue; }
      for (const file of post.files) {
        if (file.thumb) {
          Gallery.generateThumb(post, file);
          // If no image to open is given, pick image we have scrolled to.
          if (!image && Gallery.fileIDs[`${post.fullID}.${file.index}`]) {
            const candidate = file.thumbLink;
            if ((Header.getTopOf(candidate) + candidate.getBoundingClientRect().height) >= 0) {
              image = candidate;
            }
          }
        }
      }
    }
    $.addClass(doc, 'gallery-open');

    $.add(d.body, dialog);

    nodes.thumbs.scrollTop = 0;
    nodes.current.parentElement.scrollTop = 0;

    if (image) { thumb = $(`[href='${(image as any).href}']`, nodes.thumbs) as HTMLAnchorElement; }
    if (!thumb) { thumb = Gallery.images[Gallery.images.length - 1]; }
    if (thumb) { Gallery.open(thumb); }

    doc.style.overflow = 'hidden';
    nodes.total.textContent = Gallery.images.length;
  },

  generateThumb(post: any, file: any) {
    if (post.isClone || post.isHidden) { return; }
    if (!file || !file.thumb || (!file.isImage && !file.isVideo && !Conf['PDF in Gallery'])) { return; }
    if (Gallery.fileIDs[`${post.fullID}.${file.index}`]) { return; }

    Gallery.fileIDs[`${post.fullID}.${file.index}`] = true;

    const thumb = $.el('a', {
      className: 'gal-thumb',
      href:      file.url,
      target:    '_blank',
      title:     file.name
    }) as HTMLAnchorElement;

    thumb.dataset.id   = String(Gallery.images.length);
    thumb.dataset.post = post.fullID;
    thumb.dataset.file = file.index;

    const thumbImg = file.thumb.cloneNode(false);
    thumbImg.style.cssText = '';
    $.add(thumb, thumbImg);

    $.on(thumb, 'click', Gallery.cb.open);

    Gallery.images.push(thumb);
    $.add(Gallery.nodes.thumbs, thumb);
  },

  load(thumb: HTMLAnchorElement, errorCB: (this: any) => void): HTMLElement {
    const ext = (thumb.href.match(/\w*$/) || [])[0];
    const elType = $.getOwn({ 'webm': 'video', 'mp4': 'video', 'ogv': 'video', 'pdf': 'iframe' }, ext) || 'img';
    const file = $.el(elType);
    $.extend(file.dataset, thumb.dataset);
    $.on(file, 'error', errorCB);
    (file as any).src = thumb.href;
    return file;
  },

  open(thumb: HTMLAnchorElement) {
    let el: HTMLElement | null, file: any, post: any;
    const { nodes } = Gallery;
    const oldID = +nodes.current.dataset.id;
    const newID = +thumb.dataset.id;

    // Highlight, center selected thumbnail
    if ((el = Gallery.images[oldID])) { $.rmClass(el, 'gal-highlight'); }
    $.addClass(thumb, 'gal-highlight');
    nodes.thumbs.scrollTop = (thumb.offsetTop + (thumb.offsetHeight / 2)) - (nodes.thumbs.clientHeight / 2);

    // Load image or use preloaded image
    if (Gallery.cache?.dataset.id === String(newID)) {
      file = Gallery.cache;
      $.off(file, 'error', Gallery.cacheError);
      $.on(file, 'error', Gallery.error);
    } else {
      file = Gallery.load(thumb, Gallery.error);
    }

    // Replace old image with new one
    $.off(nodes.current, 'error', Gallery.error);
    ImageCommon.pause(nodes.current);
    $.replace(nodes.current, file);
    nodes.current = file;

    if (file.nodeName === 'VIDEO') {
      file.loop = true;
      Volume.setup(file);
      if (Conf['Autoplay']) { file.play(); }
      if (Conf['Show Controls']) file.controls = true;
    }

    doc.classList.toggle('gal-pdf', file.nodeName === 'IFRAME');
    Gallery.cb.setHeight();
    nodes.count.textContent = String(newID + 1);
    nodes.name.download = (nodes.name.textContent = thumb.title);
    nodes.name.href = thumb.href;
    nodes.frame.scrollTop = 0;
    nodes.next.focus();

    // Set sauce links
    $.rmAll(nodes.sauce);
    if (Conf['Sauce'] && Sauce.links && (post = g.posts.get(file.dataset.post))) {
      const sauces = [];
      for (const link of Sauce.links) {
        let sauceNode: HTMLAnchorElement | null;
        if ((sauceNode = Sauce.createSauceLink(link, post, post.files[+file.dataset.file]))) {
          sauces.push($.tn(' '), sauceNode);
        }
      }
      $.add(nodes.sauce, sauces);
    }

    // Continue slideshow if moving forward, stop otherwise
    if (Gallery.slideshow && ((newID > oldID) || ((oldID === (Gallery.images.length - 1)) && (newID === 0)))) {
      Gallery.setupTimer();
    } else {
      Gallery.cb.stop();
    }

    // Scroll to post
    if (Conf['Scroll to Post'] && (post = g.posts.get(file.dataset.post))) {
      Header.scrollTo(post.nodes.root);
    }

    // Preload next image
    if (isNaN(oldID) || (newID === ((oldID + 1) % Gallery.images.length))) {
      Gallery.cache = Gallery.load(Gallery.images[(newID + 1) % Gallery.images.length], Gallery.cacheError);
    }
  },

  error(this: any) {
    if (this.error?.code === MediaError.MEDIA_ERR_DECODE) {
      new Notice('error', 'Corrupt or unplayable video', 30);
      return;
    }
    if (ImageCommon.isFromArchive(this)) { return; }
    const post = g.posts.get(this.dataset.post);
    const file = post.files[+this.dataset.file];
    ImageCommon.error(this, post, file, null, (url) => {
      if (!url) { return; }
      Gallery.images[+this.dataset.id].href = url;
      if (Gallery.nodes.current === this) { this.src = url; }
    });
  },

  cacheError() {
    delete Gallery.cache;
  },

  cleanupTimer() {
    clearTimeout(Gallery.timeoutID);
    const { current } = Gallery.nodes;
    $.off(current, 'canplaythrough load', Gallery.startTimer);
    $.off(current, 'ended', Gallery.cb.next);
  },

  startTimer(): number {
    return Gallery.timeoutID = setTimeout(Gallery.checkTimer, Gallery.delay * SECOND);
  },

  setupTimer() {
    Gallery.cleanupTimer();
    const { current } = Gallery.nodes;
    const isVideo = current.nodeName === 'VIDEO';
    if (isVideo) { current.play(); }
    if ((isVideo ? current.readyState >= 4 : current.complete) || (current.nodeName === 'IFRAME')) {
      Gallery.startTimer();
    } else {
      $.on(current, (isVideo ? 'canplaythrough' : 'load'), Gallery.startTimer);
    }
  },

  checkTimer() {
    const { current } = Gallery.nodes;
    if ((current.nodeName === 'VIDEO') && !current.paused) {
      $.on(current, 'ended', Gallery.cb.next);
      current.loop = false;
    } else {
      Gallery.cb.next();
    }
  },

  cb: {
    keybinds(e: KeyboardEvent) {
      let key: string | boolean;
      if (!(key = keyCode(e))) { return; }

      const cb = (() => {
        switch (key) {
          case Conf['Close']: case Conf['Open Gallery']:
            return Gallery.cb.close;
          case Conf['Next Gallery Image']:
            return Gallery.cb.next;
          case Conf['Advance Gallery']:
            return Gallery.cb.advance;
          case Conf['Previous Gallery Image']:
            return Gallery.cb.prev;
          case Conf['Pause']:
            return Gallery.cb.pause;
          case Conf['Slideshow']:
            return Gallery.cb.toggleSlideshow;
          case Conf['Rotate image anticlockwise']:
            return Gallery.cb.rotateLeft;
          case Conf['Rotate image clockwise']:
            return Gallery.cb.rotateRight;
          case Conf['Download Gallery Image']:
            return Gallery.cb.download;
        }
      })();

      if (!cb) { return; }
      e.stopPropagation();
      e.preventDefault();
      cb();
    },

    open(this: HTMLAnchorElement | void, e?: MouseEvent) {
      if (e) { e.preventDefault(); }
      if (this) { Gallery.open(this); }
    },

    image(this: HTMLElement, e: MouseEvent) {
      e.preventDefault();
      e.stopPropagation();
      Gallery.build(this);
    },

    prev() {
      Gallery.cb.open.call(
        Gallery.images[+Gallery.nodes.current.dataset.id - 1] || Gallery.images[Gallery.images.length - 1]
      );
    },

    next() {
      Gallery.cb.open.call(
        Gallery.images[+Gallery.nodes.current.dataset.id + 1] || Gallery.images[0]
      );
    },

    click(e: MouseEvent) {
      if (ImageCommon.onControls(e)) { return; }
      e.preventDefault();
      Gallery.cb.advance();
    },

    advance() {
      if (!Conf['Autoplay'] && Gallery.nodes.current.paused) {
        Gallery.nodes.current.play();
      } else {
        Gallery.cb.next();
      }
    },

    toggle() {
      (Gallery.nodes ? Gallery.cb.close : Gallery.build)();
    },

    blank(this: HTMLElement, e: MouseEvent) {
      if (e.target === this) { Gallery.cb.close(); }
    },

    toggleSlideshow() {
      Gallery.cb[Gallery.slideshow ? 'stop' : 'start']();
    },

    download() {
      const name = $('.gal-name') as HTMLElement;
      name.click();
    },

    pause() {
      Gallery.cb.stop();
      const { current } = Gallery.nodes;
      if (current.nodeName === 'VIDEO') {
        current[current.paused ? 'play' : 'pause']();
      }
    },

    start() {
      $.addClass(Gallery.nodes.buttons, 'gal-playing');
      Gallery.slideshow = true;
      Gallery.setupTimer();
    },

    stop() {
      if (!Gallery.slideshow) { return; }
      Gallery.cleanupTimer();
      const { current } = Gallery.nodes;
      if (current.nodeName === 'VIDEO') { current.loop = true; }
      $.rmClass(Gallery.nodes.buttons, 'gal-playing');
      Gallery.slideshow = false;
    },

    rotateLeft() { Gallery.cb.rotate(270); },
    rotateRight() { Gallery.cb.rotate(90); },

    rotate: debounce(100, function(delta: number) {
      const { current } = Gallery.nodes;
      if (current.nodeName === 'IFRAME') { return; }
      current.dataRotate = ((current.dataRotate || 0) + delta) % 360;
      current.style.transform = `rotate(${current.dataRotate}deg)`;
      Gallery.cb.setHeight();
    }),

    close() {
      $.off(Gallery.nodes.current, 'error', Gallery.error);
      ImageCommon.pause(Gallery.nodes.current);
      $.rm(Gallery.nodes.el);
      $.rmClass(doc, 'gallery-open');
      if (Conf['Fullscreen Gallery']) {
        $.off(d, 'fullscreenchange mozfullscreenchange webkitfullscreenchange', Gallery.cb.close);
        (d as any).mozCancelFullScreen?.();
        (d as any).webkitExitFullscreen?.();
      }
      delete Gallery.nodes;
      delete Gallery.fileIDs;
      doc.style.overflow = '';

      $.off(d, 'keydown', Gallery.cb.keybinds);
      enableKeybindHandler();
      $.off(window, 'resize', Gallery.cb.setHeight);
      clearTimeout(Gallery.timeoutID);
    },

    setFitness(this: HTMLInputElement) {
      (this.checked ? $.addClass : $.rmClass)(doc, `gal-${this.name.toLowerCase().replace(/\s+/g, '-')}`);
    },

    setHeight: debounce(100, function() {
      let dim: string | undefined, margin: number, minHeight: number;
      const { current, frame } = Gallery.nodes;
      const { style } = current;

      const post = g.posts.get(current.dataset.post);
      if (Conf['Stretch to Fit'] && post && (dim = post.files[+current.dataset.file].dimensions)) {
        const dims = dim.split('x').map((x: string) => +x);
        const width = dims[0];
        const height = dims[1];
        let containerWidth = frame.clientWidth;
        let containerHeight = doc.clientHeight - 25;
        if (((current.dataRotate || 0) % 180) === 90) {
          [containerWidth, containerHeight] = [containerHeight, containerWidth];
        }
        minHeight = Math.min(containerHeight, (height / width) * containerWidth);
        style.minHeight = minHeight + 'px';
        style.minWidth = ((width / height) * minHeight) + 'px';
      } else {
        style.minHeight = (style.minWidth = '');
      }

      if (((current.dataRotate || 0) % 180) === 90) {
        style.maxWidth  = Conf['Fit Height'] ? `${doc.clientHeight - 25}px` : 'none';
        style.maxHeight = Conf['Fit Width']  ? `${frame.clientWidth}px`     : 'none';
        margin = (current.clientWidth - current.clientHeight) / 2;
        style.margin = `${margin}px ${-margin}px`;
      } else {
        style.maxWidth = (style.maxHeight = (style.margin = ''));
      }
    }),

    setDelay(this: HTMLInputElement) { Gallery.delay = +this.value; }
  },

  menu: {
    init() {
      if (!Gallery.enabled) { return; }

      const el = $.el('span', {
        textContent: 'Gallery',
        className: 'gallery-link'
      });

      Header.menu.addEntry({
        el,
        order: 105,
        subEntries: Gallery.menu.createSubEntries()
      });
    },

    createSubEntry(name: string): { el: HTMLElement } {
      const label = UI.checkbox(name, name) as HTMLElement;
      const input = label.firstElementChild as HTMLInputElement;
      if (['Hide Thumbnails', 'Fit Width', 'Fit Height'].includes(name)) {
        $.on(input, 'change', Gallery.cb.setFitness);
      }
      $.event('change', null, input);
      $.on(input, 'change', $.cb.checked);
      if (['Hide Thumbnails', 'Fit Width', 'Fit Height', 'Stretch to Fit'].includes(name)) {
        $.on(input, 'change', Gallery.cb.setHeight);
      }
      return { el: label };
    },

    createSubEntries(): { el: HTMLElement }[] {
      const subEntries = ['Hide Thumbnails', 'Fit Width', 'Fit Height', 'Stretch to Fit', 'Scroll to Post'].map((item) => Gallery.menu.createSubEntry(item));

      const delayLabel = $.el('label', { innerHTML: 'Slide Delay: <input type="number" name="Slide Delay" min="0" step="any" class="field">' });
      const delayInput = delayLabel.firstElementChild as HTMLInputElement;
      delayInput.value = String(Gallery.delay);
      $.on(delayInput, 'change', Gallery.cb.setDelay);
      $.on(delayInput, 'change', $.cb.value);
      subEntries.push({ el: delayLabel });

      return subEntries;
    }
  }
};

export default Gallery;
