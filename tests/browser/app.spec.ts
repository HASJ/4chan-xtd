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
    window.GM_xmlhttpRequest = ({ url, onload, onloadend }: any) => {
      fetch(url).then(async response => {
        const body = await response.text();
        const result = { status: response.status, response: body, responseText: body };
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

async function openFixture(page: Page, path: string, values: Record<string, unknown> = {}) {
  await installHarness(page, {
    [storageKey('previousversion')]: '2.30.5',
    [storageKey('Thread Watcher')]: false,
    ...values,
  });
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ path: bundle });
  await expect(page.locator('html')).toHaveClass(/fourchan-xtd/);
}

test('displays a thread and opens Quick Reply', async ({ page }) => {
  await openFixture(page, '/g/thread/100');

  await expect(page.locator('.thread .postContainer')).toHaveCount(2);
  await expect(page.locator('.qr-link').first()).toBeVisible();
  await page.locator('.qr-link').first().click();
  await expect(page.locator('#qr.dialog')).toBeVisible();
  await expect(page.locator('#qr.dialog textarea[data-name="com"]')).toBeVisible();
});

test('keeps the captcha verification frame visible while loading', async ({ page }) => {
  await openFixture(page, '/g/thread/100');
  await page.locator('.qr-link').first().click();

  await page.evaluate(() => {
    document.querySelector('#qr #t-frame')?.remove();
    const root = document.createElement('div');
    root.className = 'captcha-root captcha-idle';
    const frame = document.createElement('iframe');
    frame.id = 't-frame';
    frame.style.display = 'block';
    root.append(frame);
    document.querySelector('#qr')!.append(root);
  });

  await expect(page.locator('#qr .captcha-root.captcha-idle #t-frame')).toHaveCSS('display', 'block');
});
test('renders the catalog and applies a deterministic filter', async ({ page }) => {
  await openFixture(page, '/g/catalog', { [storageKey('name')]: '/Filtered/' });

  await expect(page.locator('html')).toHaveClass(/catalog/);
  await expect(page.locator('#threads .thread')).toHaveCount(1);
  await expect(page.locator('#threads .thread')).toBeHidden();
});

test('inlines a quote target in the thread', async ({ page }) => {
  await openFixture(page, '/g/thread/100');

  await page.locator('#p101 .quotelink').click();
  await expect(page.locator('#p101 .inline')).toHaveAttribute('data-full-i-d', 'g.100');
});
