// @ts-nocheck
/*
 * Quick Reply Singleton
 *
 * QR.ts manages the Quick Reply interface, post queuing, and submission logic.
 * It is a core singleton that delegates captcha operations to the bridge facade.
 */
import QuickReplyPage from './QR/QuickReply.html';
import $ from '../platform/$';
import Callbacks from '../classes/Callbacks';
import Notice from '../classes/Notice';
import Favicon from '../Monitoring/Favicon';
import $$ from '../platform/$$';
import CrossOrigin from '../platform/CrossOrigin';
import Captcha from './Captcha';
import meta from '../../package.json';
import UIState from '../globals/UIState';
import { Conf, E, d, doc, g } from '../globals/globals';
import Menu from '../Menu/Menu';
import UI from '../General/UI';
import BoardConfig from '../General/BoardConfig';
import Get from '../General/Get';
import { DAY, dict, SECOND } from '../platform/helpers';
import Icon from '../Icons/icon';
import { VideoStripper } from './VideoStripper';
import * as MimeTypes from '../globals/MimeTypes';
import QRState from '../globals/QRState';
import { registerQRCaptchaBridge } from './QRBridge';

interface ConvertOptions {
  /** Max file size, optional, but passing it will prevent re-calculation */
  maxSize?: number;
  /** Image bitmap, optional, but passing it will prevent re-calculation */
  img?: ImageBitmap;
  /** Target width, defaults to the current width of the image */
  width?: number;
  /** Target height, defaults to the current width of the image */
  height?: number;
};

