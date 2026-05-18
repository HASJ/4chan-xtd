import { g, Conf } from "../globals/globals";
import $ from "../platform/$";

interface FlashType {
  init(): void;
  initReady(): void;
}

const Flash: FlashType = {
  init() {
    if ((g.BOARD!.ID === 'f') && Conf['Enable Native Flash Embedding']) {
      $.ready(Flash.initReady);
    }
  },

  initReady() {
    if ($.hasStorage) {
      $.global('initFlash');
    } else {
      if (g.VIEW === 'thread') {
        $.global('setThreadId');
      }
      $.global('initFlashNoStorage');
    }
  }
};

export default Flash;
