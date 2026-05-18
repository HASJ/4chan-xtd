import { g, d } from "../globals/globals";
import $ from "../platform/$";

interface TinyboardType {
  init(): void;
}

const Tinyboard: TinyboardType = {
  init() {
    if (g.SITE!.software !== 'tinyboard') { return; }
    if (g.VIEW === 'thread') {
      $.on(d, '4chanXInitFinished', () => $.global("initTinyBoard", { boardID: g.BOARD!.ID, threadID: g.THREADID!.toString() }));
    }
  }
};

export default Tinyboard;
