import { Conf, doc } from "../globals/globals";
import $ from "../platform/$";

const Anonymize: any = {
  init() {
    if (!Conf['Anonymize']) { return; }
    return $.addClass(doc, 'anonymize');
  }
};
export default Anonymize;

