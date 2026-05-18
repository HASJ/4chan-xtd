import $ from "../platform/$";
import Redirect from "../Archive/Redirect";
import Filter from "../Filtering/Filter";
import { g, Conf } from "../globals/globals";
import Menu from "./Menu";

interface ArchiveLinkSubEntry {
  el: HTMLAnchorElement;
  open(post: any): boolean;
}

const ArchiveLink = {
  init(): void {
    if ((g.SITE!.software !== 'yotsuba') || !['index', 'thread'].includes(g.VIEW!) || !Conf['Menu'] || !Conf['Archive Link']) { return; }

    const div = $.el('div', { textContent: 'Archive' });

    const entry = {
      el: div,
      order: 60,
      open({ID, thread, board}: any) {
        return !!Redirect.to('thread', {postID: ID, threadID: thread.ID, boardID: board.ID});
      },
      subEntries: [] as ArchiveLinkSubEntry[]
    };

    const types = [
      ['Post',      'post'],
      ['Name',      'name'],
      ['Tripcode',  'tripcode'],
      ['Capcode',   'capcode'],
      ['Subject',   'subject'],
      ['Flag',      'country'],
      ['Filename',  'filename'],
      ['Image MD5', 'MD5']
    ];

    for (const [text, type] of types) {
      // Add a sub entry for each type.
      entry.subEntries.push(this.createSubEntry(text, type));
    }

    Menu.menu.addEntry(entry);
  },

  createSubEntry(text: string, type: string): ArchiveLinkSubEntry {
    const el = $.el('a', {
      textContent: text,
      target: '_blank'
    }) as HTMLAnchorElement;

    const open = type === 'post' ?
      function({ID, thread, board}: any) {
        el.href = Redirect.to('thread', {postID: ID, threadID: thread.ID, boardID: board.ID}) || '';
        return true;
      }
    :
      function(post: any) {
        const typeParam = (type === 'country') && post.info.flagCodeTroll ?
          'troll_country'
        :
          type;
        const value = type === 'country' ?
          post.info.flagCode || post.info.flagCodeTroll?.toLowerCase()
        :
          Filter.values(type, post)[0];
        // We want to parse the exact same stuff as the filter does already.
        if (!value) { return false; }
        el.href = Redirect.to('search', {
          boardID:  post.board.ID,
          type:     typeParam,
          value,
          isSearch: true
        } as any) || '';
        return true;
      };

    return {
      el,
      open
    };
  }
};

export default ArchiveLink;