const QR = {
  get postingIsEnabled() { return QRState.postingIsEnabled; },
  set postingIsEnabled(val) { QRState.postingIsEnabled = val; },

  get captcha() { return QRState.captcha; },
  set captcha(val) { QRState.captcha = val; },

  min_width: 0,
  min_height: 0,
  max_width: 0,
  max_height: 0,
  max_size: 0,
  max_size_video: 0,
  max_comment: 0,
  max_width_video: 0,
  max_height_video: 0,
  max_duration_video: 0,
  forcedAnon: false,
  spoiler: false,
  link: undefined as HTMLElement,
  post: undefined as typeof post,
  get posts() { return QRState.posts; },
  set posts(val) { QRState.posts = val; },
  get nodes() { return QRState.nodes; },
  set nodes(val) { QRState.nodes = val; },
  shortcut: undefined as HTMLAnchorElement,
  hasFocus: false,

  get req() { return QRState.req; },
  set req(val) { QRState.req = val; },
  get selected() { return QRState.selected; },
  set selected(val) { QRState.selected = val; },

  mimeTypes: MimeTypes.mimeTypes,

  validExtension: MimeTypes.validExtension,

  typeFromExtension: MimeTypes.typeFromExtension,

  extensionFromType: MimeTypes.extensionFromType,

  init() {
    QRState.submit = QR.submit;
    QRState.focus = QR.focus;
    QRState.open = QR.open;
    QRState.close = QR.close;
    QRState.error = QR.error;
    QRState.captcha = QR.captcha;
    QRState.cooldown = QR.cooldown;
    QRState.post = QR.post;

    const captchaVersion = $('#g-recaptcha, #captcha-forced-noscript') ? 'v2' : 't';
    QR.captcha = Captcha[captchaVersion];

    let sc;
    if (!Conf['Quick Reply']) { return; }

    this.posts = [];

    $.on(d, '4chanXInitFinished', () => BoardConfig.ready(QR.initReady));

    Callbacks.Post.push({
      name: 'Quick Reply',
      cb:   this.node
    });

    this.shortcut = (sc = $.el('a', {
      className: 'disabled',
      title: 'Quick Reply',
      href: 'javascript:;',
    }));
    Icon.set(this.shortcut, 'comment', 'Quick Reply')
    $.on(sc, 'click', function() {
      if (!QR.postingIsEnabled) { return; }
      if (Conf['Persistent QR'] || !QR.nodes || QR.nodes.el.hidden) {
        QR.open();
        QR.nodes.com.focus();
      } else {
        QR.close();
      }
    });

    UIState.addShortcut('qr', sc, 540);

    window.addEventListener('message', event => {
      if (!QR.isTrustedMessageOrigin(event.origin)) { return; }
      const error = event.data?.twister?.error;
      if (typeof error === 'string') {
        QR.error(error);
      }
    });
  },

  // 4chan's captcha frame reports failures by posting {twister: {error, cd}} up
  // to the parent, and it posts from sys.<domain>.org -- never the board's own
  // origin. A same-origin-only check therefore dropped every one of them, so a
  // captcha error from the frame reached the user as silence.
  //
  // Deliberately an exact match against that one extra origin. QR.error()
  // renders a string through $.tn() so there is no markup injection here, but
  // anything looser would still hand an embedded frame a channel for putting
  // arbitrary text in front of the user as if the site had said it.
  isTrustedMessageOrigin(origin: string) {
    return (origin === location.origin) ||
      (origin === `https://sys.${location.hostname.split('.')[1]}.org`);
  },

  initReady() {
    QR.postingIsEnabled = true;

    const {config} = g.BOARD;
    const prop = (key, def) => +(config[key] ?? def);

    QR.min_width  = prop('min_image_width',  1);
    QR.min_height = prop('min_image_height', 1);
    QR.max_width  = (QR.max_height = 10000);

    QR.max_size       = prop('max_filesize',      4194304);
    QR.max_size_video = prop('max_webm_filesize', QR.max_size);
    QR.max_comment    = prop('max_comment_chars', 2000);

    QR.max_width_video = (QR.max_height_video = 2048);
    QR.max_duration_video = prop('max_webm_duration', 120);

    QR.forcedAnon = !!config.forced_anon;
    QR.spoiler    = !!config.spoilers;

    const origToggle = $.id('togglePostFormLink');
    if (origToggle) {
      const link = $.el('h1',
        {className: "qr-link-container"});
      $.extend(link, {
        innerHTML:
          `<a href="javascript:;" class="qr-link">${g.VIEW === "thread" ? "Reply to Thread" : "Start a Thread"}</a>`
      });

      QR.link = link.firstElementChild as HTMLElement;
      $.on(link.firstChild, 'click', function() {
        QR.open();
        return QR.nodes.com.focus();
      });

      $.before(origToggle, link);
      origToggle.firstElementChild.textContent = 'Original Form';
    }

    if (g.VIEW === 'thread') {
      const linkBot = $.el('div',
        {className: "brackets-wrap qr-link-container-bottom"});
      $.extend(linkBot, {innerHTML: '<a href="javascript:;" class="qr-link-bottom">Reply to Thread</a>'});

      $.on(linkBot.firstElementChild, 'click', function() {
        QR.open();
        return QR.nodes.com.focus();
      });

      const navLinksBot = $('.navLinksBot');
      if (navLinksBot) { $.prepend(navLinksBot, linkBot); }
    }

    $.on(d, 'QRGetFile',          QR.getFile);
    $.on(d, 'QRDrawFile',         QR.drawFile);
    $.on(d, 'QRSetFile',          QR.setFile);

    $.on(d, 'paste',              QR.paste);
    $.on(d, 'dragover',           QR.dragOver);
    $.on(d, 'drop',               QR.dropFile);
    $.on(d, 'dragstart dragend',  QR.drag);

    $.on(d, 'IndexRefreshInternal', QR.generatePostableThreadsList);
    $.on(d, 'ThreadUpdate', QR.statusCheck);

    if (!Conf['Persistent QR']) { return; }
    QR.open();
    if (Conf['Auto Hide QR']) { return QR.hide(); }
  },

  statusCheck() {
    if (!QR.nodes) { return; }
    const {thread} = QR.posts[0];
    if ((thread !== 'new') && g.threads.get(`${g.BOARD.ID}.${thread}`).isDead) {
      return QR.abort();
    } else {
      return QR.status();
    }
  },

  node() {
    $.on(this.nodes.quote, 'click', QR.quote);
    if (this.isFetchedQuote) { return QR.generatePostableThreadsList(); }
  },

  open() {
    if (QR.nodes) {
      if (QR.nodes.el.hidden) { QR.captcha.setup(); }
      QR.nodes.el.hidden = false;
      QR.unhide();
    } else {
      try {
        QR.dialog();
      } catch (err) {
        delete QR.nodes;
Callbacks.handleErrors({
          message: 'Quick Reply dialog creation crashed.',
          error: err
        });
        return;
      }
    }
    return $.rmClass(QR.shortcut, 'disabled');
  },

  close() {
    if (QR.req) {
      QR.abort();
      return;
    }
    QR.nodes.el.hidden = true;
    QR.cleanNotifications();
    QR.blur();
    $.rmClass(QR.nodes.el, 'dump');
    $.addClass(QR.shortcut, 'disabled');
    new QR.post(true); // NOSONAR: constructor pushes to QR.posts
    for (let post of QR.posts.splice(0, QR.posts.length - 1)) {
      post.delete();
    }
    QR.cooldown.auto = false;
    QR.status();
    return QR.captcha.destroy();
  },

  focus() {
    return $.queueTask(function() {
      if (!QR.inBubble()) {
        QR.hasFocus = d.activeElement && QR.nodes.el.contains(d.activeElement);
        return QR.nodes.el.classList.toggle('focus', QR.hasFocus);
      }
    });
  },

  inBubble() {
    const bubbles = $$('iframe[src^="https://www.google.com/recaptcha/api2/frame"]');
    return bubbles.includes(d.activeElement) || bubbles.some(el => (getComputedStyle(el).visibility !== 'hidden') && (el.getBoundingClientRect().bottom > 0));
  },

  hide() {
    QR.blur();
    $.addClass(QR.nodes.el, 'autohide');
    QR.nodes.autohide.checked = true;
  },

  unhide() {
    $.rmClass(QR.nodes.el, 'autohide');
    QR.nodes.autohide.checked = false;
  },

  toggleHide() {
    if (this.checked) {
      return QR.hide();
    } else {
      return QR.unhide();
    }
  },

  blur() {
    if (QR.nodes.el.contains(d.activeElement)) { return d.activeElement.blur(); }
  },

  toggleSJIS(e) {
    e.preventDefault();
    Conf['sjisPreview'] = !Conf['sjisPreview'];
    $.set('sjisPreview', Conf['sjisPreview']);
    return QR.nodes.el.classList.toggle('sjis-preview', Conf['sjisPreview']);
  },

  texPreviewShow() {
    if ($.hasClass(QR.nodes.el, 'tex-preview')) { return QR.texPreviewHide(); }
    $.addClass(QR.nodes.el, 'tex-preview');
    QR.nodes.texPreview.textContent = QR.nodes.com.value;
    return $.event('mathjax', null, QR.nodes.texPreview);
  },

  texPreviewHide() {
    return $.rmClass(QR.nodes.el, 'tex-preview');
  },

  createPost(select = false) {
    return new QR.post(select);
  },

  addPost() {
    const wasOpen = (QR.nodes && !QR.nodes.el.hidden);
    QR.open();
    if (wasOpen) {
      $.addClass(QR.nodes.el, 'dump');
      QR.createPost(true);
    }
    return QR.nodes.com.focus();
  },

  setCustomCooldown(enabled) {
    Conf['customCooldownEnabled'] = enabled;
    QR.cooldown.customCooldown = enabled;
    return QR.nodes.customCooldown.classList.toggle('disabled', !enabled);
  },

  toggleCustomCooldown() {
    const enabled = $.hasClass(QR.nodes.customCooldown, 'disabled');
    QR.setCustomCooldown(enabled);
    return $.set('customCooldownEnabled', enabled);
  },

  error(err: any, focusOverride?: boolean) {
    let el;
    QR.open();
    if (typeof err === 'string') {
      el = $.tn(err);
    } else {
      el = err;
      el.removeAttribute('style');
    }
    const notice = new Notice('warning', el);
    QR.notifications.push(notice);
    if (!UIState.areNotificationsEnabled) {
      if (d.hidden && !QR.cooldown.auto) { return alert(el.textContent); }
    } else if (d.hidden || !(focusOverride || d.hasFocus())) {
      const notif = new Notification(el.textContent, {
        body: el.textContent,
        icon: Favicon.logo
      }
      );
      notif.onclick = () => window.focus();
      if ($.engine !== 'gecko') {
        // Firefox automatically closes notifications
        // so we can't control the onclose properly.
        notif.onclose = () => notice.close();
        notif.onshow = () => setTimeout(function() {
          notif.onclose = null;
          return notif.close();
        }
        , 7 * SECOND);
        return notif.onshow;
      }
    }
  },

  connectionError() {
    return $.el('span',
      { innerHTML:
        'Connection error while posting. ' +
        '[<a href="' + E(meta.upstreamFaq) + '#connection-errors" target="_blank">More info</a>]'
      }
    );
  },

  notifications: [],

  cleanNotifications() {
    for (let notification of QR.notifications) {
      notification.close();
    }
    QR.notifications = [];
  },

  /* Returns true if the QR is disabled. */
  status() {
    let disabled, value;
    if (!QR.nodes) { return; }
    const {thread} = QR.posts[0];
    if ((thread !== 'new') && g.threads.get(`${g.BOARD.ID}.${thread}`).isDead) {
      value    = 'Dead';
      disabled = true;
      QR.cooldown.auto = false;
    }

    value = QR.req ? QR.req.progress : QR.cooldown.seconds || value;

    const {status} = QR.nodes;
    if (!value) {
      status.value = 'Submit';
    } else if (QR.cooldown.auto) {
      status.value = `Auto ${value}`;
    } else {
      status.value = value;
    }
    status.disabled = disabled || false;
    return status.disabled;
  },

  openPost() {
    QR.open();
    if (QR.selected.isLocked) {
      const index = QR.posts.indexOf(QR.selected);
      (QR.posts[index+1] || QR.createPost()).select();
      $.addClass(QR.nodes.el, 'dump');
      QR.cooldown.auto = true;
      return true;
    }
  },

  quote(e) {
    let range;
    e?.preventDefault();
    if (!QR.postingIsEnabled) { return; }
    const sel  = d.getSelection();
    const post = Get.postFromNode(this);
    const {root} = post.nodes;
    const postRange = new Range();
    postRange.selectNode(root);
    let text = post.board.ID === g.BOARD.ID ? `>>${post}\n` : `>>>/${post.board}/${post}\n`;
    for (let i = 0; i < sel.rangeCount; i++) {
      try {
        const quoted = QR.quoteRange(sel.getRangeAt(i), postRange, root);
        if (quoted) { text += quoted; }
      } catch (error) {
Callbacks.handleErrors({
          message: 'Quick Reply quote extraction failed.',
          error
        });
      }
    }

    QR.openPost();
    const {com, thread} = QR.nodes;
    if (!com.value) { thread.value = Get.threadFromNode(this); }

    const wasOnlyQuotes = QR.selected.isOnlyQuotes();

    const caretPos = com.selectionStart;
    // Replace selection for text.
    com.value = com.value.slice(0, caretPos) + text + com.value.slice(com.selectionEnd);
    // Move the caret to the end of the new quote.
    range = caretPos + text.length;
    com.setSelectionRange(range, range);
    com.focus();

    // This allows us to determine if any text other than quotes has been typed.
    if (wasOnlyQuotes) { QR.selected.quotedText = com.value; }

    QR.selected.save(com);
    return QR.selected.save(thread);
  },

  // Converts one selection range into quoted text ('>...'), or null if the range is empty after trimming to the post.
  quoteRange(range: Range, postRange: Range, root: HTMLElement): string | null {
    let node;
    // Trim range to be fully inside post
    if (range.compareBoundaryPoints(Range.START_TO_START, postRange) < 0) {
      range.setStartBefore(root);
    }
    if (range.compareBoundaryPoints(Range.END_TO_END, postRange) > 0) {
      range.setEndAfter(root);
    }

    if (!range.toString().trim()) { return null; }

    const frag = range.cloneContents();
    const ancestor = range.commonAncestorContainer;
    // Quoting the insides of a spoiler/code tag.
    if ($.x('ancestor-or-self::*[self::s or contains(@class,"removed-spoiler")]', ancestor)) {
      $.prepend(frag, $.tn('[spoiler]'));
      $.add(frag, $.tn('[/spoiler]'));
    }
    const insideCode = $.x('ancestor-or-self::pre[contains(@class,"prettyprint")]', ancestor);
    if (insideCode) {
      $.prepend(frag, $.tn('[code]'));
      $.add(frag, $.tn('[/code]'));
    }
    for (node of $$((insideCode ? 'br' : '.prettyprint br'), frag)) {
      $.replace(node, $.tn('\n'));
    }
    for (node of $$('br', frag)) {
      if (node !== frag.lastChild) { $.replace(node, $.tn('\n>')); }
    }
    g.SITE.insertTags?.(frag);
    for (node of $$('.linkify[data-original]', frag)) {
      $.replace(node, $.tn(node.dataset.original));
    }
    for (node of $$('.embedder', frag)) {
      if (node.previousSibling?.nodeValue === ' ') { $.rm(node.previousSibling); }
      $.rm(node);
    }
    return `>${frag.textContent.trim()}\n`;
  },

  characterCount() {
    const counter = QR.nodes.charCount;
    const count   = QR.nodes.com.value.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '_').length;
    counter.textContent = count.toString();
    counter.hidden      = count < (QR.max_comment/2);

    const splitPost = QR.nodes.splitPost;
    splitPost.hidden = count < QR.max_comment;

    return (count > QR.max_comment ? $.addClass : $.rmClass)(counter, 'warning');
  },

  splitPost() {
    if (QR.selected.isLocked) return;
    const count = QR.nodes.com.value.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '_').length;
    if (count < QR.max_comment) return;
    const text = QR.nodes.com.value;
    let lastPostLength = 0;
    let splitCount = 0;
    const idx = QR.posts.indexOf(QR.selected);
    QR.selected.setComment("");

    for (const line of text.split("\n")) {
      const currentLength = line.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '_').length + 1 // +1 for newline at end
      if (currentLength + lastPostLength > QR.max_comment) {
        const post = QR.createPost(true);
        post.setComment(line);
        lastPostLength = currentLength;
        splitCount++;
      } else {
        const newComment = [QR.selected.com, line].filter(el => el !== null).join('\n');
        QR.selected.setComment(newComment);
        lastPostLength += currentLength;
      }
    }
    const newPostIdx = QR.posts.length - splitCount;
    const newPosts = QR.posts.splice(newPostIdx, splitCount)
    QR.posts.splice(idx + 1, 0, ...newPosts);
    const rearrangedDumpList = [...QR.nodes.dumpList.children];
    const newDumps = rearrangedDumpList.splice(newPostIdx, splitCount);
    rearrangedDumpList.splice(idx + 1, 0, ...newDumps);

    for (const e of rearrangedDumpList) {
      QR.nodes.dumpList.appendChild(e);
    }

    QR.nodes.el.classList.add('dump');
  },

  getFile() {
    return $.event('QRFile', QR.selected?.file);
  },

  drawFile(e) {
    const file = QR.selected?.file;
    if (!file || !/^(image|video)\//.test(file.type)) { return; }
    const isVideo = file.type.startsWith('video/');
    const el = $.el((isVideo ? 'video' : 'img'));
    $.on(el, 'error', () => QR.openError());
    $.on(el, (isVideo ? 'loadeddata' : 'load'), function() {
      e.target.getContext('2d').drawImage(el, 0, 0);
      URL.revokeObjectURL(el.src);
      return $.event('QRImageDrawn', null, e.target);
    });
    el.src = URL.createObjectURL(file);
    return el.src;
  },

  openError() {
    const div = $.el('div');
    $.extend(div, {
      innerHTML:
        'Could not open file. [<a href="' + E(meta.upstreamFaq) + '#error-reading-metadata" target="_blank">More info</a>]'
    });
    return QR.error(div);
  },

  setFile(e) {
    const {file, name, source} = e.detail;
    if (name != null) { file.name   = name; }
    if (source != null) { file.source = source; }
    QR.open();
    return QR.handleFiles([file]);
  },

  drag(e) {
    // Let it drag anything from the page.
    const toggle = e.type === 'dragstart' ? $.off : $.on;
    toggle(d, 'dragover', QR.dragOver);
    return toggle(d, 'drop',     QR.dropFile);
  },

  dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    return e.dataTransfer.dropEffect;
  }, // cursor feedback

  dropFile(e) {
    // Let it only handle files from the desktop.
    if (!e.dataTransfer.files.length) { return; }
    e.preventDefault();
    QR.open();
    return QR.handleFiles(e.dataTransfer.files);
  },

  paste(e) {
    if (!e.clipboardData.items) { return; }
    let file = null;
    let score = -1;
    for (let item of e.clipboardData.items) {
      let file2;
      file2 = item.kind === 'file' ? item.getAsFile() : null;
      if (file2) {
        let score2 = (2* +(file2.size <= QR.max_size)) + +(file2.type === 'image/png');
        if (score2 > score) {
          file = file2;
          score = score2;
        }
      }
    }
    if (file) {
      const {type} = file;
      const blob = new Blob([file], {type});
      blob.name = `${Conf['pastedname']}.${$.getOwn(QR.extensionFromType, type) || 'jpg'}`;
      QR.open();
      QR.handleFiles([blob]);
    }
  },

  pasteFF() {
    const {pasteArea} = QR.nodes;
    if (!pasteArea.childNodes.length) { return; }
    const images = $$('img', pasteArea);
    $.rmAll(pasteArea);
    for (let img of images) {
      let {src} = img;
      const m = /data:(image\/(\w+));base64,(.+)/.exec(src);
      if (m) {
        let bstr = atob(m[3]);
        let arr = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) {
          arr[i] = bstr.codePointAt(i)!;
        }
        let blob = new Blob([arr], {type: m[1]});
        blob.name = `${Conf['pastedname']}.${m[2]}`;
        QR.handleFiles([blob]);
      } else if (src.startsWith('http://') || src.startsWith('https://')) {
        QR.handleUrl(src);
      }
    }
  },

  handleUrl(urlDefault) {
    QR.open();
    const { selected } = QR;
    selected.preventAutoPost();
    CrossOrigin.permission(function() {
      const url = prompt('Enter a URL:', urlDefault);
      if (!url) return;
      QR.nodes.fileButton.focus();
      CrossOrigin.file(url, function(blob) {
        if (blob && !blob.type.startsWith('text/')) {
          selected.setFile(blob);
          $.addClass(QR.nodes.el, 'dump');
        } else {
          QR.error("Can't load file.");
        }
      });
    });
  },

  handleFiles(files: File[]) {
    if (this !== QR) { // file input
      files  = [...this.files];
      this.value = null;
    }
    if (!files.length) { return; }
    QR.cleanNotifications();
    for (let file of files) {
      QR.handleFile(file, files.length);
    }
    $.addClass(QR.nodes.el, 'dump');
    if ((d.activeElement === QR.nodes.fileButton) && $.hasClass(QR.nodes.fileSubmit, 'has-file')) {
      return QR.nodes.filename.focus();
    }
  },

  handleFile(file: File, nfiles: number) {
    let post;
    const isText = file.type.startsWith('text/');
    if (nfiles === 1) {
      post = QR.selected;
    } else {
      post = QR.posts[QR.posts.length - 1];
      if (isText ? post.com || post.pasting : post.file) {
        post = QR.createPost();
      }
    }
    return post[isText ? 'pasteText' : 'setFile'](file);
  },

  openFileInput() {
    if (QR.nodes.fileButton.disabled) { return; }
    QR.nodes.fileInput.click();
    return QR.nodes.fileButton.focus();
  },

  generatePostableThreadsList() {
    if (!QR.nodes) { return; }
    const list    = QR.nodes.thread;
    const options = [list.firstElementChild];
    for (let thread of g.BOARD.threads.keys) {
      options.push($.el('option', {
        value: thread,
        textContent: `Thread ${thread}`
      }
      )
      );
    }
    const val = list.value;
    $.rmAll(list);
    $.add(list, options);
    list.value = val;
    if (list.value === val) { return; }
    // Fix the value if the option disappeared.
    list.value = g.VIEW === 'thread' ?
      g.THREADID
    :
      'new';
    return (g.VIEW === 'thread' ? $.addClass : $.rmClass)(QR.nodes.el, 'reply-to-thread');
  },

  dialog() {
    let dialog, event, nodes: typeof QR.nodes;
    let name;
    dialog = UI.dialog('qr', { innerHTML: QuickReplyPage });
    QR.nodes = (nodes = {
      el: dialog
    } as typeof QR.nodes);

    const setNode = (name, query) => nodes[name] = $(query, dialog);

    setNode('move',           '.move');
    setNode('autohide',       '#autohide');
    setNode('close',          '.close');
    setNode('thread',         'select');
    setNode('form',           'form');
    setNode('sjisToggle',     '#sjis-toggle');
    setNode('texButton',      '#tex-preview-button');
    setNode('name',           '[data-name=name]');
    setNode('email',          '[data-name=email]');
    setNode('sub',            '[data-name=sub]');
    setNode('com',            '[data-name=com]');
    setNode('charCount',      '#char-count');
    setNode('texPreview',     '#tex-preview');
    setNode('dumpList',       '#dump-list');
    setNode('addPost',        '#add-post');
    setNode('oekaki',         '.oekaki');
    setNode('drawButton',     '#qr-draw-button');
    setNode('randomizeButton','#qr-randomize');
    setNode('compress',       '#qr-jpg');
    setNode('view',           '#qr-view');
    setNode('restoreNameButton','#qr-restore-name');
    setNode('fileSubmit',     '#file-n-submit');
    setNode('fileButton',     '#qr-file-button');
    setNode('noFile',         '#qr-no-file');
    setNode('filename',       '#qr-filename');
    setNode('spoiler',        '#qr-file-spoiler');
    setNode('oekakiButton',   '#qr-oekaki-button');
    setNode('fileRM',         '#qr-filerm');
    setNode('urlButton',      '#url-button');
    setNode('pasteArea',      '#paste-area');
    setNode('customCooldown', '#custom-cooldown-button');
    setNode('dumpButton',     '#dump-button');
    setNode('status',         '[type=submit]');
    setNode('flashTag',       '[name=filetag]');
    setNode('fileInput',      '[type=file]');
    setNode('splitPost',      '#split-post')

    const {config} = g.BOARD;
    const {classList} = QR.nodes.el;
    classList.toggle('forced-anon',  QR.forcedAnon);
    classList.toggle('has-spoiler',  QR.spoiler);
    classList.toggle('has-sjis',     !!config.sjis_tags);
    classList.toggle('has-math',     !!config.math_tags);
    classList.toggle('sjis-preview', !!config.sjis_tags && Conf['sjisPreview']);
    classList.toggle('show-new-thread-option', Conf['Show New Thread Option in Threads']);

    if (Number.parseInt(Conf['customCooldown'], 10) > 0) {
      $.addClass(QR.nodes.fileSubmit, 'custom-cooldown');
      $.get('customCooldownEnabled', Conf['customCooldownEnabled'], function({customCooldownEnabled}) {
        QR.setCustomCooldown(customCooldownEnabled);
        return $.sync('customCooldownEnabled', QR.setCustomCooldown);
      });
    }

    QR.flagsInput();

    $.on(nodes.autohide,       'change',    QR.toggleHide);
    $.on(nodes.close,          'click',     QR.close);
    $.on(nodes.status,         'click',     QR.submit);
    $.on(nodes.form,           'submit',    QR.submit);
    $.on(nodes.sjisToggle,     'click',     QR.toggleSJIS);
    $.on(nodes.texButton,      'mousedown', QR.texPreviewShow);
    $.on(nodes.texButton,      'mouseup',   QR.texPreviewHide);
    $.on(nodes.addPost,        'click',     () => QR.createPost(true));
    $.on(nodes.drawButton,     'click',     QR.oekaki.draw);
    $.on(nodes.fileButton,     'click',     QR.openFileInput);
    $.on(nodes.noFile,         'click',     QR.openFileInput);
    $.on(nodes.randomizeButton,'click',     () => { QR.selected.randomizeName(); });
    $.on(nodes.compress,       'click',     async () => { QR.handleFiles([await QR.convert(QR.selected.file)]); });
    $.on(nodes.view,           'click',     QR.preview);
    $.on(nodes.restoreNameButton,'click',   () => { QR.selected.restoreName(); });
    $.on(nodes.filename,       'focus',     function() { return $.addClass(this.parentNode, 'focus'); });
    $.on(nodes.filename,       'blur',      function() { return $.rmClass(this.parentNode, 'focus'); });
    $.on(nodes.spoiler,        'change',    () => QR.selected.nodes.spoiler.click());
    $.on(nodes.oekakiButton,   'click',     QR.oekaki.button);
    $.on(nodes.fileRM,         'click',     () => QR.selected.rmFile());
    $.on(nodes.urlButton,      'click',     () => QR.handleUrl(''));
    $.on(nodes.customCooldown, 'click',     QR.toggleCustomCooldown);
    $.on(nodes.dumpButton,     'click',     () => nodes.el.classList.toggle('dump'));
    $.on(nodes.fileInput,      'change',    QR.handleFiles);
    $.on(nodes.splitPost,      'click',     QR.splitPost);

    window.addEventListener('focus', QR.focus, true);
    window.addEventListener('blur',  QR.focus, true);
    // We don't receive blur events from captcha iframe.
    $.on(d, 'click', QR.focus);

    // XXX Workaround for image pasting in Firefox, obsolete as of v50.
    // https://bugzilla.mozilla.org/show_bug.cgi?id=906420
    if (($.engine === 'gecko') && !window.DataTransferItemList) {
      nodes.pasteArea.hidden = false;
    }
    new MutationObserver(QR.pasteFF).observe(nodes.pasteArea, {childList: true});

    // save selected post's data
    const items = ['thread', 'name', 'email', 'sub', 'com', 'filename', 'flag'];
    let i = 0;
    const save = function() { QR.selected.save(this); };
    while (i < items.length) {
      name = items[i++];
      let node;
      node = nodes[name];
      if (!node) { continue; }
      event = node.nodeName === 'SELECT' ? 'change' : 'input';
      $.on(nodes[name], event, save);
    }

    if (Conf['Remember QR Size']) {
      $.get('QR Size', '', item => nodes.com.style.cssText = item['QR Size']);
      $.on(nodes.com, 'mouseup', function(e) {
        if (e.button !== 0) { return; }
        $.set('QR Size', this.style.cssText);
      });
    }

    QR.generatePostableThreadsList();
    QR.persona.load();
    QR.createPost(true);
    QR.status();
    QR.cooldown.setup();
    QR.captcha.init();

    $.add(d.body, dialog);
    QR.captcha.setup();
    QR.oekaki.setup();

    // Create a custom event when the QR dialog is first initialized.
    // Use it to extend the QR's functionalities, or for XTRM RICE.
    $.event('QRDialogCreation', null, dialog);

    Icon.set(nodes.oekakiButton, 'pencil');
    Icon.set(nodes.urlButton, 'link');
    Icon.set(nodes.pasteArea, 'clipboard');
    Icon.set(nodes.customCooldown, 'clock');
    Icon.set(nodes.randomizeButton, 'shuffle');
    Icon.set(nodes.compress, 'shrink');
    Icon.set(nodes.view, 'eye');
    Icon.set(nodes.restoreNameButton, 'undo');
    Icon.set(nodes.splitPost, 'scissors');
    Icon.set(nodes.fileRM, 'xmark');
    Icon.set(nodes.close, 'xmark');
    Icon.set(nodes.dumpButton, 'squarePlus');
    Icon.set(nodes.addPost, 'plus');
  },

  flags() {
    const select = $.el('select', {
      name:      'flag',
      className: 'flagSelector'
    }) as HTMLSelectElement;

    const addFlag = (value, textContent) => $.add(select, $.el('option', {value, textContent}));

    addFlag('0', (g.BOARD.config.country_flags ? 'Geographic Location' : 'None'));
    for (let value in g.BOARD.config.board_flags) {
      let textContent = g.BOARD.config.board_flags[value];
      addFlag(value, textContent);
    }

    return select;
  },

  flagsInput() {
    const {nodes} = QR;
    if (!nodes) { return; }
    if (nodes.flag) {
      $.rm(nodes.flag);
      delete nodes.flag;
    }

    if (g.BOARD.config.board_flags) {
      const flag = QR.flags();
      flag.dataset.name    = 'flag';
      flag.dataset.default = '0';
      nodes.flag = flag;
      return $.add(nodes.form, flag);
    }
  },

  submit(e) {
    e?.preventDefault();
    const force = e?.shiftKey;

    if (QR.req) {
      QR.abort();
      return;
    }

    $.forceSync('cooldowns');
    if (QR.cooldown.seconds) {
      if (force) {
        QR.cooldown.clear();
      } else {
        QR.cooldown.auto = !QR.cooldown.auto;
        QR.status();
        return;
      }
    }

    const post = QR.posts[0];
    delete post.quotedText;
    post.forceSave();
    let threadID = post.thread;
    const thread = g.BOARD.threads.get(threadID);
    const filetag = (g.BOARD.ID === 'f') && (threadID === 'new') ? QR.nodes.flashTag.value : undefined;

    // prevent errors
    if (threadID === 'new') { threadID = null; }
    let err = QR.getSubmissionError(post, threadID, thread);
    let captcha;
    ({captcha, err} = QR.acquireCaptcha(threadID, err, force));

    QR.cleanNotifications();
    if (err && !force) {
      // stop auto-posting
      QR.cooldown.auto = false;
      QR.status();
      QR.error(err);
      return;
    }

    // Enable auto-posting if we have stuff to post, disable it otherwise.
    QR.cooldown.auto = QR.posts.length > 1;

    post.lock();

    const formData = {
      MAX_FILE_SIZE: QR.max_size,
      mode:     'regist',
      pwd:      QR.persona.getPassword(),
      resto:    threadID,
      name:     (!QR.forcedAnon ? post.name : undefined),
      email:    post.email,
      sub:      (!QR.forcedAnon && !threadID ? post.sub : undefined),
      com:      post.com,
      upfile:   post.file,
      filetag,
      spoiler:  post.spoiler,
      flag:     post.flag,
    };

    const options = {
      responseType: 'document',
      withCredentials: true,
      onloadend: QR.response,
      form: $.formData(formData)
    };
    if (Conf['Show Upload Progress']) {
      options.onprogress = QR.uploadProgress;
    }

    QR.sendPost(captcha, options, post);

    // Starting to upload might take some time.
    // Provide some feedback that we're starting to submit.
    QR.status();
  },

  // Acquires a captcha if one is needed. May replace `err` with a captcha error.
  acquireCaptcha(threadID: number | null, err: string | undefined, force: boolean) {
    let captcha;
    if (QR.captcha.isEnabled && !((QR.captcha === Captcha.v2) && /\b_ct=/.test(d.cookie) && threadID) && !(err && !force)) {
      captcha = QR.captcha.getOne(!!threadID);
      if ((QR.captcha === Captcha.v2) && !captcha) { captcha = Captcha.cache.request(!!threadID); }
      if (!captcha) {
        err = 'No valid captcha.';
        QR.captcha.setup(!QR.cooldown.auto || (d.activeElement === QR.nodes.status));
      }
    }
    return {captcha, err};
  },

  // Returns an error message preventing submission, or undefined if the post can be submitted.
  getSubmissionError(post, threadID: number | null, thread): string | undefined {
    let err;
    if (!threadID) {
      if (!!g.BOARD.config.require_subject && !post.sub) {
        err = 'New threads require a subject.';
      } else if (!g.BOARD.config.text_only && !post.file) {
        err = 'No file selected.';
      }
    } else if (g.BOARD.threads.get(threadID).isClosed) {
      err = 'You can\'t reply to this thread anymore.';
    } else if (!post.com && !post.file) {
      err = 'No comment or file.';
    } else if (post.file && thread.fileLimit) {
      err = 'Max limit of image replies has been reached.';
    }

    if (!err && (g.BOARD.ID === 'r9k') && !/[a-z-]/i.test(post.com || '')) {
      err = 'Original comment required.';
    }
    return err;
  },

  uploadProgress(e) {
    if (this !== QR.req?.upload) { return; } // aborted
    if (e.loaded < e.total) {
      // Uploading...
      QR.req.progress = `${Math.round((e.loaded / e.total) * 100)}%`;
    } else {
      // Upload done, waiting for server response.
      QR.req.isUploadFinished = true;
      QR.req.progress = '...';
    }
    return QR.status();
  },

  // Sends the post, first waiting on captcha verification if `captcha` is a pending callback.
  sendPost(captcha, options, post) {
    let cb = function(response) {
      if (response != null) {
        QR.currentCaptcha = response;
        if (QR.captcha === Captcha.v2) {
          if (response.challenge != null) {
            options.form.append('recaptcha_challenge_field', response.challenge);
            options.form.append('recaptcha_response_field', response.response);
          } else {
            options.form.append('g-recaptcha-response', response.response);
          }
        } else {
          for (let key in response) {
            let val = response[key];
            options.form.append(key, val);
          }
        }
      }
      QR.req = $.ajax(`https://sys.${location.hostname.split('.')[1]}.org/${g.BOARD.ID}/post`, options);
      QR.req.progress = '...';
    };

    if (typeof captcha === 'function') {
      // Wait for captcha to be verified before submitting post.
      QR.req = {
        progress: '...',
        abort() {
          if (QR.captcha === Captcha.v2) {
            Captcha.cache.abort();
          }
          cb = null;
        }
      };
      captcha(function(response) {
        if ((QR.captcha === Captcha.v2) && Captcha.cache.haveCookie()) {
          if (cb) { cb(); }
          if (response) { return Captcha.cache.save(response); }
        } else if (response) {
          if (cb) { cb(response); }
        } else {
          delete QR.req;
          post.unlock();
          QR.cooldown.auto = !!Captcha.cache.getCount();
          QR.status();
        }
      });
    } else {
      cb(captcha);
    }
  },

  response() {
    let connErr = false, err;
    if (this !== QR.req) { return; } // aborted
    delete QR.req;

    const post = QR.posts[0];
    post.unlock();

    err = this.response?.getElementById('errmsg');
    if (err) { // error!
      const el = $('a', err);
      if (el) el.target = '_blank'; // duplicate image link
    } else {
      connErr = this.response?.title !== 'Post successful!';
      if (connErr) {
        err = QR.connectionError();
        if ((QR.captcha === Captcha.v2) && QR.currentCaptcha) { Captcha.cache.save(QR.currentCaptcha); }
      } else if (this.status !== 200) {
        err = `Error ${this.statusText} (${this.status})`;
      }
    }

    if (!connErr) { QR.captcha.setUsed?.(); }
    delete QR.currentCaptcha;

    if (err) {
      QR.handleSubmitError(err, connErr, post);
      return;
    }

    delete QR.errorCount;
    QR.handleSubmitSuccess(this.response, post);
  },

  // Handles a failed submission: adjusts auto-posting/cooldowns per error type and reports the error.
  handleSubmitError(err, connErr: boolean, post) {
    QR.errorCount = (QR.errorCount || 0) + 1;
    if (/captcha|verification/i.test(err.textContent)) {
      // Remove the obnoxious 4chan Pass ad.
      if (/mistyped/i.test(err.textContent)) {
        err = 'You mistyped the CAPTCHA, or the CAPTCHA malfunctioned.';
      } else if (/expired/i.test(err.textContent)) {
        err = 'This CAPTCHA is no longer valid because it has expired.';
      }
      // Do not auto post with a wrong captcha.
      QR.cooldown.auto = false;
    } else if (connErr) {
      if (QR.errorCount >= 5) {
        // Too many posting errors can ban you. Stop autoposting after 5 errors.
        QR.cooldown.auto = false;
      } else {
        // Something must've gone terribly wrong if you get captcha errors without captchas.
        // Don't auto-post indefinitely in that case.
        QR.cooldown.auto = QR.captcha.isEnabled || connErr;
        // Too many frequent mistyped captchas will auto-ban you!
        // On connection error, the post most likely didn't go through.
        // If the post did go through, it should be stopped by the duplicate reply cooldown.
        QR.cooldown.addDelay(post, 2);
      }
    } else {
      QR.handleDelayError(err, post);
    }
    QR.captcha.setup(QR.cooldown.auto && [QR.nodes.status, d.body].includes(d.activeElement));
    QR.status();
    QR.error(err);
  },

  // Parses posting-delay error messages ("you must wait n minutes") and sets cooldowns accordingly.
  handleDelayError(err, post) {
    const delayText = err.textContent || '';
    const delayPattern = /\d+\s+(?:minute|second)/gi; // NOSONAR \d and \s are disjoint char classes, no backtracking ambiguity; already linear
    const m = [];
    let delayMatch = delayPattern.exec(delayText);
    while (delayMatch) {
      m.push(delayMatch[0]);
      delayMatch = delayPattern.exec(delayText);
    }
    if (m.length && !/duplicate|hour/i.test(delayText)) {
      QR.cooldown.auto = !/have\s+been\s+muted/i.test(err.textContent);
      let seconds = 0;
      for (let mi of m) {
        seconds += (/minute/i.test(mi) ? 60 : 1) * (+/\d+/.exec(mi)[0]);
      }
      if (/muted/i.test(err.textContent)) {
        QR.cooldown.addMute(seconds);
      } else {
        QR.cooldown.addDelay(post, seconds);
      }
    } else {
      QR.cooldown.auto = false;
    }
  },

  // Handles a confirmed successful submission: fires events, rotates the post queue, and opens the posted thread.
  handleSubmitSuccess(response, post) {
    const h1 = $('h1', response);

    let [_, threadID, postID] = /thread:(\d+),no:(\d+)/.exec(h1.nextSibling.textContent);
    postID   = +postID;
    threadID = +threadID || postID;
    const isReply  = threadID !== postID;

    // Post/upload confirmed as successful.
    $.event('QRPostSuccessful', {
      boardID: g.BOARD.ID,
      threadID,
      postID
    });
    // XXX deprecated
    $.event('QRPostSuccessful_', {boardID: g.BOARD.ID, threadID, postID});

    // Enable auto-posting if we have stuff left to post, disable it otherwise.
    const postsCount = QR.posts.length - 1;
    QR.cooldown.auto = postsCount && isReply;

    const lastPostToThread = !QR.posts.slice(1).some(p => p.thread === post.thread);

    if (postsCount) {
      post.rm();
      QR.captcha.setup(d.activeElement === QR.nodes.status);
      QR.captcha.moreNeeded();
    } else if (Conf['Persistent QR']) {
      post.rm();
      if (Conf['Auto Hide QR']) {
        QR.hide();
      } else {
        QR.blur();
      }
    } else {
      QR.close();
    }

    QR.cleanNotifications();
    if (Conf['Posting Success Notifications']) {
      QR.notifications.push(new Notice('success', h1.textContent, 5));
    }

    QR.cooldown.add(threadID, postID);
    QR.openAfterPost(threadID, postID, postsCount, lastPostToThread);
    QR.status();
  },

  // Opens the posted thread/post in a new tab or navigates to it, depending on settings.
  openAfterPost(threadID: number, postID: number, postsCount: number, lastPostToThread: boolean) {
    let URL;
    if (threadID === postID) {
      URL = `${window.location.origin}/${g.BOARD.ID}/thread/${threadID}`;
    } else if ((threadID !== g.THREADID) && lastPostToThread && Conf['Open Post in New Tab']) {
      URL = `${window.location.origin}/${g.BOARD.ID}/thread/${threadID}#p${postID}`;
    }
    if (!URL) { return; }

    const open = Conf['Open Post in New Tab'] || postsCount ?
      () => $.open(URL)
    :
      () => location.href = URL;

    if (threadID === postID) {
      // XXX 4chan sometimes responds before the thread exists.
      QR.waitForThread(URL, open);
    } else {
      open();
    }
  },

  waitForThread(url, cb) {
    let attempts = 0;
    let check = function() {
      $.ajax(url, {
        onloadend() {
          attempts++;
          if ((attempts >= 6) || (this.status === 200)) {
            return cb();
          } else {
            return setTimeout(check, attempts * SECOND);
          }
        },
        responseType: 'text',
        type: 'HEAD'
      }
      );
    };
    check();
  },

  abort() {
    const oldReq = QR.req;
    if (oldReq && !oldReq.isUploadFinished) {
      delete QR.req;
      oldReq.abort();
      if ((QR.captcha === Captcha.v2) && QR.currentCaptcha) { Captcha.cache.save(QR.currentCaptcha); }
      delete QR.currentCaptcha;
      QR.posts[0].unlock();
      QR.cooldown.auto = false;
      QR.notifications.push(new Notice('info', 'QR upload aborted.', 5));
    }
    QR.status();
  },

  getMaxSize(file: File) {
    let max = QR.max_size;
    if (file.type.startsWith('video/')) max = Math.min(max, QR.max_size_video);
    return max;
  },

  async convert(file: File, type: 'jpeg' | 'png' = 'jpeg', options?: ConvertOptions): Promise<File> {
    const maxSize = options?.maxSize || this.getMaxSize(file);
    const img = options?.img || await createImageBitmap(file);
    const width = options?.width || img.width;
    const height = options?.height || img.height;
    const newName = file.name.replace(/\.[a-z]+$/i, '.' + type);
    const mime = 'image/' + type;

    // Fallback to HTMLCanvasElement is for old firefox versions. Once the minimum firefox >= 105, this can be
    // simplified to just the OffscreenCanvas implementation.
    // Conf['Avoid OffscreenCanvas'] is for https://codeberg.org/librewolf/issues/issues/2174
    let canvas: HTMLCanvasElement | OffscreenCanvas;
    let toBlob: (mime: string, quality: number) => Promise<Blob>;
    if (window.OffscreenCanvas && !Conf['Avoid OffscreenCanvas']) {
      canvas = new OffscreenCanvas(width, height);
      toBlob = (mime, quality) => (canvas as OffscreenCanvas).convertToBlob({ type: mime, quality });
    } else {
      canvas = $.el('canvas', { width, height }) as HTMLCanvasElement;
      toBlob = (mime, quality) => new Promise(resolve => {
        (canvas as HTMLCanvasElement).toBlob(resolve, mime, quality);
      });
    }

    let newFile: File;
    let quality = .9;

    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
    do {
      newFile = new File([await toBlob(mime, quality)], newName, { type: mime });
      quality -= .1;
    } while (type === 'jpeg' && newFile.size > maxSize && quality >= .1);

    if (newFile.size >= file.size && newFile.type === file.type) {
      QR.notifications.push(new Notice('warning', "New jpeg file isn't smaller than the old one, so it won't be used.", 3));
      return file;
    }

    return newFile;
  },

  previewUrl: undefined as string | undefined,

  preview() {
    if (!QR.selected.file) return;

    QR.nodes.preview = $.el('div', { id: 'overlay', className: 'media-preview' }) as HTMLDivElement;
    $.add(d.body, QR.nodes.preview);
    QR.previewUrl = URL.createObjectURL(QR.selected.file);
    if (QR.selected.file.type.startsWith('video/')) {
      const video = $.el('video', { controls: true, src: QR.previewUrl, autoplay: true });
      $.add(QR.nodes.preview, video);
      video.focus();
    } else {
      $.add(QR.nodes.preview, $.el('img', { src: QR.previewUrl }));
    }
    QR.nodes.preview.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName !== 'VIDEO') QR.closePreview();
    });
  },

  closePreview() {
    QR.nodes.preview.remove();
    URL.revokeObjectURL(QR.previewUrl);
  },

  cooldown: {
    seconds: 0,
    delays: {
      deletion: 60
    }, // cooldown for deleting posts/files

    // set in setup
    maxDelay: 0,
    isSetup: false,
    auto: false,
    data: {} as Record<string, any>,

    // Called from Main
    init() {
      if (!Conf['Quick Reply']) { return; }
      this.data = Conf['cooldowns'];
      this.changes = dict();
      $.sync('cooldowns', this.sync);
    },

    // Called from QR
    setup() {
      // Read cooldown times
      $.extend(QR.cooldown.delays, g.BOARD.cooldowns());

      // The longest reply cooldown, for use in pruning old reply data
      QR.cooldown.maxDelay = 0;
      for (let type in QR.cooldown.delays) {
        let delay = QR.cooldown.delays[type];
        if (!['thread', 'thread_global'].includes(type)) {
          QR.cooldown.maxDelay = Math.max(QR.cooldown.maxDelay, delay);
        }
      }

      QR.cooldown.isSetup = true;
      QR.cooldown.start();
    },

    start() {
      const { data } = QR.cooldown;
      if (
        !Conf['Cooldown'] ||
        !QR.cooldown.isSetup ||
        !!QR.cooldown.isCounting ||
        ((Object.keys(data[g.BOARD.ID] || {}).length + Object.keys(data.global || {}).length) <= 0)
      ) { return; }
      QR.cooldown.isCounting = true;
      QR.cooldown.count();
    },

    sync(data) {
      QR.cooldown.data = data || dict();
      QR.cooldown.start();
    },

    add(threadID, postID) {
      if (!Conf['Cooldown']) { return; }
      const start = Date.now();
      const boardID = g.BOARD.ID;
      QR.cooldown.set(boardID, start, { threadID, postID });
      if (threadID === postID) { QR.cooldown.set('global', start, { boardID, threadID, postID }); }
      QR.cooldown.save();
      QR.cooldown.start();
    },

    addDelay(post, delay) {
      if (!Conf['Cooldown']) { return; }
      const cooldown = QR.cooldown.categorize(post);
      cooldown.delay = delay;
      QR.cooldown.set(g.BOARD.ID, Date.now(), cooldown);
      QR.cooldown.save();
      QR.cooldown.start();
    },

    addMute(delay) {
      if (!Conf['Cooldown']) { return; }
      QR.cooldown.set(g.BOARD.ID, Date.now(), { type: 'mute', delay });
      QR.cooldown.save();
      QR.cooldown.start();
    },

    delete(post) {
      let cooldown;
      if (!QR.cooldown.data) { return; }
      const cooldowns = (QR.cooldown.data[post.board.ID] || (QR.cooldown.data[post.board.ID] = dict()));
      for (let id in cooldowns) {
        cooldown = cooldowns[id];
        if ((cooldown.delay == null) && (cooldown.threadID === post.thread.ID) && (cooldown.postID === post.ID)) {
          QR.cooldown.set(post.board.ID, id, null);
        }
      }
      QR.cooldown.save();
    },

    secondsDeletion(post) {
      if (!QR.cooldown.data || !Conf['Cooldown']) { return 0; }
      const cooldowns = QR.cooldown.data[post.board.ID] || dict();
      for (let start in cooldowns) {
        let cooldown = cooldowns[start];
        if ((cooldown.delay == null) && (cooldown.threadID === post.thread.ID) && (cooldown.postID === post.ID)) {
          let seconds = QR.cooldown.delays.deletion - Math.floor((Date.now() - start) / SECOND);
          return Math.max(seconds, 0);
        }
      }
      return 0;
    },

    categorize(post) {
      if (post.thread === 'new') {
        return { type: 'thread' };
      } else {
        return {
          type: post.file ? 'image' : 'reply',
          threadID: +post.thread
        };
      }
    },

    mergeChange(data, scope, id, value) {
      if (value) {
        (data[scope] || (data[scope] = dict()))[id] = value;
      } else if (scope in data) {
        delete data[scope][id];
        if (Object.keys(data[scope]).length === 0) delete data[scope];
      }
    },

    set(scope, id, value) {
      QR.cooldown.mergeChange(QR.cooldown.data, scope, id, value);
      (QR.cooldown.changes[scope] || (QR.cooldown.changes[scope] = dict()))[id] = value;
    },

    save() {
      const { changes } = QR.cooldown;
      if (!Object.keys(changes).length) { return; }
      $.get('cooldowns', dict(), function ({ cooldowns }) {
        for (let scope in QR.cooldown.changes) {
          for (let id in QR.cooldown.changes[scope]) {
            let value = QR.cooldown.changes[scope][id];
            QR.cooldown.mergeChange(cooldowns, scope, id, value);
          }
          QR.cooldown.data = cooldowns;
        }
        $.set('cooldowns', cooldowns, () => QR.cooldown.changes = dict());
      });
    },

    clear() {
      QR.cooldown.data = dict();
      QR.cooldown.changes = dict();
      QR.cooldown.auto = false;
      QR.cooldown.update();
      $.queueTask($.delete, 'cooldowns');
    },

    update() {
      if (!QR.cooldown.isCounting) { return; }

      let save = false;
      let nCooldowns = 0;
      const now = Date.now();
      const { type, threadID } = QR.cooldown.categorize(QR.posts[0]);
      let seconds = 0;

      if (Conf['Cooldown']) {
        for (let scope of [g.BOARD.ID, 'global']) {
          const cooldowns = (QR.cooldown.data[scope] || (QR.cooldown.data[scope] = dict()));
          const result = QR.cooldown.processScope(scope, cooldowns, now, type, threadID);
          save = save || result.save;
          seconds = Math.max(seconds, result.seconds);
          nCooldowns += Object.keys(cooldowns).length;
        }
      }

      if (save) { QR.cooldown.save(); }

      if (nCooldowns) {
        clearTimeout(QR.cooldown.timeout);
        QR.cooldown.timeout = setTimeout(QR.cooldown.count, SECOND);
      } else {
        delete QR.cooldown.isCounting;
      }

      // Update the status when we change posting type.
      // Don't get stuck at some random number.
      // Don't interfere with progress status updates.
      const update = seconds !== QR.cooldown.seconds;
      QR.cooldown.seconds = seconds;
      if (update) QR.status();
    },

    // Processes all cooldown entries of one scope. Returns the max seconds they impose
    // on the current post, and whether an entry expired and needs saving.
    processScope(scope, cooldowns, now: number, type, threadID): { save: boolean, seconds: number } {
      let save = false;
      let seconds = 0;
      for (let start in cooldowns) {
        const elapsed = Math.floor((now - +start) / SECOND);
        const remaining = QR.cooldown.processCooldown(scope, +start, cooldowns[start], elapsed, type, threadID);
        if (remaining === null) { // expired, was removed
          save = true;
        } else {
          seconds = Math.max(seconds, remaining);
        }
      }
      return { save, seconds };
    },

    // Handles a cooldown carrying an explicit delay from an error message.
    // Delays only apply to the given post type and thread.
    explicitDelayRemaining(scope, start: number, cooldown, elapsed: number, type, threadID): number | null {
      if (cooldown.delay <= elapsed) {
        QR.cooldown.set(scope, start, null);
        return null;
      }
      if (((cooldown.type === type) && (cooldown.threadID === threadID)) || (cooldown.type === 'mute')) {
        return cooldown.delay - elapsed;
      }
      return 0;
    },

    // Processes one cooldown entry. Returns the seconds it imposes on the current post
    // (0 if it doesn't apply), or null if the entry expired and was removed.
    processCooldown(scope, start: number, cooldown, elapsed: number, type, threadID): number | null {
      if (elapsed < 0) { // clock changed since then?
        QR.cooldown.set(scope, start, null);
        return null;
      }

      // Explicit delays from error messages
      if (cooldown.delay != null) {
        return QR.cooldown.explicitDelayRemaining(scope, start, cooldown, elapsed, type, threadID);
      }

      // Clean up expired cooldowns
      const delayKey = scope === 'global' ? 'thread_global' : 'thread';
      let maxDelay = cooldown.threadID !== cooldown.postID ?
        QR.cooldown.maxDelay
        :
        QR.cooldown.delays[delayKey];
      if (QR.cooldown.customCooldown) {
        maxDelay = Math.max(maxDelay, Number.parseInt(Conf['customCooldown'], 10));
      }
      if (maxDelay <= elapsed) {
        QR.cooldown.set(scope, start, null);
        return null;
      }

      if (((type === 'thread') === (cooldown.threadID === cooldown.postID)) && (cooldown.boardID !== g.BOARD.ID)) {
        // Only cooldowns relevant to this post can set the seconds variable:
        //   reply cooldown with a reply, thread cooldown with a thread.
        // Inter-board thread cooldowns only apply on boards other than the one they were posted on.
        const suffix = scope === 'global' ? '_global' : '';
        let seconds = QR.cooldown.delays[type + suffix] - elapsed;

        // If additional cooldown is enabled, add the configured seconds to the count.
        if (QR.cooldown.customCooldown) {
          seconds = Math.max(seconds, Number.parseInt(Conf['customCooldown'], 10) - elapsed);
        }
        return seconds;
      }
      return 0;
    },

    count() {
      QR.cooldown.update();
      if ((QR.cooldown.seconds === 0) && QR.cooldown.auto && !QR.req) QR.submit();
    }
  },

  oekaki: {
    menu: {
      init() {
        if (!['index', 'thread'].includes(g.VIEW) || !Conf['Menu'] || !Conf['Edit Link'] || !Conf['Quick Reply']) { return; }

        const a = $.el('a', {
          className: 'edit-link',
          href: 'javascript:;',
          textContent: 'Edit image'
        }
        );
        $.on(a, 'click', this.editFile);

        Menu.menu.addEntry({
          el: a,
          order: 90,
          open(post) {
            QR.oekaki.menu.post = post;
            const { file } = post;
            return QR.postingIsEnabled && !!file && (file.isImage || file.isVideo);
          }
        });
      },

      editFile() {
        const { post } = QR.oekaki.menu;
        QR.quote.call(post.nodes.post);
        const { isVideo } = post.file;
        const currentTime = post.file.fullImage?.currentTime || 0;
        return CrossOrigin.file(post.file.url, function (blob) {
          if (!blob) {
            QR.error("Can't load file.");
          } else if (isVideo) {
            QR.oekaki.menu.editVideoFrame(blob, post, currentTime);
          } else {
            blob.name = post.file.name;
            QR.handleFiles([blob]);
            QR.oekaki.edit();
          }
        });
      },

      // Loads the video and edits a snapshot of the frame at currentTime.
      editVideoFrame(blob, post, currentTime: number) {
        const video = $.el('video') as HTMLVideoElement;
        $.on(video, 'loadedmetadata', function () {
          $.on(video, 'seeked', () => QR.oekaki.menu.snapshotVideo(video, post));
          video.currentTime = currentTime;
        });
        $.on(video, 'error', () => QR.openError());
        video.src = URL.createObjectURL(blob);
      },

      snapshotVideo(video: HTMLVideoElement, post) {
        const canvas = $.el('canvas', {
          width: video.videoWidth,
          height: video.videoHeight
        }) as HTMLCanvasElement;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(function (snapshot) {
          snapshot.name = post.file.name.replace(/\.\w+$/, '') + '.png';
          QR.handleFiles([snapshot]);
          QR.oekaki.edit();
        });
      }
    },

    setup() {
      $.global('setupQR');
    },

    load(cb) {
      if ($('script[src^="//s.4cdn.org/js/tegaki"]', d.head)) {
        cb();
      } else {
        const style = $.el('link', {
          rel: 'stylesheet',
          href: `//s.4cdn.org/css/tegaki.${Date.now()}.css`
        }
        );
        const script = $.el('script',
          { src: `//s.4cdn.org/js/tegaki.min.${Date.now()}.js` });
        let n = 0;
        const onload = function () {
          if (++n === 2) cb();
        };
        $.on(style, 'load', onload);
        $.on(script, 'load', onload);
        $.add(d.head, [style, script]);
      }
    },

    draw() {
      return $.global('qrTegakiDraw');
    },

    button() {
      if (QR.selected.file) {
        QR.oekaki.edit();
      } else {
        QR.oekaki.toggle();
      }
    },

    edit() {
      QR.oekaki.load(() => $.global('qrTegakiLoad'));
    },

    toggle() {
      QR.oekaki.load(() => QR.nodes.oekaki.hidden = !QR.nodes.oekaki.hidden);
    }
  },

  persona: {
    always: {} as Record<string, string>,
    types: {
      name: [],
      email: [],
      sub: []
    },

    init() {
      if (!Conf['Quick Reply'] && (!Conf['Menu'] || !Conf['Delete Link'])) { return; }
      for (let item of Conf['QR.personas'].split('\n')) {
        QR.persona.parseItem(item.trim());
      }
    },

    parseItem(item: string) {
      if (item.startsWith('#')) return;
      const regexMatch = /(name|options|email|subject|password):"(.*)"/i.exec(item);
      if(!regexMatch) return;
      let needle: string;
      let [match, type, val] = regexMatch;

      // Don't mix up item settings with val.
      item = item.replace(match, '');

      const boards = /boards:([^;]+)/i.exec(item)?.[1].toLowerCase() || 'global';
      needle = g.BOARD.ID;
      if ((boards !== 'global') && !boards.split(',').includes(needle)) { return; }


      if (type === 'password') {
        QR.persona.pwd = val;
        return;
      }

      if (type === 'options') { type = 'email'; }
      if (type === 'subject') { type = 'sub'; }

      if (/always/i.test(item)) {
        QR.persona.always[type] = val;
      }

      if (!QR.persona.types[type].includes(val)) {
        QR.persona.types[type].push(val);
      }
    },

    load() {
      for (let type in QR.persona.types) {
        let arr = QR.persona.types[type];
        let list = $(`#list-${type}`, QR.nodes.el);
        for (let val of arr) {
          if (val) {
            $.add(list, $.el('option',
              { textContent: val })
            );
          }
        }
      }
    },

    getPassword() {
      if (QR.persona.pwd != null) {
        return QR.persona.pwd;
      }
      const m = /4chan_pass=([^;]+)/.exec(d.cookie);
      if (m) {
        return decodeURIComponent(m[1]);
      } else {
        return '';
      }
    },

    get(cb) {
      $.get('QR.persona', {}, ({ 'QR.persona': persona }) => cb(persona));
    },

    set(post) {
      $.get('QR.persona', {}, function ({ 'QR.persona': persona }) {
        const newPersona = {
          name: post.name,
          flag: post.flag
        };
        $.set('QR.persona', newPersona);
      });
    }
  },
};

