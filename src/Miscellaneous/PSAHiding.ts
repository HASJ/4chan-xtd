import Header from "../General/Header";
import { Conf, doc, g } from "../globals/globals";
import $ from "../platform/$";
import Icon from "../Icons/icon";

interface PSAHidingType {
  psa?: HTMLElement;
  text?: string;
  hr?: HTMLElement;
  content?: HTMLElement;
  btn?: HTMLElement;
  init(): void;
  setup(psa: HTMLElement): void;
  toggle(this: HTMLElement): void;
  sync(hiddenPSAList: Record<string, string>): void;
}

const PSAHiding: PSAHidingType = {
  init() {
    if (!Conf['Announcement Hiding'] || !g.SITE!.selectors.psa) { return; }
    $.addClass(doc, 'hide-announcement');
    $.onExists(doc, g.SITE!.selectors.psa, this.setup);
    $.ready(function() {
      if (!$(g.SITE!.selectors.psa)) { $.rmClass(doc, 'hide-announcement'); }
    });
  },

  setup(psa) {
    let btn, hr;
    PSAHiding.psa = psa;
    PSAHiding.text = psa.dataset.utc ?? psa.innerHTML;
    if (g.SITE!.selectors.psaTop && (hr = $(g.SITE!.selectors.psaTop)?.previousElementSibling as HTMLElement) && (hr.nodeName === 'HR')) {
      PSAHiding.hr = hr;
    }
    PSAHiding.content = $.el('div') as HTMLDivElement;

    const entry = {
      el: $.el('a', {
        textContent: 'Show announcement',
        className: 'show-announcement',
        href: 'javascript:;'
      }) as HTMLAnchorElement,
      order: 50,
      open() { return psa.hidden; }
    };
    Header.menu.addEntry(entry);
    $.on(entry.el, 'click', PSAHiding.toggle);

    PSAHiding.btn = (btn = $.el('a', {
      title:       'Mark announcement as read and hide.',
      className:   'hide-announcement-button',
      href:        'javascript:;',
      textContent: '➖',
    }) as HTMLAnchorElement);
    Icon.set(btn, 'squareMinus');
    $.on(btn, 'click', PSAHiding.toggle);
    if (psa.firstChild?.tagName === 'HR') {
      $.after(psa.firstChild as HTMLElement, btn);
    } else {
      $.prepend(psa, btn);
    }

    PSAHiding.sync(Conf['hiddenPSAList']);
    $.rmClass(doc, 'hide-announcement');

    $.sync('hiddenPSAList', PSAHiding.sync);
  },

  toggle(this: HTMLElement) {
    const hide = $.hasClass(this, 'hide-announcement-button');
    const set = function(hiddenPSAList: Record<string, string>) {
      if (hide) {
        hiddenPSAList[g.SITE!.ID] = PSAHiding.text!;
      } else {
        delete hiddenPSAList[g.SITE!.ID];
      }
    };
    set(Conf['hiddenPSAList']);
    PSAHiding.sync(Conf['hiddenPSAList']);
    $.get('hiddenPSAList', Conf['hiddenPSAList'], function({hiddenPSAList}: any) {
      set(hiddenPSAList);
      $.set('hiddenPSAList', hiddenPSAList);
    });
  },

  sync(hiddenPSAList) {
    const {psa, content} = PSAHiding;
    if (!psa || !content) { return; }
    psa.hidden = (hiddenPSAList[g.SITE!.ID] === PSAHiding.text);
    // Remove content to prevent autoplaying sounds from hidden announcements
    if (psa.hidden) {
      $.add(content, [...psa.childNodes]);
    } else {
      $.add(psa, [...content.childNodes]);
    }
    if (PSAHiding.hr) PSAHiding.hr.hidden = psa.hidden;
  }
};

export default PSAHiding;
