import { beforeEach, describe, expect, it, vi } from 'vitest';
import UI from './UI';

describe('UI.Menu', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('rebuilds submenu entries on open so their open hooks can attach behavior', () => {
    const menu = new UI.Menu('post');
    (menu.el as any).focus = vi.fn();

    const clickSpy = vi.fn();
    const topOpen = vi.fn(() => true);
    const subOpen = vi.fn(() => {
      submenuEntry.el.addEventListener('click', clickSpy, { once: true });
      return true;
    });

    const submenuEntry = {
      el: document.createElement('a'),
      open: subOpen,
    };
    submenuEntry.el.href = 'javascript:;';
    submenuEntry.el.textContent = 'Subentry';

    menu.addEntry({
      el: document.createElement('div'),
      open: topOpen,
      subEntries: [submenuEntry],
    });

    const button = document.createElement('a');
    button.href = 'javascript:;';

    menu.toggle(new MouseEvent('click', { bubbles: true, cancelable: true }), button, { id: 123 });

    expect(topOpen).toHaveBeenCalledWith({ id: 123 });
    expect(subOpen).toHaveBeenCalledWith({ id: 123 });

    submenuEntry.el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('filters submenu entries through their open hooks when the menu opens', () => {
    const menu = new UI.Menu('post');
    (menu.el as any).focus = vi.fn();

    const visible = {
      el: document.createElement('a'),
      open: vi.fn(() => true),
    };
    visible.el.href = 'javascript:;';
    visible.el.textContent = 'Visible';

    const hidden = {
      el: document.createElement('a'),
      open: vi.fn(() => false),
    };
    hidden.el.href = 'javascript:;';
    hidden.el.textContent = 'Hidden';

    menu.addEntry({
      el: document.createElement('div'),
      open: vi.fn(() => true),
      subEntries: [visible, hidden],
    });

    const button = document.createElement('a');
    button.href = 'javascript:;';

    menu.toggle(new MouseEvent('click', { bubbles: true, cancelable: true }), button, {});

    const submenu = menu.el.querySelector('.submenu');
    expect(submenu?.classList.contains('dialog')).toBe(true);
    expect(submenu?.children).toHaveLength(1);
    expect(submenu?.firstElementChild).toBe(visible.el);
    expect(hidden.open).toHaveBeenCalled();
  });
});