// moved outside QR for type inference
class Post {
  declare nodes: {
    el: HTMLElement,
    rm: HTMLElement,
    spoiler: HTMLInputElement,
    span: HTMLElement,
    spanFileName: HTMLElement,
  };
  declare spoiler: boolean;
  declare thread: number | 'new';
  declare name: string;
  declare email: string;
  declare sub: string;
  declare isLocked: boolean;
  declare flag?: string;
  declare file?: File;
  declare filename?: string;
  declare originalName?: string;
  declare filesize?: string;
  declare URL?: string;
  declare com?: string;
  declare pasting?: boolean;

  constructor(select) {
    this.select = this.select.bind(this);
    const el = $.el('a', {
      className: 'qr-preview',
      draggable: true,
      href: 'javascript:;'
    }) as HTMLAnchorElement;
    $.extend(el, {
      innerHTML: `<a href="javascript:;" class="remove" title="Remove">${Icon.get('xmark')}</a>` +
      '<label class="qr-preview-spoiler"><input type="checkbox"> Spoiler</label>' +
      '<span id="qr-preview-comment"></span><br /><span id="qr-preview-name"></span>'
    });

    const [rm, spoiler, span, /*br*/, spanFileName] = el.childNodes as NodeListOf<HTMLElement>;

    this.nodes = {
      el,
      rm,
      spoiler: spoiler.firstChild as HTMLInputElement,
      span,
      spanFileName,
    };

    $.on(el, 'click', this.select);
    $.on(this.nodes.rm, 'click', e => { e.stopPropagation(); this.rm(); });
    $.on(this.nodes.spoiler, 'change', e => {
      this.spoiler = e.target.checked;
      if (this === QR.selected) { QR.nodes.spoiler.checked = this.spoiler; }
      return this.preventAutoPost();
    });
    for (let label of $$('label', el)) {
      $.on(label, 'click', e => e.stopPropagation());
    }
    $.add(QR.nodes.dumpList, el);

    for (let event of ['dragStart', 'dragEnter', 'dragLeave', 'dragOver', 'dragEnd', 'drop']) {
      $.on(el, event.toLowerCase(), this[event]);
    }

    this.thread = g.VIEW === 'thread' ?
      g.THREADID
      :
      'new';

    const prev = QR.posts[QR.posts.length - 1];
    QR.posts.push(this);
    this.nodes.spoiler.checked = (this.spoiler = prev && Conf['Remember Spoiler'] ?
      prev.spoiler
      :
      false);
    QR.persona.get(persona => {
      const defaultName = prev ? prev.name : persona.name;
      this.name = 'name' in QR.persona.always ? QR.persona.always.name : defaultName;

      this.email = 'email' in QR.persona.always ?
        QR.persona.always.email
        :
        '';

      this.sub = 'sub' in QR.persona.always ?
        QR.persona.always.sub
        :
        '';

      if (QR.nodes.flag) {
        this.flag = (() => {
          if (prev) {
            return prev.flag;
          } else if (persona.flag && persona.flag in g.BOARD.config.board_flags) {
            return persona.flag;
          }
        })();
      }
      if (QR.selected === this) this.load();
    }); // load persona
    if (select) { this.select(); }
    this.unlock();
    QR.captcha.moreNeeded();
  }

