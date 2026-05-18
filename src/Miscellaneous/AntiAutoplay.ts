import Callbacks from "../classes/Callbacks";
import { Conf, d, doc } from "../globals/globals";
import $ from "../platform/$";
import $$ from "../platform/$$";

interface AntiAutoplayType {
  init(): void;
  stop(audio: HTMLAudioElement): void;
  node(this: any): void;
  process(root: HTMLElement): void;
  processVideo(el: HTMLElement, attr: 'src' | 'data'): void;
}

const AntiAutoplay: AntiAutoplayType = {
  init() {
    if (!Conf['Disable Autoplaying Sounds']) { return; }
    $.addClass(doc, 'anti-autoplay');
    for (const audio of $$('audio[autoplay]', doc) as HTMLAudioElement[]) { this.stop(audio); }
    window.addEventListener('loadstart', ((e: Event) => this.stop(e.target as HTMLAudioElement)), true);
    Callbacks.Post.push({
      name: 'Disable Autoplaying Sounds',
      cb:   this.node
    });
    $.ready(() => this.process(d.body));
  },

  stop(audio) {
    if (!audio.autoplay) { return; }
    audio.pause();
    audio.autoplay = false;
    if (audio.controls) { return; }
    audio.controls = true;
    $.addClass(audio, 'controls-added');
  },

  node(this: any) {
    AntiAutoplay.process(this.nodes.comment);
  },

  process(root) {
    for (const iframe of $$('iframe[src*="youtube"][src*="autoplay=1"]', root) as HTMLIFrameElement[]) {
      AntiAutoplay.processVideo(iframe, 'src');
    }
    for (const object of $$('object[data*="youtube"][data*="autoplay=1"]', root) as HTMLObjectElement[]) {
      AntiAutoplay.processVideo(object, 'data');
    }
  },

  processVideo(el: any, attr: 'src' | 'data') {
    el[attr] = el[attr].replace(/\?autoplay=1&?/, '?').replace('&autoplay=1', '');
    if (window.getComputedStyle(el).display === 'none') { el.style.display = 'block'; }
    $.addClass(el, 'autoplay-removed');
  }
};

export default AntiAutoplay;
