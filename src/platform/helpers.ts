// This file was created because these functions on $ were sometimes not initialized yet because of circular
// dependencies, so try to keep this file without dependencies, so these functions don't have to wait for something else

/**
 * @param wait Time to wait in milliseconds.
 * @param fn The function to execute
 * @param leading Wether to run immediately, otherwise it waits for timeout even if there is no older call.
 */
export const debounce = (wait: number, fn: Function, leading = true) => {
  let lastCall = 0;
  let timeout = null;
  let that = null;
  let args = null;
  const exec = function () {
    lastCall = Date.now();
    return fn.apply(that, args);
  };
  return function () {
    args = arguments;
    that = this;
    if (leading && lastCall < (Date.now() - wait)) {
      exec();
      return;
    }
    // stop current reset
    if (timeout !== null) clearTimeout(timeout);
    // after wait, let next invocation execute immediately
    timeout = setTimeout(exec, wait);
  };
};

export const dict = () => Object.create(null);

dict.clone = function (obj) {
  if ((typeof obj !== 'object') || (obj === null)) {
    return obj;
  } else if (obj instanceof Array) {
    const arr = [];
    for (let i = 0, end = obj.length; i < end; i++) {
      arr.push(dict.clone(obj[i]));
    }
    return arr;
  } else {
    const map = Object.create(null);
    for (var key in obj) {
      var val = obj[key];
      map[key] = dict.clone(val);
    }
    return map;
  }
};

dict.json = (str: string) => dict.clone(JSON.parse(str));

export const SECOND = 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;

export const platform = window.GM_xmlhttpRequest ? 'userscript' : 'crx';

export const isPassEnabled = () => {
  if (document.cookie.indexOf('pass_enabled=1') >= 0) return true;
  try {
    if (localStorage.getItem('4chan-tc-ticket') || localStorage.getItem('4chan_pass_token')) return true;
  } catch (e) {}
  return false;
};

export const keyCode = function (e: any) {
  let key = (() => {
    let kc;
    switch ((kc = e.keyCode)) {
      case 8: // backspace
        return '';
      case 13:
        return 'Enter';
      case 27:
        return 'Esc';
      case 32:
        return 'Space';
      case 37:
        return 'Left';
      case 38:
        return 'Up';
      case 39:
        return 'Right';
      case 40:
        return 'Down';
      case 188:
        return 'Comma';
      case 190:
        return 'Period';
      case 191:
        return 'Slash';
      case 59: case 186:
        return 'Semicolon';
      default:
        if ((48 <= kc && kc <= 57) || (65 <= kc && kc <= 90)) { // 0-9, A-Z
          return String.fromCharCode(kc).toLowerCase();
        } else if (96 <= kc && kc <= 105) { // numpad 0-9
          return String.fromCharCode(kc - 48);
        } else {
          return null;
        }
    }
  })();
  if (key) {
    if (e.altKey) { key = 'Alt+' + key; }
    if (e.ctrlKey) { key = 'Ctrl+' + key; }
    if (e.metaKey) { key = 'Meta+' + key; }
    if (e.shiftKey) { key = 'Shift+' + key; }
  }
  return key;
};
