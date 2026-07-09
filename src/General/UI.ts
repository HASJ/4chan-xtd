import { Conf, d, doc } from "../globals/globals";
import Callbacks from "../classes/Callbacks";
import $ from "../platform/$";
import $$ from "../platform/$$";
import UIState from "../globals/UIState";
import { getHeaderDialogBorders } from "./HeaderLayout";
import Icon from "../Icons/icon";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
export const dialog = function(id: string, properties: any) {
  const el = $.el('div', {
    className: 'dialog',
    id
  });
  if (properties) { $.extend(el, properties); }
  
  if (Conf[`${id}.position`]) {
    el.style.cssText = Conf[`${id}.position`];
  }

  const move = $('.move', el) as HTMLElement;
  if (move) {
    $.on(move, 'touchstart mousedown', dragstart);
    for (const child of Array.from(move.children)) {
      if (!child.tagName) { continue; }
      $.on(child as HTMLElement, 'touchstart mousedown', e => e.stopPropagation());
    }
  }

  return el;
};

export const Menu = class Menu {
  type: string;
  entries: any[];
  el: HTMLElement;

  constructor(type: string) {
    this.type = type;
    this.entries = [];
    this.el = $.el('div', {
      className: 'menu',
      id:        `${this.type}-menu`,
      tabIndex:  0
    });
    $.on(this.el, 'click', function(e: MouseEvent) {
      if ((e.target as HTMLElement).nodeName !== 'A') { return e.stopPropagation(); }
    });
    $.on(this.el, 'keydown', (e: KeyboardEvent) => this.onKeydown(e));
    $.on(d, 'click CloseMenu 4chanXInitFinished', () => this.close());
    $.on(d, 'scroll visibilitychange', () => this.close());
  }

  onKeydown(e: KeyboardEvent) {
    let entry = d.activeElement as HTMLElement;
    if (!this.el.contains(entry)) { return; }

    if (e.keyCode === 27) { // Esc
      this.close();
      return;
    }

    let next: HTMLElement | null;
    let submenu: HTMLElement | null;

    switch (e.keyCode) {
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
        if ((submenu = $('.submenu', entry)) && (next = submenu.firstElementChild as HTMLElement)) {
          let nextPrev: HTMLElement | null;
          while ((nextPrev = this.findNextEntry(next, -1))) {
            next = nextPrev;
          }
          this.focus(next);
        }
        break;
      case 37: // Left
        if (next = $.x('parent::*[contains(@class,"submenu")]/parent::*', entry) as HTMLElement) {
          this.focus(next);
        }
        break;
      default:
        return;
    }

    e.preventDefault();
    return e.stopPropagation();
  }

  findNextEntry(entry: HTMLElement, direction: number): HTMLElement | null {
    let next = (direction === 1 ? entry.nextElementSibling : entry.previousElementSibling) as HTMLElement;
    while (next && (!next.classList.contains('entry') || next.hidden)) {
      next = (direction === 1 ? next.nextElementSibling : next.previousElementSibling) as HTMLElement;
    }
    return next;
  }

  onFocus(e: FocusEvent) {
    e.stopPropagation();
    return this.focus(e.target as HTMLElement);
  }

  focus(entry: HTMLElement) {
    let focused: HTMLElement | null;
    while ((focused = $.x('parent::*/child::*[contains(@class,"focused")]', entry) as HTMLElement)) {
      $.rmClass(focused, 'focused');
    }
    for (const el of $$('.focused', entry)) {
      $.rmClass(el, 'focused');
    }
    $.addClass(entry, 'focused');

    // Submenu positioning.
    const submenu = $('.submenu', entry);
    if (!submenu) { return; }
    const sRect   = submenu.getBoundingClientRect();
    const eRect   = entry.getBoundingClientRect();
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
    const {style} = submenu;
    style.top    = top;
    style.bottom = bottom;
    style.left   = left;
    return style.right  = right;
  }

  addEntry(entry: any) {
    this.parseEntry(entry);
    return this.entries.push(entry);
  }

  parseEntry(entry: any) {
    const {el, subEntries} = entry;
    $.addClass(el, 'entry');
    $.on(el, 'focus mouseover', (e: any) => this.onFocus(e));
    el.style.order = entry.order || 100;
    if (!subEntries) { return; }
    $.addClass(el, 'has-submenu');
    const submenu = $.el('div', {className: 'submenu'});
    for (var subEntry of subEntries) {
      this.parseEntry(subEntry);
      $.add(submenu, subEntry.el);
    }
    $.add(el, submenu);
    const span = $.el('span',
      {className: 'menu-indicator'}
    );
    Icon.set(span, 'caretRight');
    $.add(el, span);
  }

  makeButton(post: any) {
    const a = $.el('a', {
      className: 'menu-button',
      href:      'javascript:;'
    });
    a.dataset.fullID = post.fullID;
    Icon.set(a, 'caretDown');
    $.on(a, 'click', (e: MouseEvent) => {
      return this.toggle(e, a, post);
    });
    return a;
  }

  toggle(e: MouseEvent, a: HTMLElement, post: any) {
    e.preventDefault();
    $.event('CloseMenu', undefined);
    for (var entry of this.entries) {
      var show = !entry.open || entry.open({
        thread:  post.thread,
        post,
        isReply: post.isReply
      });
      if (show) {
        $.add(this.el, entry.el);
      } else {
        $.rm(entry.el);
      }
    }
    if (!this.el.children.length) { return; }

    $.add(d.body, this.el);
    const rect = a.getBoundingClientRect();
    const {style} = this.el;
    const top  = (rect.top + (rect.height / 2)) - (this.el.offsetHeight / 2);
    const left = rect.left + rect.width;
    style.top  = `${top  + window.pageYOffset}px`;
    style.left = `${left + window.pageXOffset}px`;

    this.el.focus();
    return e.stopPropagation();
  }

  close() {
    if (this.el.parentNode) {
      return $.rm(this.el);
    }
  }
};

