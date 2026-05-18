import { g, Conf, d } from "../globals/globals";
import $ from "../platform/$";

const PassLink = {
  init() {
    if ((g.SITE.software !== 'yotsuba') || !Conf['Pass Link']) { return; }
    $.on(d, '4chanXInitFinished', PassLink.ready);
  },

  ready() {
    let styleSelector: HTMLElement | null;
    if (!(styleSelector = $.id('styleSelector'))) { return; }

    const passLink = $.el('span',
      {className: 'brackets-wrap pass-link-container'});
    $.extend(passLink, {innerHTML: "<a href=\"javascript:;\">4chan Pass</a>"});
    const link = passLink.firstElementChild as HTMLElement;
    $.on(link, 'click', () => window.open(`//sys.${location.hostname.split('.')[1]}.org/auth`,
      Date.now().toString(),
      'width=500,height=280,toolbar=0'));
    $.before(styleSelector.previousSibling as ChildNode, [passLink, $.tn('\u00A0\u00A0')]);
  }
};
export default PassLink;
