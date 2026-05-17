import Header from "../General/Header";
import { d } from "../globals/globals";
import $ from "../platform/$";
import { SECOND } from "../platform/helpers";
import Icon from '../Icons/icon';

export default class Notice {
  timeout?: number;
  onclose?: () => void;
  el: HTMLDivElement;
  closed?: boolean;
  timeoutId?: number;

  constructor(type: string, content: string | Node | Node[], timeout?: number, onclose?: () => void) {
    this.add = this.add.bind(this);
    this.close = this.close.bind(this);
    this.timeout = timeout;
    this.onclose = onclose;
    this.el = $.el('div', {
      innerHTML: `<a href="javascript:;" class="close" title="Close">${Icon.get('xmark')}</a><div class="message"></div>`
    }) as HTMLDivElement;
    this.el.style.opacity = '0';
    this.setType(type);
    $.on(this.el.firstElementChild!, 'click', this.close);

    let contentNode: Node;
    if (typeof content === 'string') {
      contentNode = $.tn(content);
    } else if (content instanceof Array) {
      contentNode = $.nodes(content);
    } else {
      contentNode = content;
    }
    $.add(this.el.lastElementChild!, contentNode);

    $.ready(this.add);
  }

  setType(type: string): void {
    this.el.className = `notification ${type}`;
  }

  add(): void {
    if (this.closed) return;
    if (d.hidden) {
      $.on(d, 'visibilitychange', this.add);
      return;
    }
    $.off(d, 'visibilitychange', this.add);
    $.add(Header.noticesRoot, this.el);
    this.el.clientHeight; // force reflow
    this.el.style.opacity = '1';
    if (this.timeout) {
      this.timeoutId = setTimeout(this.close, this.timeout * SECOND) as unknown as number;
    }
  }

  close(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.closed = true;
    $.off(d, 'visibilitychange', this.add);
    $.rm(this.el);
    this.onclose?.();
  }

  resetTimer(): void {
    if (this.timeout) {
      clearTimeout(this.timeoutId);
      this.timeoutId = setTimeout(this.close, this.timeout * SECOND) as unknown as number;
    }
  }
}
