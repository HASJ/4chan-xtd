import Get from "../General/Get";
import Header from "../General/Header";
import { g, Conf, d, doc } from "../globals/globals";
import $ from "../platform/$";
import $$ from "../platform/$$";
import Icon from "../Icons/icon";

interface NavType {
  haveExtra?: boolean;
  init(): void;
  prev(): void;
  next(): void;
  getThread(): HTMLElement | null | undefined;
  scroll(delta: number): void;
  removeExtra(): void;
}

const Nav: NavType = {
  init() {
    switch (g.VIEW!) {
      case 'index':
        if (!Conf['Index Navigation']) { return; }
        break;
      case 'thread':
        if (!Conf['Reply Navigation']) { return; }
        break;
      default:
        return;
    }

    const span = $.el('span', {id: 'navlinks'}) as HTMLSpanElement;
    const prev = $.el('a', {
      textContent: '▲',
      className: 'navlinks-navlink navlink-prev',
      href: 'javascript:;'
    }) as HTMLAnchorElement;
    const next = $.el('a', {
      textContent: '▼',
      className: 'navlinks-navlink navlink-next',
      href: 'javascript:;'
    }) as HTMLAnchorElement;

    Icon.set(prev, 'arrowUpLong');
    Icon.set(next, 'arrowDownLong');

    $.on(prev, 'click', this.prev);
    $.on(next, 'click', this.next);

    $.add(span, [prev, $.tn(' '), next]);
    const append = function() {
      $.off(d, '4chanXInitFinished', append);
      $.add(d.body, span);
    };
    $.on(d, '4chanXInitFinished', append);
  },

  prev() {
    if (g.VIEW === 'thread') {
      window.scrollTo(0, 0);
    } else {
      Nav.scroll(-1);
    }
  },

  next() {
    if (g.VIEW === 'thread') {
      window.scrollTo(0, d.body.scrollHeight);
    } else {
      Nav.scroll(+1);
    }
  },

  getThread() {
    if (g.VIEW === 'thread') { return g.threads!.get(`${g.BOARD!.ID}.${g.THREADID}`)!.nodes.root; }
    if ($.hasClass(doc, 'catalog-mode')) { return; }
    for (const threadRoot of $$(g.SITE!.selectors.thread, d) as HTMLElement[]) {
      const thread = Get.threadFromRoot(threadRoot);
      if (thread.isHidden && !thread.stub) { continue; }
      if (Header.getTopOf(threadRoot) >= -threadRoot.getBoundingClientRect().height) { // not scrolled past
        return threadRoot;
      }
    }
    return null;
  },

  scroll(delta) {
    let next;
    (d.activeElement as HTMLElement)?.blur();
    let thread = Nav.getThread();
    if (!thread) { return; }
    const axis = delta === +1 ?
      'following'
    :
      'preceding';
    if (next = $.x(`${axis}-sibling::${g.SITE!.xpath.thread}[not(@hidden)][1]`, thread) as HTMLElement) {
      const top = Header.getTopOf(thread);
      if (((delta === +1) && (top < 5)) || ((delta === -1) && (top > -5))) { thread = next; }
    }
    const extra = (Header.getTopOf(thread) + doc.clientHeight) - d.body.getBoundingClientRect().bottom;
    if (extra > 0) { d.body.style.marginBottom = `${extra}px`; }

    Header.scrollTo(thread);

    if ((extra > 0) && !Nav.haveExtra) {
      Nav.haveExtra = true;
      $.on(d, 'scroll', Nav.removeExtra);
    }
  },

  removeExtra() {
    const extra = doc.clientHeight - d.body.getBoundingClientRect().bottom;
    if (extra > 0) {
      d.body.style.marginBottom = `${extra}px`;
    } else {
      d.body.style.marginBottom = '';
      delete Nav.haveExtra;
      $.off(d, 'scroll', Nav.removeExtra);
    }
  }
};

export default Nav;
