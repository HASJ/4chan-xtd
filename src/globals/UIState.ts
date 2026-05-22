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
};

UIState.noticesRoot.id = 'notifications';
UIState.headerBar.id = 'header-bar';
UIState.hoverUI.id = 'hoverUI';

export default UIState;
