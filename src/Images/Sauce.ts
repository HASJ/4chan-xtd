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
  createSauceLink(link: Record<string, any>, post: any, file: any): HTMLAnchorElement | null;
  node(this: any): void;
  file(post: any, file: any): void;
  formatters: Record<string, (post: any, file: any, ext: string) => string | undefined>;
}

const Sauce: SauceType = {
  links: [],
  link: null as any,

  init() {
    if (!['index', 'thread'].includes(g.VIEW) || !Conf['Sauce']) { return; }
    $.addClass(doc, 'show-sauce');

    const links = [];
    for (const link of Conf['sauces'].split('\n')) {
      let linkData: Record<string, any> | null;
      if ((link[0] !== '#') && (linkData = this.parseLink(link))) {
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
    if (!(link = link.trim())) { return null; }
    const parts = dict() as Record<string, any>;
    const iterable = link.split(/;(?=(?:text|boards|types|regexp|sandbox):?)/);
    for (let i = 0; i < iterable.length; i++) {
      const part = iterable[i];
      if (i === 0) {
        parts['url'] = part;
      } else {
        const m = part.match(/^(\w*):?(.*)$/);
        if (m) {
          parts[m[1]] = m[2];
        }
      }
    }
    if (!parts['text']) {
      parts['text'] = parts['url'].match(/(\w+)\.\w+\//)?.[1] || '?';
    }
    if ('boards' in parts) {
      parts['boards'] = Filter.parseBoards(parts['boards']);
    }
    if ('regexp' in parts) {
      try {
        let regexp: RegExpMatchArray | null;
        if ((regexp = parts['regexp'].match(/^\/(.*)\/(\w*)$/))) {
          parts['regexp'] = RegExp(regexp[1], regexp[2]);
        } else {
          parts['regexp'] = RegExp(parts['regexp']);
        }
      } catch (err: any) {
        new Notice('warning', [
          $.tn("Invalid regexp for Sauce link:"),
          $.el('br'),
          $.tn(link),
          $.el('br'),
          $.tn(err.message)
        ], 60);
        return null;
      }
    }
    return parts;
  },

  createSauceLink(link: Record<string, any>, post: any, file: any): HTMLAnchorElement | null {
    let a: HTMLAnchorElement, matches: RegExpMatchArray | null = null, needle: string;
    const ext = (file.url.match(/[^.]*$/) || [])[0] || '';
    const parts = dict() as Record<string, any>;
    $.extend(parts, link);

    if (parts['boards'] && !parts['boards'][`${post.siteID}/${post.boardID}`] && !parts['boards'][`${post.siteID}/*`]) { return null; }
    if (parts['types']  && (needle = ext, !parts['types'].split(',').includes(needle))) { return null; }
    if (parts['regexp'] && (!(matches = file.name.match(parts['regexp'])))) { return null; }

    const missing: string[] = [];
    for (const key of ['url', 'text']) {
      parts[key] = parts[key].replace(/%(T?URL|IMG|[sh]?MD5|board|name|%|semi|\$\d+)/g, (orig: string, parameter: string) => {
        let type: string;
        if (parameter[0] === '$') {
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
    let link: any, node: HTMLAnchorElement | null;
    const nodes: (Node | string)[] = [];
    const skipped: [any, HTMLAnchorElement][] = [];
    for (link of Sauce.links) {
      if ((node = Sauce.createSauceLink(link, post, file))) {
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
        return Array.from(atob(file.MD5), c => c.charCodeAt(0).toString(16).padStart(2,'0')).join('');
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