  rm() {
    this.delete();
    const index = QR.posts.indexOf(this);
    if (QR.posts.length === 1) {
      QR.createPost(true);
      $.rmClass(QR.nodes.el, 'dump');
    } else if (this === QR.selected) {
      (QR.posts[index - 1] || QR.posts[index + 1]).select();
    }
    QR.posts.splice(index, 1);
    QR.status();
    QR.captcha.updateThread?.();
  }

  delete() {
    $.rm(this.nodes.el);
    URL.revokeObjectURL(this.URL);
    this.dismissErrors();
  }

  lock(lock = true) {
    this.isLocked = lock;
    if (this !== QR.selected) { return; }
    for (let name of ['thread', 'name', 'email', 'sub', 'com', 'fileButton', 'filename', 'spoiler', 'flag']) {
      let node;
      node = QR.nodes[name];
      if (node) {
        node.disabled = lock;
      }
    }
    this.nodes.rm.style.visibility = lock ? 'hidden' : '';
    this.nodes.spoiler.disabled = lock;
    this.nodes.el.draggable = !lock;
  }

  unlock() {
    this.lock(false);
  }

  select() {
    if (QR.selected) {
      QR.selected.nodes.el.removeAttribute('id');
      QR.selected.forceSave();
    }
    QR.selected = this;
    this.lock(this.isLocked);
    this.nodes.el.id = 'selected';
    // Scroll the list to center the focused post.
    const rectEl = this.nodes.el.getBoundingClientRect();
    const rectList = this.nodes.el.parentNode.getBoundingClientRect();
    this.nodes.el.parentNode.scrollLeft += (rectEl.left + (rectEl.width / 2)) - rectList.left - (rectList.width / 2);
    this.load();
  }

