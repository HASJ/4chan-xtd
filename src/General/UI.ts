import { Conf, d, doc } from "../globals/globals";
import Callbacks from "../classes/Callbacks";
import $ from "../platform/$";
import $$ from "../platform/$$";
import Header from "./Header";
import Icon from "../Icons/icon";
import { FastDOM } from "../platform/FastDOM";

const dialog = function(id: string, properties?: any) {
  const el = $.el('div', {
    className: 'dialog',
    id
  }) as HTMLDivElement;
  if (properties) {
    $.extend(el, properties);
  }
  el.style.cssText = Conf[`${id}.position`];

  const move = $('.move', el)!;
  $.on(move, 'touchstart mousedown', dragstart);
  for (const child of move.children) {
    if (!child.tagName) { continue; }
    $.on(child, 'touchstart mousedown', (e: Event) => e.stopPropagation());
  }

  return el;
};

class MenuClass {
  type: string;
  entries: any[];
  menu?: HTMLDivElement;

  constructor(type: string) {
    this.setPosition = this.setPosition.bind(this);
    this.close = this.close.bind(this);
    this.keybinds = this.keybinds.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.addEntry = this.addEntry.bind(this);
    this.type = type;
    $.on(d, 'AddMenuEntry', ({detail}: any) => {
      if (detail.type !== this.type) { return; }
      delete detail.open;
      this.addEntry(detail);
    });
    this.entries = [];
  }

  makeMenu() {
    const menu = $.el('div', {
      className: 'dialog',
      id:        'menu',
      tabIndex:  0
    }) as HTMLDivElement;
    menu.dataset.type = this.type;
    $.on(menu, 'click', e => e.stopPropagation());
    $.on(menu, 'keydown', this.keybinds);
    return menu;
  }

  toggle(e: Event, button: HTMLElement, data: any) {
    e.preventDefault();
    e.stopPropagation();

    if (Menu.currentMenu) {
      const previousButton = Menu.lastToggledButton;
      Menu.currentMenu.close();
      if (previousButton === button) { return; }
    }

    if (!this.entries.length) { return; }
    this.open(button, data);
  }

  open(button: HTMLElement, data: any) {
    let entry: any;
    const menu = (this.menu = this.makeMenu());
    Menu.currentMenu       = this;
    Menu.lastToggledButton = button;

    this.entries.sort((first, second) => first.order - second.order);

    for (entry of this.entries) {
      this.insertEntry(entry, menu, data);
    }

    $.addClass(Menu.lastToggledButton, 'active');

    $.on(d, 'click CloseMenu', this.close);
    $.on(d, 'scroll', this.setPosition);
    $.on(window, 'resize', this.setPosition);
    $.after(button, menu);

    this.setPosition();

    entry = $('.entry', menu);
    this.focus(entry);

    menu.focus();
  }

  setPosition() {
    if (!this.menu || !Menu.lastToggledButton) { return; }
    const menuEl = this.menu;
    const buttonEl = Menu.lastToggledButton;
    FastDOM.read(() => {
      if (!this.menu || !Menu.lastToggledButton) { return; }
      const mRect   = menuEl.getBoundingClientRect();
      const bRect   = buttonEl.getBoundingClientRect();
      const cHeight = doc.clientHeight;
      const cWidth  = doc.clientWidth;
      const [top, bottom] = (bRect.top + bRect.height + mRect.height) < cHeight ?
        [`${bRect.bottom}px`, '']
      :
        ['', `${cHeight - bRect.top}px`];
      const [left, right] = (bRect.left + mRect.width) < cWidth ?
        [`${bRect.left}px`, '']
      :
        ['', `${cWidth - bRect.right}px`];
      FastDOM.write(() => {
        if (!this.menu || !Menu.lastToggledButton) { return; }
        $.extend(menuEl.style, {top, right, bottom, left});
        menuEl.classList.toggle('left', !!right);
      });
    });
  }

