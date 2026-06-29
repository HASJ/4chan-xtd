/*
 * Explicit Quick Reply captcha bridge.
 *
 * QR.ts owns the concrete Quick Reply implementation and registers this
 * facade after the QR object exists. Captcha modules import only these
 * helpers so the QR/captcha dependency stays one-way and acyclic.
 *
 * IMPORTANT: To maintain the acyclic dependency graph, this module must
 * NOT import QR.ts, Captcha.js, or Captcha.t.js.
 */
export interface QRCaptchaPost {
  thread: string | number;
  file?: unknown;
  isOnlyQuotes(): boolean;
}

export interface QRCaptchaNodes {
  el: HTMLElement;
  com: HTMLTextAreaElement;
  status: HTMLElement;
}

export interface QRCaptchaBridge {
  getPosts(): QRCaptchaPost[];
  hasActiveRequest(): boolean;
  isAutoCooldown(): boolean;
  getNodes(): QRCaptchaNodes | undefined;
  focus(): void;
  focusComment(preventScroll?: boolean): void;
  focusStatus(): void;
  showError(error: unknown, focusOverride?: boolean): void;
  submit(): void;
  setupCaptcha(focus?: boolean): void;
  addClass(...classes: string[]): void;
  removeClass(...classes: string[]): void;
  insertCaptchaRoot(root: HTMLElement): void;
}

let currentBridge: QRCaptchaBridge | undefined;
const emptyPosts: QRCaptchaPost[] = [];

function requireBridge(): QRCaptchaBridge {
  if (!currentBridge) {
    throw new Error("QR captcha bridge used before registration.");
  }
  return currentBridge;
}

export function registerQRCaptchaBridge(bridge: QRCaptchaBridge) {
  currentBridge = bridge;
}

export function getQRPosts() {
  return currentBridge?.getPosts() ?? emptyPosts;
}

export function getFirstQRPost() {
  return getQRPosts()[0];
}

export function hasActiveQRRequest() {
  return currentBridge?.hasActiveRequest() ?? false;
}

export function isQRAutoCooldown() {
  return currentBridge?.isAutoCooldown() ?? false;
}

export function getQRNodes() {
  return currentBridge?.getNodes();
}

export function getQRRoot() {
  return getQRNodes()?.el;
}

export function getQRCommentInput() {
  return getQRNodes()?.com;
}

export function getQRStatusInput() {
  return getQRNodes()?.status;
}

export function isQROpen() {
  const root = getQRRoot();
  return !!root && !root.hidden;
}

export function isQRCommentActive() {
  return document.activeElement === getQRCommentInput();
}

export function isQRStatusActive() {
  return document.activeElement === getQRStatusInput();
}

export function focusQR() {
  currentBridge?.focus();
}

export function focusQRComment(preventScroll = false) {
  currentBridge?.focusComment(preventScroll);
}

export function focusQRStatus() {
  currentBridge?.focusStatus();
}

export function showQRError(error: unknown, focusOverride?: boolean) {
  return requireBridge().showError(error, focusOverride);
}

export function submitQR() {
  return requireBridge().submit();
}

export function setupCurrentCaptcha(focus?: boolean) {
  currentBridge?.setupCaptcha(focus);
}

export function addQRClass(...classes: string[]) {
  currentBridge?.addClass(...classes);
}

export function removeQRClass(...classes: string[]) {
  currentBridge?.removeClass(...classes);
}

export function insertCaptchaRoot(root: HTMLElement) {
  currentBridge?.insertCaptchaRoot(root);
}
