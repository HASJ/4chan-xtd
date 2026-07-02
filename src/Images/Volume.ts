import Callbacks from "../classes/Callbacks";
import Config from "../config/Config";
import Header from "../General/Header";
import UI from "../General/UI";
import { g, Conf, E } from "../globals/globals";
import $ from "../platform/$";

interface VolumeType {
  inputs?: {
    unmute: HTMLInputElement;
    volume: HTMLInputElement;
  };
  init(): void;
  setup(video: HTMLVideoElement): void;
  change(this: HTMLVideoElement): void;
  node(this: any): void;
  catalogNode(this: any): void;
  wheel(this: any, e: WheelEvent): void;
}

const Volume: VolumeType = {
  inputs: undefined,

  init() {
    if (!['index', 'thread'].includes(g.VIEW) ||
      (!Conf['Image Expansion'] && !Conf['Image Hover'] && !Conf['Image Hover in Catalog'] && !Conf['Gallery'])) { return; }

    $.sync('Allow Sound', (x: boolean) => {
      Conf['Allow Sound'] = x;
      if (Volume.inputs) Volume.inputs.unmute.checked = x;
    });

    $.sync('Default Volume', (x: number) => {
      Conf['Default Volume'] = x;
      if (Volume.inputs) Volume.inputs.volume.value = String(x);
    });

    if (Conf['Mouse Wheel Volume']) {
      Callbacks.Post.push({
        name: 'Mouse Wheel Volume',
        cb:   this.node
      });
    }

    if ((g.SITE as any).noAudio?.(g.BOARD)) { return; }

    if (Conf['Mouse Wheel Volume']) {
      Callbacks.CatalogThread.push({
        name: 'Mouse Wheel Volume',
        cb:   this.catalogNode
      });
    }

    const unmuteEntry = UI.checkbox('Allow Sound', 'Allow Sound') as HTMLElement;
    unmuteEntry.title = Config.main['Images and Videos']['Allow Sound'][1] as string;

    const volumeEntry = $.el('label', { title: 'Default volume for videos.' });
    $.extend(volumeEntry, {
      innerHTML: `<input name="Default Volume" type="range" min="0" max="1" step="0.01" value="${E(Conf["Default Volume"])}"> Volume`
    });

    this.inputs = {
      unmute: unmuteEntry.firstElementChild as HTMLInputElement,
      volume: volumeEntry.firstElementChild as HTMLInputElement
    };

    $.on(this.inputs.unmute, 'change', $.cb.checked);
    $.on(this.inputs.volume, 'change', $.cb.value);

    Header.menu.addEntry({ el: unmuteEntry, order: 200 });
    Header.menu.addEntry({ el: volumeEntry, order: 201 });
  },

  setup(video: HTMLVideoElement) {
    video.muted  = !Conf['Allow Sound'];
    video.volume = Conf['Default Volume'];
    $.on(video, 'volumechange', Volume.change);
  },

  change(this: HTMLVideoElement) {
    const { muted, volume } = this;
    const items = {
      'Allow Sound': !muted,
      'Default Volume': volume
    } as Record<string, any>;
    for (const key in items) {
      const val = items[key];
      if (Conf[key] === val) {
        delete items[key];
      }
    }
    $.set(items);
    $.extend(Conf, items);
    if (Volume.inputs) {
      Volume.inputs.unmute.checked = !muted;
      Volume.inputs.volume.value = String(volume);
    }
  },

  node(this: any) {
    if ((g.SITE as any).noAudio?.(this.board)) { return; }
    for (const file of this.files) {
      if (file.isVideo) {
        if (file.thumb) { $.on(file.thumb, 'wheel', Volume.wheel.bind(Header.hover)); }
        $.on(($('.file-info', file.text) || file.link), 'wheel', Volume.wheel.bind(file.thumbLink));
      }
    }
  },

  catalogNode(this: any) {
    const file = this.thread.OP.files[0];
    if (!file?.isVideo) { return; }
    $.on(this.nodes.thumb, 'wheel', Volume.wheel.bind(Header.hover));
  },

  wheel(this: any, e: WheelEvent) {
    let el: HTMLVideoElement | null;
    if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) { return; }
    if (!(el = $('video:not([data-md5])', this))) { return; }
    if (el.muted || !($.hasAudio as any)(el)) { return; }
    let volume = el.volume + 0.1;
    if (e.deltaY < 0) { volume *= 1.1; }
    if (e.deltaY > 0) { volume /= 1.1; }
    el.volume = $.minmax(volume - 0.1, 0, 1);
    e.preventDefault();
  }
};

export default Volume;
