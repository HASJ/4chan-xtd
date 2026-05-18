import $ from "../platform/$";
import CSS from "../css/CSS";
import { Conf } from "../globals/globals";

interface CustomCSSType {
  style?: HTMLStyleElement;
  init(): void;
  addStyle(): void;
  rmStyle(): void;
  update(): void;
}

const CustomCSS: CustomCSSType = {
  init() {
    if (!Conf['Custom CSS']) { return; }
    this.addStyle();
  },

  addStyle() {
    this.style = $.addStyle(CSS.sub(Conf['usercss']), 'custom-css', '#fourchanx-css');
  },

  rmStyle() {
    if (this.style) {
      $.rm(this.style);
      delete this.style;
    }
  },

  update() {
    if (!this.style) {
      this.addStyle();
      return;
    }
    this.style.textContent = CSS.sub(Conf['usercss']);
  }
};

export default CustomCSS;
