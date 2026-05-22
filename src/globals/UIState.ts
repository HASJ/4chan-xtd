const UIState = {
  /**
   * Root element for notifications/notices.
   */
  noticesRoot: document.createElement('div'),

  /**
   * Root element for the header bar.
   */
  headerBar: document.createElement('div'),

  /**
   * Root element for hover UI.
   */
  hoverUI: document.createElement('div'),

  /**
   * Root element for header shortcuts.
   */
  shortcutsRoot: document.createElement('span'),

  /**
   * Adds a shortcut to the header bar.
   */
  addShortcut(id: string, el: HTMLElement, index: number) {
    const shortcut = document.createElement('span');
    shortcut.id = `shortcut-${id}`;
    shortcut.className = 'shortcut brackets-wrap';
    shortcut.appendChild(el);
    shortcut.dataset.index = index.toString();
    const children = Array.from(UIState.shortcutsRoot.querySelectorAll('[data-index]')) as HTMLElement[];
    for (const item of children) {
      if (item.dataset.index && (+item.dataset.index > index)) {
        UIState.shortcutsRoot.insertBefore(shortcut, item);
        return;
      }
    }
    UIState.shortcutsRoot.appendChild(shortcut);
  },

  /**
   * Removes a shortcut from the header bar.
   */
  rmShortcut(el: HTMLElement) {
    if (el.parentElement) {
      el.parentElement.remove();
    }
  },

  /**
   * Whether desktop notifications are enabled.
   */
  areNotificationsEnabled: false,
};

UIState.noticesRoot.id = 'notifications';
UIState.headerBar.id = 'header-bar';
UIState.hoverUI.id = 'hoverUI';
UIState.shortcutsRoot.id = 'shortcuts';

export default UIState;