  insertEntry(entry: any, parent: HTMLElement, data: any) {
    let submenu;
    if (typeof entry.open === 'function') {
      try {
        if (!entry.open(data)) { return; }
      } catch (err) {
        Callbacks.errorHandler?.({
          message: `Error in building the ${this.type} menu.`,
          error: err
        });
        return;
      }
    }
    $.add(parent, entry.el);

    if (!entry.subEntries) { return; }
    if (submenu = $('.submenu', entry.el)) {
      $.rm(submenu);
    }
    submenu = $.el('div', {className: 'dialog submenu'}) as HTMLDivElement;
    for (const subEntry of entry.subEntries) {
      this.insertEntry(subEntry, submenu, data);
    }
    $.add(entry.el, submenu);
  }

  close() {
    if (!this.menu) { return; }
    $.rm(this.menu);
    delete this.menu;
    if (Menu.lastToggledButton) {
      $.rmClass(Menu.lastToggledButton, 'active');
    }
    Menu.currentMenu       = null;
    Menu.lastToggledButton = null;
    $.off(d, 'click scroll CloseMenu', this.close);
    $.off(d, 'scroll', this.setPosition);
    $.off(window, 'resize', this.setPosition);
  }

  findNextEntry(entry: any, direction: number) {
    const entries = [...entry.parentNode.children] as HTMLElement[];
    entries.sort((first, second) => Number(first.style.order || 0) - Number(second.style.order || 0));
    return entries[entries.indexOf(entry) + direction];
  }

  keybinds(e: KeyboardEvent) {
    if (!this.menu || !Menu.lastToggledButton) { return; }
    let subEntry;
    let next, submenu;
    let entry = $('.focused', this.menu) as HTMLElement;
    while ((subEntry = $('.focused', entry))) {
      entry = subEntry as HTMLElement;
    }

    switch (e.keyCode) {
      case 27: // Esc
        Menu.lastToggledButton.focus();
        this.close();
        break;
      case 13: case 32: // Enter, Space
        entry.click();
        break;
      case 38: // Up
        if (next = this.findNextEntry(entry, -1)) {
          this.focus(next);
        }
        break;
      case 40: // Down
        if (next = this.findNextEntry(entry, +1)) {
          this.focus(next);
        }
        break;
      case 39: // Right
        if ((submenu = $('.submenu', entry)) && (next = submenu.firstElementChild)) {
          let nextPrev;
          while ((nextPrev = this.findNextEntry(next, -1))) {
            next = nextPrev;
          }
          this.focus(next);
        }
        break;
      case 37: // Left
        if (next = $.x('parent::*[contains(@class,"submenu")]/parent::*', entry)) {
          this.focus(next as HTMLElement);
        }
        break;
      default:
        return;
    }

    e.preventDefault();
    e.stopPropagation();
  }

  onFocus(e: Event) {
    e.stopPropagation();
    this.focus(e.target as HTMLElement);
  }

  focus(entry: HTMLElement) {
    let focused, submenu;
    while ((focused = $.x('parent::*/child::*[contains(@class,"focused")]', entry))) {
      $.rmClass(focused as HTMLElement, 'focused');
    }
    for (const el of $$('.focused', entry) as HTMLElement[]) {
      $.rmClass(el, 'focused');
    }
    $.addClass(entry, 'focused');

    if (!(submenu = $('.submenu', entry))) { return; }
    const submenuEl = submenu;
    const entryEl = entry;
    FastDOM.read(() => {
      const sRect   = submenuEl.getBoundingClientRect();
      const eRect   = entryEl.getBoundingClientRect();
      const cHeight = doc.clientHeight;
      const cWidth  = doc.clientWidth;
      const [top, bottom] = (eRect.top + sRect.height) < cHeight ?
        ['0px', 'auto']
      :
        ['auto', '0px'];
      const [left, right] = (eRect.right + sRect.width) < (cWidth - 150) ?
        ['100%', 'auto']
      :
        ['auto', '100%'];
      FastDOM.write(() => {
        const {style} = submenuEl as HTMLElement;
        style.top    = top;
        style.bottom = bottom;
        style.left   = left;
        style.right  = right;
      });
    });
  }

