import type { FullConfig } from '@playwright/test';
import { startFixtureServer } from './server.mjs';

export default async function globalSetup(_config: FullConfig) {
  const server = await startFixtureServer();
  return async () => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
}
