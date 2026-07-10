import Callbacks from "../classes/Callbacks";
import Notice from "../classes/Notice";
import Filter from "../Filtering/Filter";
import { g, Conf, doc } from "../globals/globals";
import $ from "../platform/$";
import { dict } from "../platform/helpers";

interface SauceType {
  links: any[];
  link: HTMLAnchorElement;
  init(): void;
  parseLink(link: string): Record<string, any> | null;
  splitLinkParts(link: string): Record<string, any>;
  resolveRegexp(parts: Record<string, any>, link: string): boolean;
  createSauceLink(link: Record<string, any>, post: any, file: any): HTMLAnchorElement | null;
  node(this: any): void;
  file(post: any, file: any): void;
  formatters: Record<string, (post: any, file: any, ext: string) => string | undefined>;
}

// Linear-time equivalent of `s.match(/(\w+)\.\w+\//)?.[1]`: scans word blocks
// left to right instead of retrying the pattern at every start position
// (avoids O(n^2) backtracking on long non-matching input).
function firstDottedSegment(s: string): string | undefined {
  const isWord = (c: number) => (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95;
  let i = 0;
  while (i < s.length) {
    if (!isWord(s.codePointAt(i)!)) { i++; continue; }
    const blockStart = i;
    while (i < s.length && isWord(s.codePointAt(i)!)) { i++; }
    if (s.codePointAt(i) === 46 /* '.' */) {
      const extStart = i + 1;
      let j = extStart;
      while (j < s.length && isWord(s.codePointAt(j)!)) { j++; }
      if ((j > extStart) && (s.codePointAt(j) === 47 /* '/' */)) {
        return s.slice(blockStart, i);
      }
    }
  }
  return undefined;
}

// Linear-time equivalent of `/[^.]*$/.exec(s)?.[0] || ''`: scans backwards
// from the end instead of retrying the quantifier at every start position.
function trailingNonDot(s: string): string {
  let i = s.length;
  while (i > 0 && s.codePointAt(i - 1)! !== 46 /* '.' */) { i--; }
  return s.slice(i);
}

const Sauce: SauceType = {
  links: [],
  link: null as any,

  init() {
    const view = g.VIEW;
    if (!view || !['index', 'thread'].includes(view) || !Conf['Sauce']) { return; }
    $.addClass(doc, 'show-sauce');

    const links: Record<string, any>[] = [];
    for (const link of Conf['sauces'].split('\n')) {
      const linkData = link[0] !== '#' ? this.parseLink(link) : null;
      if (linkData) {
        links.push(linkData);
      }
    }
    if (!links.length) { return; }

    this.links = links;
    this.link  = $.el('a', {
      target:    '_blank',
      className: 'sauce'
    }) as HTMLAnchorElement;

    Callbacks.Post.push({
      name: 'Sauce',
      cb:   this.node
    });
  },

  parseLink(link: string): Record<string, any> | null {
    link = link.trim();
    if (!link) { return null; }
    const parts = Sauce.splitLinkParts(link);
    if (!parts['text']) {
      parts['text'] = firstDottedSegment(parts['url']) || '?';
    }
    if ('boards' in parts) {
      parts['boards'] = Filter.parseBoards(parts['boards']);
    }
    if ('regexp' in parts && !Sauce.resolveRegexp(parts, link)) { return null; }
    return parts;
  },

  splitLinkParts(link: string): Record<string, any> {
    const parts = dict() as Record<string, any>;
    const iterable = link.split(/;(?=(?:text|boards|types|regexp|sandbox):?)/);
    for (let i = 0; i < iterable.length; i++) {
      const part = iterable[i];
      if (i === 0) {
        parts['url'] = part;
      } else {
        const m = /^(?=(\w*))\1:?(.*)$/.exec(part);
        if (m) {
          parts[m[1]] = m[2];
        }
      }
    }
    return parts;
  },

  resolveRegexp(parts: Record<string, any>, link: string): boolean {
    try {
      const regexp = /^\/(.*)\/(\w*)$/.exec(parts['regexp']);
      parts['regexp'] = regexp ? new RegExp(regexp[1], regexp[2]) : new RegExp(parts['regexp']);
      return true;
    } catch (err: any) {
      const _notice = new Notice('warning', [
        $.tn("Invalid regexp for Sauce link:"),
        $.el('br'),
        $.tn(link),
        $.el('br'),
        $.tn(err.message)
      ], 60);
      return false;
    }
  },

  createSauceLink(link: Record<string, any>, post: any, file: any): HTMLAnchorElement | null {
    let a: HTMLAnchorElement, matches: RegExpMatchArray | null = null, needle: string;
    const ext = trailingNonDot(file.url);
    const parts = dict() as Record<string, any>;
    $.extend(parts, link);

    if (parts['boards'] && !parts['boards'][`${post.siteID}/${post.boardID}`] && !parts['boards'][`${post.siteID}/*`]) { return null; }
    needle = ext;
    if (parts['types'] && !parts['types'].split(',').includes(needle)) { return null; }
    matches = parts['regexp'] ? parts['regexp'].exec(file.name) : null;
    if (parts['regexp'] && !matches) { return null; }

    const missing: string[] = [];
    for (const key of ['url', 'text']) {
      parts[key] = parts[key].replace(/%(T?URL|IMG|[sh]?MD5|board|name|%|semi|\$\d+)/g, (orig: string, parameter: string) => {
        let type: string;
        if (parameter.startsWith('$')) {
          if (!matches) { return orig; }
          type = matches[+parameter.slice(1)] || '';
        } else {
          const formatted = Sauce.formatters[parameter](post, file, ext);
          if (formatted == null) {
            missing.push(parameter);
            return '';
          }
          type = formatted;
        }

        if ((key === 'url') && !['%', 'semi'].includes(parameter)) {
          if (/^javascript:/i.test(parts['url'])) { type = JSON.stringify(type); }
          type = encodeURIComponent(type);
        }
        return type;
      });
    }

    if ((g.SITE as any).areMD5sDeferred?.(post.board) && missing.length && !missing.filter(x => !/^.?MD5$/.test(x)).length) {
      a = Sauce.link.cloneNode(false) as HTMLAnchorElement;
      a.dataset.skip = '1';
      return a;
    }

    if (missing.length) { return null; }

    a = Sauce.link.cloneNode(false) as HTMLAnchorElement;
    a.href = parts['url'];
    a.textContent = parts['text'];
    if (/^javascript:/i.test(parts['url'])) { a.removeAttribute('target'); }
    return a;
  },

  node(this: any) {
    if (this.isClone) { return; }
    for (const file of this.files) {
      Sauce.file(this, file);
    }
  },

  file(post: any, file: any) {
    let link: any;
    const nodes: (Node | string)[] = [];
    const skipped: [any, HTMLAnchorElement][] = [];
    for (link of Sauce.links) {
      const node = Sauce.createSauceLink(link, post, file);
      if (node) {
        nodes.push($.tn(' '), node);
        if (node.dataset.skip) { skipped.push([link, node]); }
      }
    }
    $.add(file.text, nodes);

    if (skipped.length) {
      const observer = new MutationObserver(() => {
        if (file.text.dataset.md5) {
          for (const [lnk, nd] of skipped) {
            const node2 = Sauce.createSauceLink(lnk, post, file);
            if (node2) {
              $.replace(nd, node2);
            }
          }
          observer.disconnect();
        }
      });
      observer.observe(file.text, { attributes: true });
    }
  },

  formatters: {
    TURL(post: any, file: any) { return file.thumbURL; },
    URL(post: any, file: any) { return file.url; },
    IMG(post: any, file: any, ext: string) { if (['gif', 'jpg', 'jpeg', 'png'].includes(ext)) { return file.url; } else { return file.thumbURL; } },
    MD5(post: any, file: any) { return file.MD5; },
    sMD5(post: any, file: any) { return file.MD5?.replace(/[+/=]/g, (c: string) => (({'+': '-', '/': '_', '=': ''}) as Record<string, string>)[c]); },
    hMD5(post: any, file: any) {
      if (file.MD5) {
        return Array.from(atob(file.MD5), c => c.codePointAt(0)!.toString(16).padStart(2,'0')).join('');
      }
      return undefined;
    },
    board(post: any) { return post.board.ID; },
    name(post: any, file: any) { return file.name; },
    '%'() { return '%'; },
    semi() { return ';'; }
  }
};

export default Sauce;
