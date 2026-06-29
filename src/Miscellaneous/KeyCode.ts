export default function keyCode(e: KeyboardEvent) {
  let key = (() => {
    const kc = e.keyCode;
    switch (kc) {
      case 8: // return
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
}
