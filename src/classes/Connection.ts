import $ from "../platform/$";
import { g } from "../globals/globals";

export default class Connection {
  target: any;
  origin: string;
  cb: { [key: string]: (val: any) => void };

  constructor(target: any, origin: string, cb: { [key: string]: (val: any) => void } = {}) {
    this.send = this.send.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.target = target;
    this.origin = origin;
    this.cb = cb;
    $.on(window, 'message', this.onMessage);
  }

  targetWindow(): Window | null {
    if (this.target instanceof HTMLIFrameElement) {
      return this.target.contentWindow;
    } else {
      return this.target as Window;
    }
  }

  send(data: any): void {
    const targetWin = this.targetWindow();
    if (targetWin) {
      targetWin.postMessage(`${g.NAMESPACE}${JSON.stringify(data)}`, this.origin);
    }
  }

  onMessage(e: MessageEvent): void {
    if (
      (e.source !== this.targetWindow()) ||
      (e.origin !== this.origin) ||
      (typeof e.data !== 'string') ||
      (e.data.slice(0, g.NAMESPACE.length) !== g.NAMESPACE)
    ) {
      return;
    }
    const data = JSON.parse(e.data.slice(g.NAMESPACE.length));
    for (const type in data) {
      const value = data[type];
      if ($.hasOwn(this.cb, type)) {
        this.cb[type](value);
      }
    }
  }
}
