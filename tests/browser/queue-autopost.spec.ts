import { expect, type Page, test } from '@playwright/test';
import { resolve } from 'node:path';

const bundle = resolve('builds/4chan-XTd.user.js');
const fixtureServer = 'http://127.0.0.1:4173';
const storageKey = (name: string) => `4chan XTd${name}`;

async function installHarness(page: Page, values: Record<string, unknown> = {}) {
  await page.addInitScript(({ values }) => {
    const store = new Map(Object.entries(values));
    const get = (key: string, fallback?: unknown) => store.has(key) ? store.get(key) : fallback;
    const set = (key: string, value: unknown) => { store.set(key, value); };
    window.GM_getValue = get;
    window.GM_setValue = set;
    window.GM_deleteValue = (key: string) => { store.delete(key); };
    window.GM_listValues = () => [...store.keys()];
    window.GM_openInTab = () => undefined;
    window.GM_info = { scriptHandler: 'Playwright fixture', version: '1' };
    window.GM_xmlhttpRequest = ({ url, method, data, responseType, onload, onloadend }: any) => {
      fetch(url, { method: method || 'GET', body: data }).then(async response => {
        const body = await response.text();
        const doc = responseType === 'document' ? new DOMParser().parseFromString(body, 'text/html') : body;
        const result = { status: response.status, response: doc, responseText: body };
        onload?.call(result, result);
        onloadend?.call(result, result);
      });
    };
    window.GM = {
      getValue: async (key: string, fallback?: unknown) => get(key, fallback),
      setValue: async (key: string, value: unknown) => set(key, value),
      deleteValue: async (key: string) => { store.delete(key); },
      listValues: async () => [...store.keys()],
      openInTab: window.GM_openInTab,
      xmlHttpRequest: window.GM_xmlhttpRequest,
    };
    window.Notification ??= class { close() {} } as any;
    window.open ??= (() => null);
  }, { values: Object.fromEntries(Object.entries(values).map(([key, value]) => [key, JSON.stringify(value)])) });

  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!['boards.4chan.org', 'a.4cdn.org', 'i.4cdn.org', 's.4cdn.org'].includes(url.hostname)) {
      await route.continue();
      return;
    }
    const response = await fetch(`${fixtureServer}${url.pathname}${url.search}`);
    await route.fulfill({
      status: response.status,
      contentType: response.headers.get('content-type') || 'text/plain',
      body: Buffer.from(await response.arrayBuffer()),
    });
  });
}

// QR.response() must release the request lock for the *next* queued post: the
// captcha reads it through QRState, so a lock left behind blocks every later
// auto-post while the status button still counts down "Auto N".
test('auto-posts the next queued reply after the first one succeeds', async ({ page }) => {
  await installHarness(page, {
    [storageKey('previousversion')]: '2.31.10',
    [storageKey('Thread Watcher')]: false,
    [storageKey('Post on Captcha Completion')]: true,
    [storageKey('Next challenge on captcha selection')]: false,
    [storageKey('Auto-load captcha')]: false,
    [storageKey('Auto-load captcha after cooldown')]: false,
    [storageKey('Auto-post typing delay')]: 0,
  });
  const sent: string[] = [];
  await page.route('https://sys.4chan.org/**', async route => {
    const request = route.request();
    if (request.method() === 'POST') sent.push(request.postData() || '');
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      headers: { 'access-control-allow-origin': request.headers().origin || '*', 'access-control-allow-credentials': 'true' },
      body: `<html><head><title>Post successful!</title></head><body><h1>ok</h1>thread:100,no:${100 + sent.length}</body></html>`,
    });
  });
  await page.goto('/g/thread/100', { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ path: resolve('tests/browser/fixtures/tcaptcha-native.js') });
  await page.addScriptTag({ path: bundle });
  await page.locator('.qr-link').first().click();
  await page.locator('#qr textarea[data-name="com"]').fill('first reply');
  await page.evaluate(() => (document.querySelector('#qr #add-post') as HTMLElement).click());
  await page.locator('#qr textarea[data-name="com"]').fill('second reply');
  await expect(page.locator('#qr #t-slider')).toHaveCount(1);

  const solve = async (challenge: string) => {
    await page.evaluate(challenge => {
      const image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/ZfoAAAAASUVORK5CYII=';
      (window as any).TCaptcha.setChallenge({ challenge, tasks: Array.from({ length: 3 }, () => ({ str: 'Choose an answer', items: [image, image, image] })) });
    }, challenge);
    for (let step = 1; step <= 3; step++) {
      await expect(page.locator('#qr .captcha-strips')).toHaveAttribute('data-step', `Next (${step}/3)`);
      await page.waitForTimeout(600); // Native image capture samples each slider value before accepting clicks.
      await page.locator('#qr .captcha-strip').nth(1).click();
      if (step < 3) await page.locator('#qr #t-next').click();
    }
  };

  await solve('first');
  await expect.poll(() => sent.length).toBe(1);
  expect(sent[0]).toContain('first reply');
  await expect(page.locator('#qr [name="t-response"]')).toHaveValue('');
  await solve('second');
  await expect.poll(() => sent.length).toBe(2);
  expect(sent[1]).toContain('second reply');
});
