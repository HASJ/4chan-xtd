type LinkifyProcessor = (node: Node) => HTMLAnchorElement[];

let processor: LinkifyProcessor = () => [];

export function registerLinkifyProcessor(fn: LinkifyProcessor): void {
  processor = fn;
}

export function processLinks(node: Node): HTMLAnchorElement[] {
  return processor(node);
}
