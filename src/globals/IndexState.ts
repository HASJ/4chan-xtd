const IndexState = {
  /**
   * Whether hidden threads are currently shown in the index.
   */
  showHiddenThreads: false,

  /**
   * Whether the index is enabled.
   */
  enabled: false,

  /**
   * Root element for the index.
   */
  root: null as HTMLElement | null,

  /**
   * Sorted thread IDs currently in the index.
   */
  sortedThreadIDs: [] as number[],
};

export default IndexState;