export const dragstart = function (this: HTMLElement, e: any) {
  let isTouching;
  if ((e.type === 'mousedown') && (e.button !== 0)) { return; } // not LMB
  // prevent text selection
  e.preventDefault();
  if (isTouching = e.type === 'touchstart') {
    e = e.changedTouches[e.changedTouches.length - 1];
  }
  // distance from pointer to el edge is constant; calculate it here.
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

  [o.topBorder, o.bottomBorder] = getHeaderDialogBorders();

  if (isTouching) {
    o.identifier = e.identifier;
    o.move = touchmove.bind(o);
    o.up   = touchend.bind(o);
    $.on(d, 'touchmove', o.move);
    return $.on(d, 'touchend touchcancel', o.up);
  } else { // mousedown
    o.move = drag.bind(o);
    o.up   = dragend.bind(o);
    $.on(d, 'mousemove', o.move);
    return $.on(d, 'mouseup',   o.up);
  }
};

export const touchmove = function (this: any, e: TouchEvent) {
  for (var touch of (e.changedTouches as any)) {
    if (touch.identifier === this.identifier) {
      drag.call(this, touch);
      return;
    }
  }
};

export const drag = function (this: any, e: any) {
  const {clientX, clientY} = e;

  let left: string | number = clientX - this.dx;
  left = left < 10 ?
    0
  : (this.width - left) < 10 ?
    ''
  :
    ((left / this.screenWidth) * 100) + '%';

  let top: string | number = clientY - this.dy;
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
  style.left   = typeof left === 'number' ? `${left}px` : left;
  style.right  = typeof right === 'number' ? `${right}px` : right;
  style.top    = typeof top === 'number' ? `${top}px` : top;
  style.bottom = typeof bottom === 'number' ? `${bottom}px` : bottom;
};

export const touchend = function (this: any, e: TouchEvent) {
  for (var touch of (e.changedTouches as any)) {
    if (touch.identifier === this.identifier) {
      dragend.call(this);
      return;
    }
  }
};

export const dragend = function (this: any) {
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

const hoverstart = function ({ root, el, latestEvent, endEvents, height, width, cb, noRemove }: any) {
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
    if (el.parentNode) { return o.hover(o.latestEvent); }
  }).observe(el, {childList: true});

  $.on(root, endEvents,   o.hoverend);
  if ($.x('ancestor::div[contains(@class,"inline")][1]', root)) {
    $.on(d,    'keydown',   o.hoverend);
  }
  $.on(root, 'mousemove', o.hover);

  // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=674955
  o.workaround = function(e: MouseEvent) { if (!root.contains(e.target)) { return o.hoverend(e); } };
  return $.on(doc,  'mousemove', o.workaround);
};

(hoverstart as any).padding = 25;

export const hover = function (this: any, e: any) {
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
  let marginX = (clientX <= threshold ? clientX : this.clientWidth - clientX) + 45;
  if (this.isImage) { marginX = Math.min(marginX, this.clientWidth - width); }
  let marginXStr = marginX + 'px';
  const [left, right] = clientX <= threshold ? [marginXStr, ''] : ['', marginXStr];

  const {style} = this;
  style.top   = top + 'px';
  style.left  = left;
  return style.right = right;
};

export const hoverend = function (this: any, e: any) {
  if (((e.type === 'keydown') && (e.keyCode !== 13)) || (e.target.nodeName === "TEXTAREA")) { return; }
  if (!this.noRemove) { $.rm(this.el); }
  $.off(this.root, this.endEvents,  this.hoverend);
  $.off(d,     'keydown',   this.hoverend);
  $.off(this.root, 'mousemove', this.hover);
  // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=674955
  $.off(doc,   'mousemove', this.workaround);
  if (this.cb) { return this.cb.call(this); }
};

export const checkbox = function (name: string, text: string, checked?: boolean) {
  if (checked == null) { checked = Conf[name]; }
  const label = $.el('label');
  const input = $.el('input', {type: 'checkbox', name, checked});
  $.add(label, [input, $.tn(` ${text}`)]);
  return label;
};

const UI = {
  dialog,
  Menu,
  hover:    hoverstart,
  checkbox
};

export default UI;
