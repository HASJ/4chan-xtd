import { afterEach, vi } from 'vitest';

const storage = new Map<string, string>();
const testStorage: Storage = {
  get length() { return storage.size; },
  clear: () => storage.clear(),
  getItem: key => storage.get(key) ?? null,
  key: index => [...storage.keys()][index] ?? null,
  removeItem: key => storage.delete(key),
  setItem: (key, value) => storage.set(key, String(value)),
};

Object.defineProperty(globalThis, 'GM', { value: undefined, configurable: true });
Object.defineProperty(globalThis, 'GM_xmlhttpRequest', { value: () => undefined, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: testStorage, configurable: true });

afterEach(() => {
  document.body.replaceChildren();
  testStorage.clear();
  vi.restoreAllMocks();
});
