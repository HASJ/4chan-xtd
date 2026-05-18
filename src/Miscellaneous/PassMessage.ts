import { Conf, d } from "../globals/globals";
import $ from "../platform/$";
import PassMessagePage from './PassMessage/PassMessageHtml';

interface PassMessageType {
  init(): void;
}

const PassMessage: PassMessageType = {
  init() {
    if (Conf['passMessageClosed']) { return; }
    const msg = $.el('div', {className: 'box-outer top-box'}) as HTMLDivElement;
    $.extend(msg, PassMessagePage);
    msg.style.cssText = 'padding-bottom: 0;';
    const close = $('a', msg) as HTMLAnchorElement;
    $.on(close, 'click', function() {
      $.rm(msg);
      $.set('passMessageClosed', true);
    });
    $.ready(function() {
      let hd;
      if (hd = $.id('hd')) {
        $.after(hd, msg);
      } else {
        $.prepend(d.body, msg);
      }
    });
  }
};

export default PassMessage;
