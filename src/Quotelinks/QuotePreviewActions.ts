type QuotePreviewMouseover = (this: HTMLElement, e: MouseEvent) => void;

let quotePreviewMouseover: QuotePreviewMouseover = () => {};

export function registerQuotePreviewMouseover(handler: QuotePreviewMouseover) {
  quotePreviewMouseover = handler;
}

export function runQuotePreviewMouseover(this: HTMLElement, e: MouseEvent) {
  return quotePreviewMouseover.call(this, e);
}
