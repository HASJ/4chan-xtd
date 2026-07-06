import { Conf, d, doc } from './globals';

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
   * Root element for the scroll marker/toggle.
   */
  scrollMarkerRoot: document.createElement('div'),

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

  /**
   * The main header menu.
   */
  headerMenu: null as any,

  /**
   * Gets the top offset of a node relative to the header.
   */
  getTopOf(root: HTMLElement) {
    let { top } = root.getBoundingClientRect();
    if (Conf['Fixed Header'] && !Conf['Bottom Header']) {
      const headRect = UIState.scrollMarkerRoot.getBoundingClientRect();
      top -= headRect.top + headRect.height;
    }
    return top;
  },

  /**
   * Gets the bottom offset of a node relative to the header.
   */
  getBottomOf(root: HTMLElement) {
    const { clientHeight } = doc;
    let bottom = clientHeight - root.getBoundingClientRect().bottom;
    if (Conf['Fixed Header'] && Conf['Bottom Header']) {
      const headRect = UIState.scrollMarkerRoot.getBoundingClientRect();
      bottom -= (clientHeight - headRect.bottom) + headRect.height;
    }
    return bottom;
  },

  /**
   * Checks if a node is visible, taking the header into account.
   */
  isNodeVisible(node: HTMLElement) {
    if (d.hidden || !doc.contains(node)) { return false; }
    const { height } = node.getBoundingClientRect();
    return ((UIState.getTopOf(node) + height) >= 0) && ((UIState.getBottomOf(node) + height) >= 0);
  },

  /**
   * Checks if the header bar is hidden.
   */
  isHeaderHidden() {
    const { top } = UIState.headerBar.getBoundingClientRect();
    if (Conf['Bottom Header']) {
      return top === doc.clientHeight;
    } else {
      return top < 0;
    }
  },

  /**
   * Scrolls to a node, taking the header bar height into account.
   */
  scrollTo(root: HTMLElement, down?: boolean, needed?: boolean) {
    let x = 0;
    if (down) {
      x = root.getBoundingClientRect().bottom + window.pageYOffset - doc.clientHeight;
      if (!needed || (x > 0)) { window.scrollTo(0, x); }
    } else {
      x = root.getBoundingClientRect().top + window.pageYOffset;
      const { height } = UIState.headerBar.getBoundingClientRect();
      if (!UIState.isHeaderHidden()) {
        x -= height;
      }
      if (!needed || (x < window.pageYOffset)) { window.scrollTo(0, x); }
    }
  },

  /**
   * Scrolls to a node if it is not visible.
   */
  scrollToIfNeeded(node: HTMLElement, down?: boolean) {
    UIState.scrollTo(node, down, true);
  }
};

UIState.noticesRoot.id = 'notifications';
UIState.headerBar.id = 'header-bar';
UIState.hoverUI.id = 'hoverUI';
UIState.shortcutsRoot.id = 'shortcuts';
UIState.scrollMarkerRoot.id = 'scroll-marker';

export default UIState;
