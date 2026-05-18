import { g, Conf } from "../globals/globals";
import $ from "../platform/$";
import Menu from "./Menu";
import { isPassEnabled } from "../platform/helpers";

interface ReportLinkType {
  url: string;
  dims: string;
  init(): void;
  report(): void;
}

const ReportLink: ReportLinkType = {
  url: '',
  dims: '',

  init() {
    if (!['index', 'thread'].includes(g.VIEW!) || !Conf['Menu'] || !Conf['Report Link']) { return; }

    const a = $.el('a', {
      className: 'report-link',
      href: 'javascript:;',
      textContent: 'Report'
    }) as HTMLAnchorElement;
    $.on(a, 'click', this.report);

    Menu.menu.addEntry({
      el: a,
      order: 10,
      open(post: any) {
        ReportLink.url = `//sys.${location.hostname.split('.')[1]}.org/${post.board}/imgboard.php?mode=report&no=${post}`;
        if (isPassEnabled()) {
          ReportLink.dims = 'width=350,height=275';
        } else {
          ReportLink.dims = 'width=400,height=550';
        }
        return true;
      }
    });
  },

  report() {
    const {url, dims} = ReportLink;
    const id  = String(Date.now());
    const set = `toolbar=0,scrollbars=1,location=0,status=1,menubar=0,resizable=1,${dims}`;
    window.open(url, id, set);
  }
};

export default ReportLink;