  addEntry(entry: any) {
    this.parseEntry(entry);
    this.entries.push(entry);
  }

  parseEntry(entry: any) {
    const {el, subEntries} = entry;
    $.addClass(el, 'entry');
    $.on(el, 'focus mouseover', this.onFocus);
    el.style.order = String(entry.order || 100);
    if (!subEntries) { return; }
    $.addClass(el, 'has-submenu');
    for (const subEntry of subEntries) {
      this.parseEntry(subEntry);
    }
    const span = $.el('span', {className: 'menu-indicator'});
    Icon.set(span, 'caretRight');
    $.add(el, span);
  }
}

const Menu: typeof MenuClass & {
  currentMenu: MenuClass | null | undefined;
  lastToggledButton: HTMLElement | null | undefined;
} = MenuClass as any;

Menu.currentMenu = null;
Menu.lastToggledButton = null;

export { Menu };

export var dragstart = function (this: HTMLElement, e: any) {
  let isTouching;
  if ((e.type === 'mousedown') && (e.button !== 0)) { return; } // not LMB
  e.preventDefault();
  if (isTouching = e.type === 'touchstart') {
    e = e.changedTouches[e.changedTouches.length - 1];
  }
  const el = $.x('ancestor::div[contains(@class,"dialog")][1]', this) as HTMLElement;
  const rect = el.getBoundingClientRect();
  const screenHeight = doc.clientHeight;
  const screenWidth  = doc.clientWidth;
  const o: any = {
    id:     el.id,
    style:  el.style,
    dx:     e.clientX - rect.left,
    dy:     e.clientY - rect.top,
    height: screenHeight - rect.height,
    width:  screenWidth  - rect.width,
    screenHeight,
    screenWidth,
    isTouching
  };

  [o.topBorder, o.bottomBorder] = Conf['Header auto-hide'] || !Conf['Fixed Header'] ?
    [0, 0]
  : Conf['Bottom Header'] ?
    [0, Header.bar.getBoundingClientRect().height]
  :
    [Header.bar.getBoundingClientRect().height, 0];

  if (isTouching) {
    o.identifier = e.identifier;
    o.move = touchmove.bind(o);
    o.up   = touchend.bind(o);
    $.on(d, 'touchmove', o.move);
    $.on(d, 'touchend touchcancel', o.up);
  } else { // mousedown
    o.move = drag.bind(o);
    o.up   = dragend.bind(o);
    $.on(d, 'mousemove', o.move);
    $.on(d, 'mouseup',   o.up);
  }
};

export var touchmove = function (this: any, e: any) {
  for (const touch of e.changedTouches) {
    if (touch.identifier === this.identifier) {
      drag.call(this, touch);
      return;
    }
  }
};

export var drag = function (this: any, e: any) {
  const {clientX, clientY} = e;

  let left = clientX - this.dx;
  left = left < 10 ?
    0
  : (this.width - left) < 10 ?
    ''
  :
    ((left / this.screenWidth) * 100) + '%';

  let top = clientY - this.dy;
  top = top < (10 + this.topBorder) ?
    this.topBorder + 'px'
  : (this.height - top) < (10 + this.bottomBorder) ?
    ''
  :
    ((top / this.screenHeight) * 100) + '%';

  const right = left === '' ?
    0
  :
    '';

  const bottom = top === '' ?
    this.bottomBorder + 'px'
  :
    '';

  const {style} = this;
  style.left   = left;
  style.right  = right;
  style.top    = top;
  style.bottom = bottom;
};

export var touchend = function (this: any, e: any) {
  for (const touch of e.changedTouches) {
    if (touch.identifier === this.identifier) {
      dragend.call(this);
      return;
    }
  }
};