  load() {
    // Load this post's values.

    for (let name of ['thread', 'name', 'email', 'sub', 'com', 'filename', 'flag']) {
      let node;
      node = QR.nodes[name];
      if (!node) { continue; }
      node.value = this[name] || node.dataset.default || '';
    }

    (this.thread !== 'new' ? $.addClass : $.rmClass)(QR.nodes.el, 'reply-to-thread');

    this.showFileData();
    QR.characterCount();
  }

  save(input: HTMLInputElement, forced?: boolean) {
    if (input.type === 'checkbox') {
      this.spoiler = input.checked;
      return;
    }
    const { name } = input.dataset;
    if (!['thread', 'name', 'email', 'sub', 'com', 'filename', 'flag'].includes(name)) { return; }
    const prev = this[name] || input.dataset.default || null;
    this[name] = input.value || input.dataset.default || null;
    switch (name) {
      case 'thread':
        (this.thread !== 'new' ? $.addClass : $.rmClass)(QR.nodes.el, 'reply-to-thread');
        QR.status();
        QR.captcha.updateThread?.();
        break;
      case 'com':
        this.updateComment();
        break;
      case 'filename':
        if (!this.file) { return; }
        this.saveFilename();
        this.updateFilename();
        break;
      case 'name': case 'flag':
        if (this[name] !== prev) { // only save manual changes, not values filled in by persona settings
          QR.persona.set(this);
        }
        break;
    }
    if (!forced) this.preventAutoPost();
  }

