type QuickFilterHandler = (this: any, event?: Event) => void;

let md5Handler: QuickFilterHandler = () => {};

export function registerQuickFilterMD5(handler: QuickFilterHandler): void {
  md5Handler = handler;
}

export function runQuickFilterMD5(this: any, event?: Event): void {
  md5Handler.call(this, event);
}
