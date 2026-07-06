// @ts-nocheck
import { g, d } from "../globals/globals";
import $ from "../platform/$";

const Tinyboard = {
  init() {
    if (g.SITE.software !== 'tinyboard') { return; }
    if (g.VIEW === 'thread') {
      return $.on(d, '4chanXInitFinished', () => $.global("initTinyBoard", { boardID: g.BOARD.ID, threadID: g.THREADID.toString() }));
    }
  }
};
export default Tinyboard;

