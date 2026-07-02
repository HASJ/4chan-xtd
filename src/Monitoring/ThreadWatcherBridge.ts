type ThreadWatcherUpdate = (siteID: string, boardID: string, threadID: number, newData: any) => void;
type ThreadWatcherLookup = (boardID: string, threadID: number) => boolean;

let threadWatcherUpdate: ThreadWatcherUpdate = () => {};
let threadWatcherLookup: ThreadWatcherLookup = () => false;

export function registerThreadWatcherUpdate(update: ThreadWatcherUpdate): void {
  threadWatcherUpdate = update;
}

export function updateWatchedThread(siteID: string, boardID: string, threadID: number, newData: any): void {
  threadWatcherUpdate(siteID, boardID, threadID, newData);
}

export function registerThreadWatcherLookup(lookup: ThreadWatcherLookup): void {
  threadWatcherLookup = lookup;
}

export function isThreadWatched(boardID: string, threadID: number): boolean {
  return threadWatcherLookup(boardID, threadID);
}
