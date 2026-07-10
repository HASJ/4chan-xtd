import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  assetsInclude: ['**/*.html'],
  resolve: {
    alias: {
      '@fa': fileURLToPath(new URL('./node_modules/@fortawesome/free-regular-svg-icons/', import.meta.url)),
      '@fas': fileURLToPath(new URL('./node_modules/@fortawesome/free-solid-svg-icons/', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    exclude: ['builds/**', 'tests/browser/**'],
    environmentOptions: {
      jsdom: { url: 'https://boards.4chan.org/g/thread/1' },
    },
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.test.ts', 'src/test/**', 'tests/browser/**', 'builds/**', 'tools/**'],
    },
  },
});