  forceSave() {
    if (this !== QR.selected) { return; }
    // Do this in case people use extensions
    // that do not trigger the `input` event.
    for (let name of ['thread', 'name', 'email', 'sub', 'com', 'filename', 'spoiler', 'flag']) {
      let node;
      node = QR.nodes[name];
      if (!node) { continue; }
      this.save(node, true);
    }
  }

  preventAutoPost() {
    // Disable auto-posting if you're editing the first post
    // during the last 5 seconds of the cooldown.
    if (QR.cooldown.auto && (this === QR.posts[0])) {
      QR.cooldown.update(); // adding/removing file can change cooldown
      if (QR.cooldown.seconds <= 5) QR.cooldown.auto = false;
    }
  }

  setComment(com) {
    this.com = com || null;
    if (this === QR.selected) {
      QR.nodes.com.value = this.com;
    }
    return this.updateComment();
  }

  updateComment() {
    if (this === QR.selected) {
      QR.characterCount();
    }
    this.nodes.span.textContent = this.com;
    QR.captcha.moreNeeded();
  }

  isOnlyQuotes() {
    return (this.com || '').trim() === (this.quotedText || '').trim();
  }

  static rmErrored(e) {
    e.stopPropagation();
    for (let i = QR.posts.length - 1; i >= 0; i--) {
      let errors;
      let post = QR.posts[i];
      errors = post.errors;
      if (errors) {
        for (let error of errors) {
          if (doc.contains(error)) {
            post.rm();
            break;
          }
        }
      }
    }
  }

