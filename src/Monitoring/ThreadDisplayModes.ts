import { Conf } from "../globals/globals";
import $ from "../platform/$";

let quoteThreadingInput: HTMLInputElement | undefined;
let replyPruningInput: HTMLInputElement | undefined;

export function registerQuoteThreadingInput(input: HTMLInputElement): void {
  quoteThreadingInput = input;
}

export function registerReplyPruningInput(input: HTMLInputElement): void {
  replyPruningInput = input;
}

export function disableReplyPruning(): void {
  if (!replyPruningInput?.checked) return;
  replyPruningInput.checked = false;
  $.event("change", null, replyPruningInput);
}

export function disableQuoteThreading(saveSetting = true): void {
  if (!quoteThreadingInput) return;
  quoteThreadingInput.checked = false;
  if (saveSetting) {
    $.event("change", null, quoteThreadingInput);
  } else {
    Conf["Thread Quotes"] = false;
  }
}
