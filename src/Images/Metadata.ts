import $ from "../platform/$";
import Callbacks from "../classes/Callbacks";
import CrossOrigin from "../platform/CrossOrigin";
import { Conf, d, g } from "../globals/globals";
import Get from "../General/Get";

interface MetadataType {
  init(): void;
  node(this: any): void;
  load(this: HTMLElement): void;
  parse(data: Uint8Array): string | null;
}

const Metadata: MetadataType = {
  init() {
    if (!Conf['WEBM Metadata'] || !['index', 'thread'].includes(g.VIEW)) { return; }

    Callbacks.Post.push({
      name: 'WEBM Metadata',
      cb:   this.node
    });
  },

  node(this: any) {
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i];
      if (/webm$/i.test(file.url)) {
        let el: HTMLElement | null;
        if (this.isClone) {
          el = $('.webm-title', file.text);
        } else {
          el = $.el('span', { className: 'webm-title' });
          el.dataset.index = String(i);
          $.extend(el, { innerHTML: '<a href="javascript:;"></a>' });
          $.add(file.text, [$.tn(' '), el]);
        }
        if (el && el.children.length === 1) {
          $.one(el.lastElementChild as HTMLElement, 'mouseover focus', Metadata.load);
        }
      }
    }
  },

  load(this: HTMLElement) {
    const parent = this.parentNode as HTMLElement;
    $.rmClass(parent, 'error');
    $.addClass(parent, 'loading');
    const { index } = parent.dataset;
    CrossOrigin.binary(Get.postFromNode(this).files[+(index || 0)].url, (data) => {
      $.rmClass(parent, 'loading');
      if (data != null) {
        const title = Metadata.parse(new Uint8Array(data));
        const output = $.el('span', { textContent: title || '' });
        if (title == null) { $.addClass(parent, 'not-found'); }
        $.before(this, output);
        parent.tabIndex = 0;
        if (d.activeElement === this) { parent.focus(); }
        this.tabIndex = -1;
      } else {
        $.addClass(parent, 'error');
        $.one(this, 'click', Metadata.load);
      }
    }, { Range: 'bytes=0-9999' });
  },

  parse(data: Uint8Array): string | null {
    let i = 0;
    const readInt = function() {
      let n = data[i++];
      let len = 0;
      while (n < (0x80 >> len)) { len++; }
      n ^= (0x80 >> len);
      while (len-- && (i < data.length)) {
        n = (n << 8) ^ data[i++];
      }
      return n;
    };

    while (i < data.length) {
      const element = readInt();
      let size = readInt();
      if (element === 0x3BA9) { // Title
        let title = '';
        while (size-- && (i < data.length)) {
          title += String.fromCharCode(data[i++]);
        }
        return decodeURIComponent(escape(title)); // UTF-8 decoding
      } else if (![0x8538067, 0x549A966].includes(element)) { // Segment, Info
        i += size;
      }
    }
    return null;
  }
};

export default Metadata;
