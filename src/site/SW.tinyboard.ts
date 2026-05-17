import { Conf, d } from "../globals/globals";
import $ from "../platform/$";
import $$ from "../platform/$$";
import { dict } from "../platform/helpers";
import SWYotsuba from "./SW.yotsuba";

const SWTinyboard = {
  isOPContainerThread: true,
  mayLackJSON: true,
  threadModTimeIgnoresSage: true,

  disabledFeatures: [
    'Resurrect Quotes',
    'Quick Reply Personas',
    'Quick Reply',
    'Cooldown',
    'Report Link',
    'Delete Link',
    'Edit Link',
    'Quote Inlining',
    'Quote Previewing',
    'Quote Backlinks',
    'File Info Formatting',
    'Image Expansion',
    'Image Expansion (Menu)',
    'Comment Expansion',
    'Thread Expansion',
    'Favicon',
    'Quote Threading',
    'Thread Updater',
    'Banner',
    'Flash Features',
    'Reply Pruning'
  ],

  detect(): { [key: string]: any } | false {
    for (const script of $$('script:not([src])', d.head)) {
      let m: RegExpMatchArray | null;
      if (m = script.textContent!.match(/\bvar configRoot=(".*?")/)) {
        const properties = dict();
        try {
          const root = JSON.parse(m[1]);
          if (root[0] === '/') {
            properties.root = location.origin + root;
          } else if (/^https?:/.test(root)) {
            properties.root = root;
          }
        } catch (error) {}
        return properties;
      }
    }
    return false;
  },

  awaitBoard(cb: () => void): any {
    let reactUI: HTMLElement | null;
    if (reactUI = $.id('react-ui')) {
      const s = (this.selectors = Object.create(this.selectors));
      s.boardFor = {index: '.page-container'};
      s.thread = 'div[id^="thread_"]';
      return $.on(d, '4chanXMounted', cb);
    } else {
      return cb();
    }
  },

  urls: {
    thread({siteID, boardID, threadID}: {siteID: string, boardID: string, threadID: string | number}, isArchived?: boolean): string {
      return `${Conf['siteProperties'][siteID]?.root || `http://${siteID}/`}${boardID}/${isArchived ? 'archive/' : ''}res/${threadID}.html`;
    },
    post({postID}: {postID: string | number}): string { return `#${postID}`; },
    index({siteID, boardID}: {siteID: string, boardID: string}): string { return `${Conf['siteProperties'][siteID]?.root || `http://${siteID}/`}${boardID}/`; },
    catalog({siteID, boardID}: {siteID: string, boardID: string}): string { return `${Conf['siteProperties'][siteID]?.root || `http://${siteID}/`}${boardID}/catalog.html`; },
    threadJSON({siteID, boardID, threadID}: {siteID: string, boardID: string, threadID: string | number}, isArchived?: boolean): string {
      const root = Conf['siteProperties'][siteID]?.root;
      if (root) { return `${root}${boardID}/${isArchived ? 'archive/' : ''}res/${threadID}.json`; } else { return ''; }
    },
    archivedThreadJSON(thread: any): string {
      return SWTinyboard.urls.threadJSON(thread, true);
    },
    threadsListJSON({siteID, boardID}: {siteID: string, boardID: string}): string {
      const root = Conf['siteProperties'][siteID]?.root;
      if (root) { return `${root}${boardID}/threads.json`; } else { return ''; }
    },
    archiveListJSON({siteID, boardID}: {siteID: string, boardID: string}): string {
      const root = Conf['siteProperties'][siteID]?.root;
      if (root) { return `${root}${boardID}/archive/archive.json`; } else { return ''; }
    },
    catalogJSON({siteID, boardID}: {siteID: string, boardID: string}): string {
      const root = Conf['siteProperties'][siteID]?.root;
      if (root) { return `${root}${boardID}/catalog.json`; } else { return ''; }
    },
    file({siteID, boardID}: {siteID: string, boardID: string}, filename: string): string {
      return `${Conf['siteProperties'][siteID]?.root || `http://${siteID}/`}${boardID}/${filename}`;
    },
    thumb(board: any, filename: string): string {
      return SWTinyboard.urls.file(board, filename);
    }
  },

  selectors: {
    board:         'form[name="postcontrols"]',
    thread:        'input[name="board"] ~ div[id^="thread_"]',
    threadDivider: 'div[id^="thread_"] > hr:last-child',
    summary:       '.omitted',
    postContainer: 'div[id^="reply_"]:not(.hidden)',
    opBottom:      '.op',
    replyOriginal: 'div[id^="reply_"]:not(.hidden)',
    infoRoot:      '.intro',
    info: {
      subject:   '.subject',
      name:      '.name',
      email:     '.email',
      tripcode:  '.trip',
      uniqueID:  '.poster_id',
      capcode:   '.capcode',
      flag:      '.flag',
      date:      'time',
      nameBlock: 'label',
      quote:     'a[href*="#q"]',
      reply:     'a[href*="/res/"]:not([href*="#"])'
    },
    icons: {
      isSticky:   '.fa-thumb-tack',
      isClosed:   '.fa-lock'
    },
    file: {
      text:  '.fileinfo',
      link:  '.fileinfo > a',
      thumb: 'a > .post-image'
    },
    thumbLink: '.file > a',
    multifile: '.files > .file',
    highlightable: {
      op:      ' > .op',
      reply:   '.reply',
      catalog: ' > .thread'
    },
    comment:   '.body',
    spoiler:   '.spoiler',
    quotelink: 'a[onclick*="highlightReply("]',
    catalog: {
      board:  '#Grid',
      thread: '.mix',
      thumb:  '.thread-image'
    },
    boardList: '.boardlist',
    boardListBottom: '.boardlist.bottom',
    styleSheet: '#stylesheet',
    psa:       '.blotter',
    nav: {
      prev: '.pages > form > [value=Previous]',
      next: '.pages > form > [value=Next]'
    }
  } as { [key: string]: any },

  classes: {
    highlight: 'highlighted'
  },

  xpath: {
    thread:         'div[starts-with(@id,"thread_")]',
    postContainer:  'div[starts-with(@id,"reply_") or starts-with(@id,"thread_")]',
    replyContainer: 'div[starts-with(@id,"reply_")]'
  },

  regexp: {
    quotelink:
      new RegExp(`\
/\\
([^/]+)\\
/res/\\
(\\d+)\\
(?:\\.\\w+)?#\\
(\\d+)\\
$\
`),
    quotelinkHTML:
      /<a [^>]*\bhref="[^"]*\/([^\/]+)\/res\/(\d+)(?:\.\w+)?#(\d+)"/g
  },

  Build: {
    parseJSON(data: any, board: any): any {
      const o: any = SWYotsuba.Build.parseJSON(data, board);
      if (data.ext === 'deleted') {
        delete o.file;
        $.extend(o, {
          files: [],
          fileDeleted: true,
          filesDeleted: [0]
        });
      }
      if (data.extra_files) {
        let file: any;
        for (let i = 0; i < data.extra_files.length; i++) {
          const extra_file = data.extra_files[i];
          if (extra_file.ext === 'deleted') {
            o.filesDeleted.push(i);
          } else {
            file = SWYotsuba.Build.parseJSONFile(data, board);
            o.files.push(file);
          }
        }
        if (o.files.length) {
          o.file = o.files[0];
        }
      }
      return o;
    },

    parseComment(html: string): string {
      html = html
        .replace(/<br\b[^<]*>/gi, '\n')
        .replace(/<[^>]*>/g, '');
      return $.unescape(html);
    }
  },

  bgColoredEl(): HTMLElement {
    return $.el('div', {className: 'post reply'});
  },

  isFileURL(url: { pathname: string }): boolean {
    return /\/src\/[^\/]+/.test(url.pathname);
  },

  preParsingFixes(board: HTMLElement): void {
    let broken: HTMLElement | null;
    if (broken = $('a > input[name="board"]', board)) {
      $.before(broken.parentNode!, broken);
    }
  },

  parseNodes(post: any, nodes: any): void {
    if (nodes.uniqueID) { return; }
    let text = '';
    let node = nodes.nameBlock.nextSibling;
    while (node && (node.nodeType === 3)) {
      text += node.textContent;
      node = node.nextSibling;
    }
    let m: RegExpMatchArray | null;
    if (m = text.match(/(\s*ID:\s*)(\S+)/)) {
      let uniqueID: HTMLSpanElement;
      nodes.info.normalize();
      let nextSibling = nodes.nameBlock.nextSibling as Text;
      nextSibling = nextSibling.splitText(m[1].length);
      nextSibling.splitText(m[2].length);
      nodes.uniqueID = (uniqueID = $.el('span', {className: 'poster_id'}) as HTMLSpanElement);
      $.replace(nextSibling, uniqueID);
      $.add(uniqueID, nextSibling);
    }
  },

  parseDate(node: HTMLElement): Date | undefined {
    const datetime = node.getAttribute('datetime');
    let date = Date.parse(datetime?.trim() || '');
    if (!isNaN(date)) { return new Date(date); }
    date = Date.parse(node.textContent!.trim() + ' UTC');
    if (!isNaN(date)) { return new Date(date); }
    return undefined;
  },

  parseFile(post: any, file: any): boolean {
    const {text, link, thumb} = file;
    if ($.x(`ancestor::${this.xpath.postContainer}[1]`, text) !== post.nodes.root) { return false; }

    const nextSibling = link.nextSibling;
    const hasParen = nextSibling && nextSibling.textContent && nextSibling.textContent.includes('(');
    const infoNode = hasParen ? nextSibling : link.nextElementSibling;
    if (!infoNode) { return false; }

    const info = infoNode.textContent!.match(/\((.*,\s*)?([\d.]+ ?[KMG]?B).*\)/);
    if (!info) { return false; }

    const nameNode = $('.postfilename', text);
    $.extend(file, {
      name:       nameNode ? (nameNode.title || nameNode.textContent) : link.pathname.match(/[^/]*$/)[0],
      size:       info[2],
      dimensions: info[0].match(/\d+x\d+/)?.[0]
    });
    if (thumb) {
      $.extend(file, {
        thumbURL:  /\/static\//.test(thumb.src) && $.isImage(link.href) ? link.href : thumb.src,
        isSpoiler: /^Spoiler/i.test(info[1] || '') || (link.textContent === 'Spoiler Image')
      });
    }
    return true;
  },

  isThumbExpanded(file: any): boolean {
    return $.hasClass(file.thumb.parentNode, 'expanded') || (file.thumb.parentNode.dataset.expanded === 'true');
  },

  isLinkified(link: HTMLAnchorElement): boolean {
    return /\bnofollow\b/.test(link.rel);
  },

  catalogPin(threadRoot: HTMLElement): string {
    return threadRoot.dataset.sticky = 'true';
  }
};

export default SWTinyboard;
