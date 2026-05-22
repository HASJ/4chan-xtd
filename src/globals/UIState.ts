import $ from "../platform/$";

const UIState = {
  /**
   * Root element for notifications/notices.
   */
  noticesRoot: $.el('div', { id: 'notifications' }),

  /**
   * Root element for the header bar.
   */
  headerBar: $.el('div', { id: 'header-bar' }),

  /**
   * Root element for hover UI.
   */
  hoverUI: $.el('div', { id: 'hoverUI' }),
};

export default UIState;
