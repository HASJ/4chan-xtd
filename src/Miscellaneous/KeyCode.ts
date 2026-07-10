export default function keyCode(e: KeyboardEvent) {
  let key = (() => {
    switch (e.code) {
      case 'Backspace':
        return '';
      case 'Enter':
        return 'Enter';
      case 'Escape':
        return 'Esc';
      case 'Space':
        return 'Space';
      case 'ArrowLeft':
        return 'Left';
      case 'ArrowUp':
        return 'Up';
      case 'ArrowRight':
        return 'Right';
      case 'ArrowDown':
        return 'Down';
      case 'Comma':
        return 'Comma';
      case 'Period':
        return 'Period';
      case 'Slash':
        return 'Slash';
      case 'Semicolon':
        return 'Semicolon';
      default:
        if (/^Digit\d$/.test(e.code) || /^Numpad\d$/.test(e.code)) { return e.code.slice(-1); }
        if (/^Key[A-Z]$/.test(e.code)) { return e.code.slice(-1).toLowerCase(); }
        return null;
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