  error(className: string, message: string, link?: string) {
    const div = $.el('div', { className });
    $.extend(div, {
      innerHTML: message + (link ? ` [<a href="${E(link)}" target="_blank">More info</a>]` : '') +
        `<br>[<a href="javascript:;">delete post</a>] [<a href="javascript:;">delete all</a>]`
    });
    (this.errors || (this.errors = [])).push(div);
    const [rm, rmAll] = $$('a', div);
    $.on(div, 'click', () => {
      if (QR.posts.includes(this)) this.select();
    });
    $.on(rm, 'click', e => {
      e.stopPropagation();
      if (QR.posts.includes(this)) this.rm();
    });
    $.on(rmAll, 'click', QR.post.rmErrored);
    QR.error(div, true);
  }

  fileError(message: string, link?: string) {
    this.error('file-error', `${this.filename}: ${message}`, link);
  }

  dismissErrors(test = () => true) {
    if (this.errors) {
      for (let error of this.errors) {
        if (doc.contains(error) && test(error)) {
          error.parentNode.previousElementSibling.click();
        }
      }
    }
  }

  /**
   * Checks if the mime type and file size are valid. For images, it will convert unsupported files to png, shrinks
   * files with a resolution that is too big, and converts to jpeg if the file size is too big.
   * It will not attempt to convert files that aren't images.
   * @param file The old file.
   * @returns A promise with the old file if it was valid, or a new file if it wasn't.
   */
  async validateFile(file: File): Promise<File> {
    if (file.type.startsWith('video/') && BoardConfig.noAudio(g.BOARD.ID)) {
      const strippedFile = await VideoStripper.stripAudio(file);
      if (strippedFile !== file) {
        file = strippedFile;
        new Notice('info', 'Audio track removed automatically.', 3); // NOSONAR: constructor self-renders notification
      }
    }

    // Do not check on altchans, those might support types 4chan doesn't
    if (location.hostname.endsWith('4chan.org') && !QR.mimeTypes.includes(file.type)) {
      if (file.type.startsWith('image/')) {
        const msg = `The ${file.type.slice(6)} image was converted to png.`;
        file = await QR.convert(file, 'png');
        new Notice('info', msg, 3); // NOSONAR: constructor self-renders notification
      } else {
        throw new Error('Unsupported file type.');
      }
    }

    const maxSize = QR.getMaxSize(file)
    if (file.type.startsWith('image/')) {
      file = await this.shrinkImage(file, maxSize);
    } else if (file.size > maxSize) {
      throw new Error(`File too large (file: ${$.bytesToString(file.size)}, max: ${$.bytesToString(maxSize)}).`);
    }

    return file;
  }

  /**
   * Shrinks images with a resolution that is too big, and converts to jpeg if the file size is too big.
   * @returns A promise with the old file if it was small enough, or a new shrunk file.
   */
  async shrinkImage(file: File, maxSize: number): Promise<File> {
    let img = await createImageBitmap(file);
    const { width: originalW, height: originalH } = img;
    let width = originalW, height = originalH;

    if (width > QR.max_width) {
      height = Math.round(height * (QR.max_width / width));
      width = QR.max_width;
    }
    if (height > QR.max_height) {
      width = Math.round(width * (QR.max_height / height));
      height = QR.max_height;
    }
    if (width !== originalW || height !== originalH) {
      file = await QR.convert(file, file.type === 'image/jpeg' ? 'jpeg' : 'png', { width, height, img });
      img = undefined // just in case the file size shrinkage also needs to run using the new file
      new Notice('warning', // NOSONAR: constructor self-renders notification
        `Image was too large got shrunk from ${originalW} * ${originalH} to ${width} * ${height}.` +
        'It might have lost animation.'
      );
    }

    if (file.size > maxSize) {
        const originalSize = file.size;
        file = await QR.convert(file, 'jpeg', { maxSize, img });
        new Notice('warning', // NOSONAR: constructor self-renders notification
          `Image was too large (${$.bytesToString(originalSize)}) and got converted to jpg (` +
          `${$.bytesToString(file.size)}). It might have lost transparency or animation.`
        );
    }
    return file;
  }

