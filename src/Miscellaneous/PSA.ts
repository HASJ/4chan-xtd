import Notice from "../classes/Notice";
import { g, Conf, d, doc } from "../globals/globals";
import $ from "../platform/$";

interface PSAType {
  init(): void;
}

const PSA: PSAType = {
  init() {
    let el;
    if ((g.SITE!.software === 'yotsuba') && (g.BOARD!.ID === 'qa')) {
      const announcement = {innerHTML: "Stay in touch with your <a href=\"https://www.4chan-x.net/qa_friends.html\" target=\"_blank\" rel=\"noopener\">/qa/ friends</a>!"};
      el = $.el('div', {className: 'fcx-announcement'}) as HTMLDivElement;
      $.extend(el, announcement);
      $.onExists(doc, '.boardBanner', banner => $.after(banner, el));
    }
    if ('samachan.org' in Conf['siteProperties'] && !Conf['PSAseen'].includes('samachan')) {
      el = $.el('span', {innerHTML: "<a href=\"https://sushigirl.us/yakuza/res/776.html\" target=\"_blank\" rel=\"noopener\">Looking for a new home?<br>Some former Samachan users are regrouping on SushiChan.</a><br>(a message from 4chan X)"}) as HTMLSpanElement;
      $.on(d, '4chanXInitFinished', function() {
        new Notice('info', el);
        Conf['PSAseen'].push('samachan');
        $.set('PSAseen', Conf['PSAseen']);
      });
    }
  }
};

export default PSA;
