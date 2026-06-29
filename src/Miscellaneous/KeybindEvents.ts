import { Conf, d } from "../globals/globals";
import $ from "../platform/$";

let keydownHandler: ((e: KeyboardEvent) => void) | undefined;

export function registerKeybindHandler(handler: (e: KeyboardEvent) => void) {
  keydownHandler = handler;
}

export function enableKeybindHandler() {
  if (Conf['Keybinds'] && keydownHandler) {
    $.on(d, 'keydown', keydownHandler);
  }
}

export function disableKeybindHandler() {
  if (Conf['Keybinds'] && keydownHandler) {
    $.off(d, 'keydown', keydownHandler);
  }
}