  async setFile(file: File) {
    try {
      // Needs to be set before the validation for some error messages.
      this.file = file;
      this.filename = file.name;
      this.originalName = file.name;

      this.file = await this.validateFile(file);
      this.originalName = file.name;
      if (Conf['Randomize Filename'] && (g.BOARD.ID !== 'f') && (!this.file.name.toLowerCase().includes('[sound='))) {
        this.randomizeName(false);
      } else {
        this.filename = this.file.name;
      }
      this.filesize = $.bytesToString(this.file.size);
      $.addClass(this.nodes.el, 'has-file', 'has-' + this.file.type.split('/')[0] );
      QR.captcha.moreNeeded();
      URL.revokeObjectURL(this.URL);
      this.saveFilename();
      if (this === QR.selected) {
        this.showFileData();
      } else {
        this.updateFilename();
      }
      this.rmMetadata();
      this.nodes.el.dataset.type = this.file.type;
      this.nodes.el.style.backgroundImage = '';
      if (/^(image|video)\//.test(this.file.type)) {
        this.nodes.spanFileName.textContent = '';
        this.readFile();
      } else {
        this.nodes.spanFileName.textContent = /\.([^.]+)$/.exec(this.file.name)[1];
      }
    } catch (error) {
      console.error(error);
      this.fileError(error?.message || error || 'unknown error when setting a file');
    }
    this.preventAutoPost();
  }

  randomizeName(set = true) {
    this.filename = `${Date.now() * 1000 - Math.floor(Math.random() * 365 * DAY * 1000)}`; // NOSONAR: non-security filename randomization
    const ext = QR.validExtension.exec(this.file.name)
    if (ext) this.filename += ext[0];
    if (set) QR.nodes.filename.value = this.filename;
  }

  restoreName() {
    QR.nodes.filename.value = this.filename = this.originalName;
  }

  readFile() {
    const isVideo = this.file.type.startsWith('video/');
    const el = $.el(isVideo ? 'video' : 'img');
    if (isVideo && !el.canPlayType(this.file.type)) { return; }

    const event = isVideo ? 'loadeddata' : 'load';
    let onload = () => {
      $.off(el, event, onload);
      $.off(el, 'error', onerror);
      this.checkDimensions(el);
      this.setThumbnail(el);
      $.event('QRMetadata', null, this.nodes.el);
    };
    let onerror = () => {
      $.off(el, event, onload);
      $.off(el, 'error', onerror);
      this.fileError(`Corrupt ${isVideo ? 'video' : 'image'} or error reading metadata.`, meta.upstreamFaq + '#error-reading-metadata');
      URL.revokeObjectURL(el.src);
      // XXX https://bugzilla.mozilla.org/show_bug.cgi?id=1021289
      delete this.nodes.el.dataset.height;
      $.event('QRMetadata', null, this.nodes.el);
    };
    this.nodes.el.dataset.height = 'loading';
    $.on(el, event, onload);
    $.on(el, 'error', onerror);
    el.src = URL.createObjectURL(this.file);
  }

  checkDimensions(el) {
    if (el.tagName === 'IMG') {
      this.checkImageDimensions(el);
    } else {
      this.checkVideoDimensions(el);
    }
  }

  checkImageDimensions(el) {
    const { height, width } = el;
    this.nodes.el.dataset.height = height;
    this.nodes.el.dataset.width = width;
    if ((height > QR.max_height) || (width > QR.max_width)) {
      this.fileError(`Image too large (image: ${height}x${width}px, max: ${QR.max_height}x${QR.max_width}px)`);
    }
    if ((height < QR.min_height) || (width < QR.min_width)) {
      this.fileError(`Image too small (image: ${height}x${width}px, min: ${QR.min_height}x${QR.min_width}px)`);
    }
  }

  checkVideoDimensions(el) {
    const { videoHeight, videoWidth, duration } = el;
    this.nodes.el.dataset.height = videoHeight;
    this.nodes.el.dataset.width = videoWidth;
    this.nodes.el.dataset.duration = duration;
    const max_height = Math.min(QR.max_height, QR.max_height_video);
    const max_width = Math.min(QR.max_width, QR.max_width_video);
    if ((videoHeight > max_height) || (videoWidth > max_width)) {
      this.fileError(`Video too large (video: ${videoHeight}x${videoWidth}px, max: ${max_height}x${max_width}px)`);
    }
    if ((videoHeight < QR.min_height) || (videoWidth < QR.min_width)) {
      this.fileError(`Video too small (video: ${videoHeight}x${videoWidth}px, min: ${QR.min_height}x${QR.min_width}px)`);
    }
    if (!Number.isFinite(duration)) {
      this.fileError('Video lacks duration metadata (try remuxing)');
    } else if (duration > QR.max_duration_video) {
      this.fileError(`Video too long (video: ${duration}s, max: ${QR.max_duration_video}s)`);
    }
    if (BoardConfig.noAudio(g.BOARD.ID) && $.hasAudio(el)) {
      this.fileError('Audio not allowed');
    }
  }

  setThumbnail(el) {
    // Create a redimensioned thumbnail.
    let height, width;
    const isVideo = el.tagName === 'VIDEO';

    // Generate thumbnails only if they're really big.
    // Resized pictures through canvases look like ass,
    // so we generate thumbnails `s` times bigger then expected
    // to avoid crappy resized quality.
    let s = 90 * 2 * window.devicePixelRatio;
    if (this.file.type === 'image/gif') { s *= 3; } // let them animate
    if (isVideo) {
      height = el.videoHeight;
      width = el.videoWidth;
    } else {
      ({ height, width } = el);
      if ((height < s) || (width < s)) {
        this.URL = el.src;
        this.nodes.el.style.backgroundImage = `url(${this.URL})`;
        return;
      }
    }

    if (height <= width) {
      width = (s / height) * width;
      height = s;
    } else {
      height = (s / width) * height;
      width = s;
    }
    const cv = $.el('canvas') as HTMLCanvasElement;
    cv.height = height;
    cv.width = width;

    const drawThumbNail = () => {
      cv.getContext('2d').drawImage(el, 0, 0, width, height);
      URL.revokeObjectURL(el.src);
      cv.toBlob(blob => {
        this.URL = URL.createObjectURL(blob);
        this.nodes.el.style.backgroundImage = `url(${this.URL})`;
      });
    };
    if (isVideo) {
      el.currentTime = 0;
      el.addEventListener("seeked", drawThumbNail);
    } else {
      drawThumbNail();
    }
  }

  rmFile() {
    if (this.isLocked) { return; }
    delete this.file;
    delete this.filename;
    delete this.filesize;
    this.nodes.el.removeAttribute('title');
    QR.nodes.filename.removeAttribute('title');
    this.rmMetadata();
    this.nodes.el.style.backgroundImage = '';
    $.rmClass(this.nodes.el, 'has-file', 'has-image', 'has-video');
    this.showFileData();
    URL.revokeObjectURL(this.URL);
    this.dismissErrors(error => $.hasClass(error, 'file-error'));
    this.preventAutoPost();
  }

  rmMetadata() {
    for (let attr of ['type', 'height', 'width', 'duration']) {
      // XXX https://bugzilla.mozilla.org/show_bug.cgi?id=1021289
      delete this.nodes.el.dataset[attr];
    }
  }

  saveFilename() {
    this.file.newName = (this.filename || '').replace(/[/\\]/g, '-');
    if (!QR.validExtension.test(this.filename)) {
      // 4chan will truncate the filename if it has no extension.
      this.file.newName += `.${$.getOwn(QR.extensionFromType, this.file.type) || 'jpg'}`;
    }
  }

  updateFilename() {
    const long = `${this.filename} (${this.filesize})`;
    this.nodes.el.title = long;
    if (this !== QR.selected) { return; }
    QR.nodes.filename.title = long;
  }

  showFileData() {
    if (this.file) {
      this.updateFilename();
      QR.nodes.filename.value = this.filename;
      $.addClass(QR.nodes.oekaki, 'has-file');
      $.addClass(QR.nodes.fileSubmit, 'has-file', 'has-' + this.file.type.split('/')[0]);
    } else {
      $.rmClass(QR.nodes.oekaki, 'has-file');
      $.rmClass(QR.nodes.fileSubmit, 'has-file', 'has-image', 'has-video');
    }
    if (this.file?.source != null) {
      QR.nodes.fileSubmit.dataset.source = this.file.source;
    } else {
      delete QR.nodes.fileSubmit.dataset.source;
    }
    QR.nodes.spoiler.checked = this.spoiler;
  }

  pasteText(file) {
    this.pasting = true;
    this.preventAutoPost();
    file.text().then(result => {
      this.setComment((this.com ? `${this.com}\n${result}` : result));
      delete this.pasting;
    });
  }

  dragStart(e) {
    const { left, top } = this.getBoundingClientRect();
    e.dataTransfer.setDragImage(this, e.clientX - left, e.clientY - top);
    $.addClass(this, 'drag');
  }
  dragEnd() { $.rmClass(this, 'drag'); }
  dragEnter() { $.addClass(this, 'over'); }
  dragLeave() { $.rmClass(this, 'over'); }

  dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  drop() {
    $.rmClass(this, 'over');
    if (!this.draggable) { return; }
    const el = $('.drag', this.parentNode);
    const index = el => {
      for (let i = 0; i < el.parentNode.children.length; i++) {
        if (el.parentNode.children[i] === el) return i;
      }
      return -1;
    }
    const oldIndex = index(el);
    const newIndex = index(this);
    if (QR.posts[oldIndex].isLocked || QR.posts[newIndex].isLocked) { return; }
    (oldIndex < newIndex ? $.after : $.before)(this, el);
    const post = QR.posts.splice(oldIndex, 1)[0];
    QR.posts.splice(newIndex, 0, post);
    QR.status();
    QR.captcha.updateThread?.();
  }
};
QR.post = Post;

// Register the explicit captcha facade. This allows captcha modules to depend
// on QR state and operations without importing QR.ts and creating a circular dependency.
registerQRCaptchaBridge({
  getPosts() {
    return QR.posts;
  },
  hasActiveRequest() {
    return !!QR.req;
  },
  isAutoCooldown() {
    return !!QR.cooldown.auto;
  },
  getNodes() {
    return QR.nodes;
  },
  focus() {
    QR.focus();
  },
  focusComment(preventScroll = false) {
    if (preventScroll) {
      try {
        QR.nodes.com.focus({ preventScroll: true });
        return;
      } catch (error_) { // NOSONAR
        // Ignored: preventScroll option not supported in all browsers
      }
    }
    QR.nodes.com.focus();
  },
  focusStatus() {
    QR.nodes.status.focus();
  },
  showError(error, focusOverride) {
    QR.error(error, focusOverride);
  },
  submit() {
    QR.submit();
  },
  setupCaptcha(focus) {
    QR.captcha.setup(focus);
  },
  addClass(...classes) {
    $.addClass(QR.nodes.el, ...classes);
  },
  removeClass(...classes) {
    $.rmClass(QR.nodes.el, ...classes);
  },
  insertCaptchaRoot(root) {
    $.after(QR.nodes.com.parentNode, root);
  }
});

export default QR;
