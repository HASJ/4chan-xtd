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
  return requireBridge().getPosts();
}

export function getFirstQRPost() {
  return getQRPosts()[0];
}

export function hasActiveQRRequest() {
  return requireBridge().hasActiveRequest();
}

export function isQRAutoCooldown() {
  return requireBridge().isAutoCooldown();
}

export function getQRNodes() {
  return requireBridge().getNodes();
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
  return requireBridge().focus();
}

export function focusQRComment(preventScroll = false) {
  return requireBridge().focusComment(preventScroll);
}

export function focusQRStatus() {
  return requireBridge().focusStatus();
}

export function showQRError(error: unknown, focusOverride?: boolean) {
  return requireBridge().showError(error, focusOverride);
}

export function submitQR() {
  return requireBridge().submit();
}

export function setupCurrentCaptcha(focus?: boolean) {
  return requireBridge().setupCaptcha(focus);
}

export function addQRClass(...classes: string[]) {
  return requireBridge().addClass(...classes);
}

export function removeQRClass(...classes: string[]) {
  return requireBridge().removeClass(...classes);
}

export function insertCaptchaRoot(root: HTMLElement) {
  return requireBridge().insertCaptchaRoot(root);
}