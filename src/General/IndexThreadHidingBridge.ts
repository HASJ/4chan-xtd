interface IndexThreadHidingActions {
  updateHideLabel(): void;
  isShowingHiddenThreads(): boolean;
  getRoot(): HTMLElement | undefined;
  getSortedThreadIDs(): number[];
}

let actions: IndexThreadHidingActions = {
  updateHideLabel() {},
  isShowingHiddenThreads() { return false; },
  getRoot() { return undefined; },
  getSortedThreadIDs() { return []; },
};

export function registerIndexThreadHidingActions(nextActions: IndexThreadHidingActions) {
  actions = nextActions;
}

export function updateIndexHideLabel() {
  actions.updateHideLabel();
}

export function indexShowsHiddenThreads() {
  return actions.isShowingHiddenThreads();
}

export function getIndexRoot() {
  return actions.getRoot();
}

export function getIndexSortedThreadIDs() {
  return actions.getSortedThreadIDs();
}
