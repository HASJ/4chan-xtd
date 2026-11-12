import { expect, type Frame, type Page, test } from '@playwright/test';
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

test('submits a text-only reply after the final native captcha answer', async ({ page }) => {
  await installHarness(page, {
    [storageKey('previousversion')]: '2.31.9',
    [storageKey('Thread Watcher')]: false,
    [storageKey('Post on Captcha Completion')]: true,
    [storageKey('Next challenge on captcha selection')]: false,
    [storageKey('Auto-load captcha')]: false,
    [storageKey('Auto-load captcha after cooldown')]: false,
    [storageKey('Auto-post typing delay')]: 0,
  });
  const sent: string[] = [];
  await page.route('https://sys.4chan.org/**', async route => {
    if (route.request().method() === 'POST') sent.push(route.request().postData() || '');
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>Intercepted test request</body></html>' });
  });
  await page.goto('/g/thread/100', { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ path: resolve('tests/browser/fixtures/tcaptcha-native.js') });
  await page.addScriptTag({ path: bundle });
  await page.locator('.qr-link').first().click();
  await page.locator('#qr textarea[data-name="com"]').fill('Local test reply');
  await expect(page.locator('#qr #t-slider')).toHaveCount(1);
  await page.evaluate(() => {
    const image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/ZfoAAAAASUVORK5CYII=';
    (window as any).TCaptcha.setChallenge({ challenge: 'test-challenge', tasks: Array.from({ length: 3 }, () => ({ str: 'Choose an answer', items: [image, image, image] })) });
  });
  for (let step = 1; step <= 3; step++) {
    await expect(page.locator('#qr .captcha-strips')).toHaveAttribute('data-step', `Next (${step}/3)`);
    await page.waitForTimeout(600); // Native image capture samples each slider value before accepting clicks.
    await page.locator('#qr .captcha-strip').nth(1).click();
    if (step < 3) await page.locator('#qr #t-next').click();
  }
  await expect.poll(() => sent.length).toBe(1);
  expect(sent[0]).toContain('Local test reply');
  expect(sent[0]).toContain('test-challenge');
});

test('cancels cooldown auto-post on edit within the protection window without a second countdown', async ({ page }) => {
  await installHarness(page, {
    [storageKey('previousversion')]: '2.31.9',
    [storageKey('Thread Watcher')]: false,
    [storageKey('Post on Captcha Completion')]: true,
    [storageKey('Auto-load captcha')]: false,
    [storageKey('Auto-load captcha after cooldown')]: false,
    [storageKey('Auto-post typing delay')]: 30,
    [storageKey('cooldowns')]: { g: { [Date.now()]: { type: 'reply', threadID: 100, delay: 20 } } },
  });
  await page.route('https://sys.4chan.org/**', route => route.fulfill({ status: 200, body: '' }));
  await page.goto('/g/thread/100', { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ path: resolve('tests/browser/fixtures/tcaptcha-native.js') });
  await page.addScriptTag({ path: bundle });
  await page.locator('.qr-link').first().click();
  await expect(page.locator('#qr .captcha-typing-countdown')).toHaveCount(0);
  const submit = page.locator('#qr-submit');
  await expect(submit).toHaveValue(/^\d+$/);
  await submit.click();
  await expect(submit).toHaveValue(/^Auto \d+$/);
  await page.locator('#qr textarea[data-name="com"]').fill('Edited near submit');
  await expect(submit).toHaveValue(/^\d+$/);
});

for (const iframe of [false, true]) {
  test(`corrects earlier captcha answers with Prev and arrow keys (iframe=${iframe})`, async ({ page }) => {
    await installHarness(page, {
      [storageKey('previousversion')]: '2.31.10',
      [storageKey('Thread Watcher')]: false,
      [storageKey('Post on Captcha Completion')]: false,
      [storageKey('Auto-post typing delay')]: 30,
      [storageKey('Next challenge on captcha selection')]: false,
      [storageKey('Auto-load captcha')]: false,
      [storageKey('Auto-load captcha after cooldown')]: false,
    });
    await page.route('https://sys.4chan.org/**', route => route.fulfill({
      status: 200, contentType: 'text/html', body: '<html><body><div id="t-root"></div></body></html>',
    }));
    await page.goto('https://boards.4chan.org/g/thread/100', { waitUntil: 'domcontentloaded' });
    const native = resolve('tests/browser/fixtures/tcaptcha-native.js');
    await page.addScriptTag({ path: native });
    await page.addScriptTag({ path: bundle });
    await page.locator('.qr-link').first().click();
    let captcha: Page | Frame = page;
    if (iframe) {
      await page.evaluate(() => {
        const frame = document.createElement('iframe');
        frame.id = 't-frame';
        frame.src = 'https://sys.4chan.org/captcha';
        frame.style.cssText = 'width: 100%; height: 350px; border: 0';
        document.querySelector('#qr #t-slider')!.parentNode!.appendChild(frame);
      });
      await expect.poll(() => !!page.frame({ url: 'https://sys.4chan.org/captcha' })).toBe(true);
      captcha = page.frame({ url: 'https://sys.4chan.org/captcha' })!;
      await captcha.waitForLoadState('domcontentloaded');
      await captcha.addScriptTag({ path: native });
      await captcha.evaluate(() => (window as any).TCaptcha.init(document.querySelector('#t-root'), 'g', 100));
      await captcha.addScriptTag({ path: bundle });
      await expect(captcha.locator('html')).toHaveClass(/captcha-iframe/);
    }
    await captcha.evaluate(iframe => {
      const image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/ZfoAAAAASUVORK5CYII=';
      (window as any).TCaptcha.setChallenge({ challenge: 'navigation-test', tasks: Array.from({ length: 3 }, () => ({ ...(iframe ? { img: image } : { str: 'Choose an answer' }), items: [image, image, image] })) });
    }, iframe);
    const next = captcha.locator('#t-next');
    const prev = captcha.locator('#t-prev');
    const strips = captcha.locator('.captcha-strip');
    const ready = async (step: number) => {
      await expect(next).toHaveText(`Next (${step}/3)`);
      await expect(strips.last()).toHaveCSS('background-image', /url\(/);
    };
    await ready(1);
    await expect(prev).toBeDisabled();
    await strips.first().click();
    await strips.first().press('ArrowRight');
    await ready(2);
    await expect(prev).toBeEnabled();
    await strips.first().click();
    await strips.first().press('ArrowRight');
    await ready(3);
    await strips.first().press('ArrowLeft');
    await ready(2);
    await expect(captcha.locator('[name="t-response"]')).toHaveValue('0');
    await strips.last().click();
    await strips.last().press('ArrowRight');
    await ready(3);
    await strips.nth(1).click();
    await strips.nth(1).press('ArrowRight');
    await expect(captcha.locator('[name="t-response"]')).toHaveValue('021');
    await expect(page.locator('#qr [name="t-response"]')).toHaveValue('021');
    await expect(prev).toBeEnabled();
    await prev.click();
    await ready(3);
    await expect(captcha.locator('[name="t-response"]')).toHaveValue('02');
    if (iframe) await expect(page.locator('#qr [name="t-response"]')).toHaveValue('');
    await strips.last().click();
    await next.click();
    await expect(page.locator('#qr [name="t-response"]')).toHaveValue('022');
    await prev.click();
    await ready(3);
    await strips.first().click();
    await next.click();
    await expect(page.locator('#qr [name="t-response"]')).toHaveValue('020');
  });
}

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
