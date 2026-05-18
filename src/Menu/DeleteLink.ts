import Notice from "../classes/Notice";
import { g, Conf } from "../globals/globals";
import $ from "../platform/$";
import { dict } from "../platform/helpers";
import QR from "../Posting/QR";
import Menu from "./Menu";

interface DeleteLinkType {
  auto: [Record<string, boolean>, Record<string, boolean>];
  nodes: {
    menu: ChildNode;
    links: [HTMLAnchorElement, HTMLAnchorElement];
  };
  post: any;
  init(): void;
  menuText(): string;
  linkText(fileOnly: boolean): string;
  toggle(this: HTMLAnchorElement): void;
  delete(post: any, fileOnly: boolean): void;
  load(link: HTMLAnchorElement, post: any, fileOnly: boolean, resDoc: Document | null): void;
  cooldown: {
    seconds: Record<string, number>;
    start(post: any, seconds?: number): void;
    count(post: any): void;
  };
}

const DeleteLink: DeleteLinkType = {
  auto: [dict(), dict()],
  nodes: null as any,
  post: null,

  init() {
    if (!['index', 'thread'].includes(g.VIEW!) || !Conf['Menu'] || !Conf['Delete Link']) { return; }

    const div = $.el('div', {
      className: 'delete-link',
      textContent: 'Delete'
    });
    const postEl = $.el('a', {
      className: 'delete-post',
      href: 'javascript:;'
    }) as HTMLAnchorElement;
    const fileEl = $.el('a', {
      className: 'delete-file',
      href: 'javascript:;'
    }) as HTMLAnchorElement;
    this.nodes = {
      menu:  div.firstChild!,
      links: [postEl, fileEl]
    };

    const postEntry = {
      el: postEl,
      open() {
        postEl.textContent = DeleteLink.linkText(false);
        $.on(postEl, 'click', DeleteLink.toggle);
        return true;
      }
    };
    const fileEntry = {
      el: fileEl,
      open({file}: any) {
        if (!file || file.isDead) { return false; }
        fileEl.textContent = DeleteLink.linkText(true);
        $.on(fileEl, 'click', DeleteLink.toggle);
        return true;
      }
    };

    Menu.menu.addEntry({
      el: div,
      order: 40,
      open(post: any) {
        if (post.isDead) { return false; }
        DeleteLink.post = post;
        (DeleteLink.nodes.menu as HTMLElement).textContent = DeleteLink.menuText();
        DeleteLink.cooldown.start(post);
        return true;
      },
      subEntries: [postEntry, fileEntry]
    });
  },

  menuText() {
    let seconds: number;
    if ((seconds = DeleteLink.cooldown.seconds[DeleteLink.post.fullID])) {
      return `Delete (${seconds})`;
    } else {
      return 'Delete';
    }
  },

  linkText(fileOnly) {
    let text = fileOnly ? 'File' : 'Post';
    if (DeleteLink.auto[+fileOnly][DeleteLink.post.fullID]) {
      text = `Deleting ${text.toLowerCase()}...`;
    }
    return text;
  },

  toggle(this: HTMLAnchorElement) {
    const post = DeleteLink.post;
    const fileOnly = $.hasClass(this, 'delete-file');
    const auto = DeleteLink.auto[+fileOnly];

    if (auto[post.fullID]) {
      delete auto[post.fullID];
    } else {
      auto[post.fullID] = true;
    }
    this.textContent = DeleteLink.linkText(fileOnly);

    if (!DeleteLink.cooldown.seconds[post.fullID]) {
      DeleteLink.delete(post, fileOnly);
    }
  },

  delete(post, fileOnly) {
    const link = DeleteLink.nodes.links[+fileOnly];
    delete DeleteLink.auto[+fileOnly][post.fullID];
    if (post.fullID === DeleteLink.post.fullID) { $.off(link, 'click', DeleteLink.toggle); }

    const form = {
      mode: 'usrdel',
      onlyimgdel: fileOnly,
      pwd: QR.persona.getPassword()
    } as any;
    form[+post.ID] = 'delete';

    $.ajax(($.id('delform') as HTMLFormElement).action.replace(`/${g.BOARD}/`, `/${post.board}/`), {
      responseType: 'document',
      withCredentials: true,
      onloadend() { DeleteLink.load(link, post, fileOnly, this.response); },
      form: $.formData(form)
    });
  },

  load(link, post, fileOnly, resDoc) {
    let msg: HTMLElement | null;
    if (!resDoc) {
      new Notice('warning', 'Connection error, please retry.', 20);
      if (post.fullID === DeleteLink.post.fullID) { $.on(link, 'click', DeleteLink.toggle); }
      return;
    }

    link.textContent = DeleteLink.linkText(fileOnly);
    if (resDoc.title === '4chan - Banned') { // Ban/warn check
      const el = $.el('span', {innerHTML: "You can&#039;t delete posts because you are <a href=\"//www.4chan.org/banned\" target=\"_blank\">banned</a>."});
      new Notice('warning', el, 20);
    } else if (msg = resDoc.getElementById('errmsg')) { // error!
      new Notice('warning', msg.textContent!, 20);
      if (post.fullID === DeleteLink.post.fullID) { $.on(link, 'click', DeleteLink.toggle); }
      if (QR.cooldown.data && Conf['Cooldown'] && /\bwait\b/i.test(msg.textContent!)) {
        DeleteLink.cooldown.start(post, 5);
        DeleteLink.auto[+fileOnly][post.fullID] = true;
        DeleteLink.nodes.links[+fileOnly].textContent = DeleteLink.linkText(fileOnly);
      }
    } else {
      if (!fileOnly) { QR.cooldown.delete(post); }
      if (resDoc.title === 'Updating index...') {
        // We're 100% sure.
        (post.origin || post).kill(fileOnly);
      }
      if (post.fullID === DeleteLink.post.fullID) { link.textContent = 'Deleted'; }
    }
  },

  cooldown: {
    seconds: dict(),

    start(post, seconds) {
      // Already counting.
      if (DeleteLink.cooldown.seconds[post.fullID] != null) { return; }

      if (seconds == null) { seconds = QR.cooldown.secondsDeletion(post); }
      if (seconds > 0) {
        DeleteLink.cooldown.seconds[post.fullID] = seconds;
        DeleteLink.cooldown.count(post);
      }
    },

    count(post) {
      if (post.fullID === DeleteLink.post.fullID) { (DeleteLink.nodes.menu as HTMLElement).textContent = DeleteLink.menuText(); }
      if ((DeleteLink.cooldown.seconds[post.fullID] > 0) && Conf['Cooldown']) {
        DeleteLink.cooldown.seconds[post.fullID]--;
        setTimeout(DeleteLink.cooldown.count, 1000, post);
      } else {
        delete DeleteLink.cooldown.seconds[post.fullID];
        for (const fileOnly of [false, true]) {
          if (DeleteLink.auto[+fileOnly][post.fullID]) {
            DeleteLink.delete(post, fileOnly);
          }
        }
      }
    }
  }
};

export default DeleteLink;
