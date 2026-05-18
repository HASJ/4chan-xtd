import { Conf, doc } from "../globals/globals";
import $ from "../platform/$";

const Anonymize = {
  init(): void {
    if (!Conf['Anonymize']) { return; }
    $.addClass(doc, 'anonymize');
  }
};

export default Anonymize;
