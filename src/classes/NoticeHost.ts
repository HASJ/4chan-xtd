let noticesRoot: HTMLElement | undefined;
const pendingNotices: HTMLElement[] = [];

export function setNoticesRoot(root: HTMLElement): void {
  noticesRoot = root;
  while (pendingNotices.length) {
    noticesRoot.appendChild(pendingNotices.shift()!);
  }
}

export function addNoticeElement(el: HTMLElement): void {
  if (noticesRoot) {
    noticesRoot.appendChild(el);
  } else if (!pendingNotices.includes(el)) {
    pendingNotices.push(el);
  }
}
