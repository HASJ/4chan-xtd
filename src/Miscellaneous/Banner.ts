import DataBoard from "../classes/DataBoard";
import { Conf, d, g } from "../globals/globals";
import Unread from "../Monitoring/Unread";
import $ from "../platform/$";
import $$ from "../platform/$$";
import { dict } from "../platform/helpers";

interface BannerType {
  db?: DataBoard;
  choices?: string[];
  original: Record<string, HTMLElement>;
  init(): void;
  ready(): void;
  load(): void;
  setTitle(title: string): void;
  cb: {
    toggle(this: HTMLElement): void;
    click(this: HTMLElement, e: MouseEvent): void;
    keydown(this: HTMLElement, e: KeyboardEvent): void;
    blur(this: HTMLElement): void;
  };
  custom(child: HTMLElement): void;
}

const Banner: BannerType = {
  original: dict(),

  init() {
    if (Conf['Custom Board Titles']) {
      this.db = new DataBoard('customTitles', undefined as any, true);
    }

    $.asap((() => d.body), () => $.asap((() => $('hr')), Banner.ready));

    // Let 4chan's JS load the banner if enabled; otherwise, load it ourselves.
    if (g.BOARD!.ID !== 'f') {
      $.on(d, '4chanXInitFinished', () => $.queueTask(Banner.load));
    }
  },

  ready() {
    const banner = $(".boardBanner")!;
    const {children} = banner;

    if ((g.VIEW === 'thread') && Conf['Remove Thread Excerpt']) {
      Banner.setTitle(children[1].textContent || '');
    }

    (children[0] as HTMLElement).title = "Click to change";
    $.on(children[0], 'click', Banner.cb.toggle);

    if (Conf['Custom Board Titles']) {
      Banner.custom(children[1] as HTMLElement);
      if (children[2]) { Banner.custom(children[2] as HTMLElement); }
    }
  },

  load() {
    const bannerCnt = $.id('bannerCnt');
    if (bannerCnt && !bannerCnt.firstChild) {
      const img = $.el('img', {
        alt: '4chan',
        src: '//s.4cdn.org/image/title/' + bannerCnt.dataset.src
      });
      $.add(bannerCnt, img);
    }
  },

  setTitle(title) {
    if (Unread.title != null) {
      Unread.title = title;
      Unread.update();
    } else {
      d.title = title;
    }
  },

  cb: {
    toggle(this: HTMLElement) {
      if (!Banner.choices?.length) {
        Banner.choices = Conf['knownBanners'].split(',').slice();
      }
      const i = Math.floor(Banner.choices.length * Math.random());
      const banner = Banner.choices.splice(i, 1);
      ( $('img', this.parentNode as HTMLElement) as HTMLImageElement).src = `//s.4cdn.org/image/title/${banner}`;
    },

    click(this: HTMLElement, e: MouseEvent) {
      if (!e.ctrlKey && !e.metaKey) { return; }
      if (Banner.original[this.className] == null) { Banner.original[this.className] = this.cloneNode(true) as HTMLElement; }
      this.contentEditable = 'true';
      for (const br of $$('br', this)) { $.replace(br, $.tn('\n')); }
      this.focus();
    },

    keydown(this: HTMLElement, e: KeyboardEvent) {
      e.stopPropagation();
      if (!e.shiftKey && (e.keyCode === 13)) { this.blur(); }
    },

    blur(this: HTMLElement) {
      for (const br of $$('br', this)) { $.replace(br, $.tn('\n')); }
      const text = this.textContent || '';
      if (this.textContent = text.replace(/\n*$/, '')) {
        this.contentEditable = 'false';
        Banner.db!.set({
          boardID:  g.BOARD!.ID,
          threadID: this.className,
          val: {
            title: this.textContent,
            orig:  Banner.original[this.className].textContent
          }
        });
      } else {
        $.rmAll(this);
        $.add(this, [...Banner.original[this.className].cloneNode(true).childNodes]);
        Banner.db!.delete({
          boardID:  g.BOARD!.ID,
          threadID: this.className
        });
      }
    }
  },

  custom(child) {
    let data;
    const {className} = child;
    child.title = `Ctrl/\u2318+click to edit board ${className.slice(5).toLowerCase()}`;
    child.spellcheck = false;

    for (const event of ['click', 'keydown', 'blur'] as const) {
      $.on(child, event, Banner.cb[event]);
    }

    if (data = Banner.db!.get({boardID: g.BOARD!.ID, threadID: className})) {
      if (Conf['Persistent Custom Board Titles'] || (data.orig === child.textContent)) {
        Banner.original[className] = child.cloneNode(true) as HTMLElement;
        child.textContent = data.title;
      } else {
        Banner.db!.delete({boardID: g.BOARD!.ID, threadID: className});
      }
    }
  }
};

export default Banner;