export var dragend = function (this: any) {
  if (this.isTouching) {
    $.off(d, 'touchmove', this.move);
    $.off(d, 'touchend touchcancel', this.up);
  } else { // mouseup
    $.off(d, 'mousemove', this.move);
    $.off(d, 'mouseup',   this.up);
  }
  if (this.style.length === 2) { // assume only left or right and top or bottom
    $.set(`${this.id}.position`, this.style.cssText);
  } else { // only include position data.
    const { left, right, top, bottom } = this.style;
    let position = '';
    if (left) position += `left:${left};`;
    if (right) position += `right:${right};`;
    if (top) position += `top:${top};`;
    if (bottom) position += `bottom:${bottom};`;
    $.set(`${this.id}.position`, position);
  }
};

const hoverstart = function (this: any, { root, el, latestEvent, endEvents, height, width, cb, noRemove }: any) {
  const rect = root.getBoundingClientRect();
  const o: any = {
    root,
    el,
    style: el.style,
    isImage: ['IMG', 'VIDEO'].includes(el.nodeName),
    cb,
    endEvents,
    latestEvent,
    clientHeight: doc.clientHeight,
    clientWidth:  doc.clientWidth,
    height,
    width,
    noRemove,
    clientX: (rect.left + rect.right) / 2,
    clientY: (rect.top + rect.bottom) / 2
  };
  o.hover    = hover.bind(o);
  o.hoverend = hoverend.bind(o);

  o.hover(o.latestEvent);
  new MutationObserver(function() {
    if (el.parentNode) { o.hover(o.latestEvent); }
  }).observe(el, {childList: true});

  $.on(root, endEvents,   o.hoverend);
  if ($.x('ancestor::div[contains(@class,"inline")][1]', root)) {
    $.on(d,    'keydown',   o.hoverend);
  }
  $.on(root, 'mousemove', o.hover);

  o.workaround = function(e: any) { if (!root.contains(e.target)) { o.hoverend(e); } };
  $.on(doc,  'mousemove', o.workaround);
};

(hoverstart as any).padding = 25;

export var hover = function (this: any, e: any) {
  this.latestEvent = e;
  const height = (this.height || this.el.offsetHeight) + (hoverstart as any).padding;
  const width  = (this.width  || this.el.offsetWidth);
  const {clientX, clientY} = Conf['Follow Cursor'] ? e : this;

  const top = this.isImage ?
    Math.max(0, (clientY * (this.clientHeight - height)) / this.clientHeight)
  :
    Math.max(0, Math.min(this.clientHeight - height, clientY - 120));

  let threshold = this.clientWidth / 2;
  if (!this.isImage) { threshold = Math.max(threshold, this.clientWidth - 400); }
  let marginX: any = (clientX <= threshold ? clientX : this.clientWidth - clientX) + 45;
  if (this.isImage) { marginX = Math.min(marginX, this.clientWidth - width); }
  marginX += 'px';
  const [left, right] = clientX <= threshold ? [marginX, ''] : ['', marginX];

  const {style} = this;
  style.top   = top + 'px';
  style.left  = left;
  style.right = right;
};

export var hoverend = function (this: any, e: any) {
  if (((e.type === 'keydown') && (e.keyCode !== 13)) || (e.target.nodeName === "TEXTAREA")) { return; }
  if (!this.noRemove) { $.rm(this.el); }
  $.off(this.root, this.endEvents,  this.hoverend);
  $.off(d,     'keydown',   this.hoverend);
  $.off(this.root, 'mousemove', this.hover);
  $.off(doc,   'mousemove', this.workaround);
  if (this.cb) { this.cb.call(this); }
};

export const checkbox = function (name: string, text: string, checked?: boolean) {
  if (checked == null) { checked = Conf[name]; }
  const label = $.el('label');
  const input = $.el('input', {type: 'checkbox', name, checked});
  $.add(label, [input, $.tn(` ${text}`)]);
  return label as HTMLLabelElement;
};

const UI = {
  dialog,
  Menu,
  hover:    hoverstart,
  checkbox
};
export default UI;
