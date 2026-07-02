type BoardListUpdater = (list: HTMLElement | undefined) => void;
type BoardURLKind = "index" | "catalog";
type BoardURLResolver = (kind: BoardURLKind, board: { siteID: string, boardID: string }) => string | undefined;

interface BoardURLRequest {
  link: HTMLAnchorElement;
  kind: BoardURLKind;
  board: { siteID: string, boardID: string };
}

const updaters: BoardListUpdater[] = [];
const lists: HTMLElement[] = [];
const boardURLRequests: BoardURLRequest[] = [];
let boardURLResolver: BoardURLResolver | undefined;

export function registerBoardListUpdater(updater: BoardListUpdater): void {
  updaters.push(updater);
  for (const list of lists) updater(list);
}

export function updateBoardListLinks(list: HTMLElement | undefined): void {
  if (!list) return;
  if (!lists.includes(list)) lists.push(list);
  for (const updater of updaters) updater(list);
}

export function getBoardLists(): HTMLElement[] {
  return lists.slice();
}

export function registerBoardURLResolver(resolver: BoardURLResolver): void {
  boardURLResolver = resolver;
  for (const request of boardURLRequests) applyBoardURL(request);
}

export function setBoardLinkURL(link: HTMLAnchorElement, kind: BoardURLKind, board: { siteID: string, boardID: string }): boolean {
  const request = { link, kind, board };
  if (!boardURLRequests.some(item => item.link === link)) boardURLRequests.push(request);
  return applyBoardURL(request);
}

export function resolveBoardURL(kind: BoardURLKind, board: { siteID: string, boardID: string }): string | undefined {
  return boardURLResolver?.(kind, board);
}

function applyBoardURL({ link, kind, board }: BoardURLRequest): boolean {
  if (!boardURLResolver) return true;
  const url = boardURLResolver(kind, board);
  if (!url) return false;
  link.dataset.only = kind;
  link.href = url;
  if (kind === "catalog") link.classList.add("catalog");
  return true;
}
