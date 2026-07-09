import DataBoard from "../classes/DataBoard";
import { Conf, d, g } from "../globals/globals";
import Unread from "../Monitoring/Unread";
import $ from "../platform/$";
import $$ from "../platform/$$";
import { dict } from "../platform/helpers";

const Banner: any = {
  init() {
    if (Conf['Custom Board Titles']) {
      this.db = new DataBoard('customTitles', null, true);
    }

    $.asap((() => d.body), () => $.asap((() => $('hr')), Banner.ready));

    // Let 4chan's JS load the banner if enabled; otherwise, load it ourselves.
    if (g.BOARD.ID !== 'f') {
      return $.on(d, '4chanXInitFinished', () => $.queueTask(Banner.load));
    }
  },

  ready() {
    const banner = $(".boardBanner");
    const {children} = banner;

    if ((g.VIEW === 'thread') && Conf['Remove Thread Excerpt']) {
      Banner.setTitle(children[1].textContent);
    }

    children[0].title = "Click to change";
    $.on(children[0], 'click', Banner.cb.toggle);

    if (Conf['Custom Board Titles']) {
      Banner.custom(children[1]);
      if (children[2]) { return Banner.custom(children[2]); }
    }
  },

  load() {
    const bannerCnt = $.id('bannerCnt');
    if (!bannerCnt.firstChild) {
      const img = $.el('img', {
        alt: '4chan',
        src: '//s.4cdn.org/image/title/' + bannerCnt.dataset.src
      }
      );
      return $.add(bannerCnt, img);
    }
  },

  setTitle(title) {
    if (Unread.title != null) {
      Unread.title = title;
      return Unread.update();
    } else {
      d.title = title;
      return d.title;
    }
  },

  cb: {
    toggle() {
      if (!Banner.choices?.length) {
        Banner.choices = Conf['knownBanners'].split(',').slice();
      }
      const randomValue = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
      const i = Math.floor(Banner.choices.length * randomValue);
      const banner = Banner.choices.splice(i, 1);
      const img = $('img', this.parentNode) as HTMLImageElement;
      img.src = `//s.4cdn.org/image/title/${banner}`;
      return img.src;
    },

    click(e) {
      if (!e.ctrlKey && !e.metaKey) { return; }
      Banner.original[this.className] ??= this.cloneNode(true);
      this.contentEditable = true;
      for (const br of $$('br', this)) { $.replace(br, $.tn('\n')); }
      return this.focus();
    },

    keydown(e) {
      e.stopPropagation();
      if (!e.shiftKey && (e.keyCode === 13)) { return this.blur(); }
    },

    blur() {
      for (const br of $$('br', this)) { $.replace(br, $.tn('\n')); }
      let trimmed = this.textContent;
      while (trimmed.endsWith('\n')) { trimmed = trimmed.slice(0, -1); }
      this.textContent = trimmed;
      if (trimmed) {
        this.contentEditable = false;
        return Banner.db.set({
          boardID:  g.BOARD.ID,
          threadID: this.className,
          val: {
            title: this.textContent,
            orig:  Banner.original[this.className].textContent
          }
        });
      } else {
        $.rmAll(this);
        $.add(this, [...Banner.original[this.className].cloneNode(true).childNodes]);
        return Banner.db.delete({
          boardID:  g.BOARD.ID,
          threadID: this.className
        });
      }
    }
  },

  original: dict(),

  custom(child) {
    let data;
    const {className} = child;
    child.title = `Ctrl/\u2318+click to edit board ${className.slice(5).toLowerCase()}`;
    child.spellcheck = false;

    for (const event of ['click', 'keydown', 'blur']) {
      $.on(child, event, Banner.cb[event]);
    }

    data = Banner.db.get({boardID: g.BOARD.ID, threadID: className});
    if (data) {
      if (Conf['Persistent Custom Board Titles'] || (data.orig === child.textContent)) {
        Banner.original[className] = child.cloneNode(true);
        child.textContent = data.title;
        return child.textContent;
      } else {
        return Banner.db.delete({boardID: g.BOARD.ID, threadID: className});
      }
    }
  }
};
export default Banner;

