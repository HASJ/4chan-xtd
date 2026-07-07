import { Conf, g } from "../globals/globals";

const NormalizeURL: any = {
  init() {
    if (!Conf['Normalize URL']) { return; }

    let pathname = location.pathname.split(/\/+/);
    if (g.SITE.software === 'yotsuba') {
      switch (g.VIEW) {
        case 'thread':
          pathname[2] = 'thread';
          pathname = pathname.slice(0, 4);
          break;
        case 'index':
          pathname = pathname.slice(0, 3);
          break;
      }
    }
    const normalizedPathname = pathname.join('/');
    if (location.pathname !== normalizedPathname) {
      return history.replaceState(history.state, '', `${location.protocol}//${location.host}${normalizedPathname}${location.hash}`);
    }
  }
};
export default NormalizeURL;

