import { Conf, g } from "../globals/globals";

interface NormalizeURLType {
  init(): void;
}

const NormalizeURL: NormalizeURLType = {
  init() {
    if (!Conf['Normalize URL']) { return; }

    let pathname = location.pathname.split(/\/+/);
    if (g.SITE!.software === 'yotsuba') {
      switch (g.VIEW!) {
        case 'thread':
          pathname[2] = 'thread';
          pathname = pathname.slice(0, 4);
          break;
        case 'index':
          pathname = pathname.slice(0, 3);
          break;
      }
    }
    const pathJoined = pathname.join('/');
    if (location.pathname !== pathJoined) {
      history.replaceState(history.state, '', `${location.protocol}//${location.host}${pathJoined}${location.hash}`);
    }
  }
};

export default NormalizeURL;
