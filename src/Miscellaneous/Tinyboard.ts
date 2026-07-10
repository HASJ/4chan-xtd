import { g, d } from "../globals/globals";
import $ from "../platform/$";

const Tinyboard: any = {
  init() {
    if (g.SITE.software !== 'tinyboard') { return; }
    if (g.VIEW === 'thread' && g.BOARD && g.THREADID) {
      const { BOARD, THREADID } = g;
      return $.on(d, '4chanXInitFinished', () => $.global("initTinyBoard", { boardID: BOARD.ID, threadID: THREADID.toString() }));
    }
  }
};
export default Tinyboard;
