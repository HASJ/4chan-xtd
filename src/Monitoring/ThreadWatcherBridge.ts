type ThreadWatcherUpdate = (siteID: string, boardID: string, threadID: number, newData: any) => void;

let threadWatcherUpdate: ThreadWatcherUpdate = () => {};

export function registerThreadWatcherUpdate(update: ThreadWatcherUpdate): void {
  threadWatcherUpdate = update;
}

export function updateWatchedThread(siteID: string, boardID: string, threadID: number, newData: any): void {
  threadWatcherUpdate(siteID, boardID, threadID, newData);
}
