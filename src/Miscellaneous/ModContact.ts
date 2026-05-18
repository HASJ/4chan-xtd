import $ from "../platform/$";
import Callbacks from "../classes/Callbacks";
import { g } from "../globals/globals";

interface ModContactType {
  init(): void;
  node(this: any): void;
  template(capcode: string): { innerHTML: string };
  specific: Record<string, () => { innerHTML: string }>;
  moveNote: Record<string, { innerHTML: string }>;
}

const ModContact: ModContactType = {
  init() {
    if ((g.SITE!.software !== 'yotsuba') || !['index', 'thread'].includes(g.VIEW!)) { return; }
    Callbacks.Post.push({
      name: 'Mod Contact Links',
      cb:   this.node
    });
  },

  node(this: any) {
    let moved;
    if (this.isClone || !$.hasOwn(ModContact.specific, this.info.capcode)) { return; }
    const links = $.el('span', {className: 'contact-links brackets-wrap'}) as HTMLSpanElement;
    $.extend(links, ModContact.template(this.info.capcode));
    $.after(this.nodes.capcode, links);
    if ((moved = this.info.comment.match(/This thread was moved to >>>\/(\w+)\//)) && $.hasOwn(ModContact.moveNote, moved[1])) {
      const moveNote = $.el('div', {className: 'move-note'}) as HTMLDivElement;
      $.extend(moveNote, ModContact.moveNote[moved[1]]);
      $.add(this.nodes.post, moveNote);
    }
  },

  template(capcode) {
    return {innerHTML: "<a href=\"https://www.4chan.org/feedback\" target=\"_blank\">feedback</a>" + (ModContact.specific[capcode]()).innerHTML};
  },

  specific: {
    Mod() { return {innerHTML: " <a href=\"https://www.4chan-x.net/4chan-irc.html\" target=\"_blank\">IRC</a>"}; },
    Manager() { return ModContact.specific.Mod(); },
    Developer() { return {innerHTML: " <a href=\"https://github.com/4chan\" target=\"_blank\">github</a>"}; },
    Admin() { return {innerHTML: " <a href=\"https://twitter.com/hiroyuki_ni\" target=\"_blank\">twitter</a>"}; }
  },

  moveNote: {
    qa: {innerHTML: "Moving a thread to /qa/ does not imply mods will read it. If you wish to contact mods, use <a href=\"https://www.4chan.org/feedback\" target=\"_blank\">feedback</a><span class=\"invisible\"> (https://www.4chan.org/feedback)</span> or <a href=\"https://www.4chan-x.net/4chan-irc.html\" target=\"_blank\">IRC</a><span class=\"invisible\"> (https://www.4chan-x.net/4chan-irc.html)</span>."}
  }
};

export default ModContact;
