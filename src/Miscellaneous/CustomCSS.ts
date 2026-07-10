import $ from "../platform/$";
import CSS from "../css/CSS";
import { Conf } from "../globals/globals";

const CustomCSS: any = {
  init() {
    if (!Conf['Custom CSS']) { return; }
    return this.addStyle();
  },

  addStyle() {
    this.style = $.addStyle(CSS.sub(Conf['usercss']), 'custom-css', '#fourchanx-css');
    return this.style;
  },

  rmStyle() {
    if (this.style) {
      $.rm(this.style);
      return delete this.style;
    }
  },

  update() {
    if (!this.style) {
      return this.addStyle();
    }
    this.style.textContent = CSS.sub(Conf['usercss']);
    return this.style.textContent;
  }
};
export default CustomCSS;

