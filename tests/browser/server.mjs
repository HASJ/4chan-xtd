import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const fixtureDir = new URL('./fixtures/', import.meta.url);
const pages = {
  '/g/': 'posting.html',
  '/g/thread/100': 'thread.html',
  '/g/catalog': 'catalog.html',
};

const json = {
  '/boards.json': {
    boards: [{
      board: 'g',
      title: 'Technology',
      ws_board: false,
      is_archived: false,
      max_filesize: 4194304,
      max_comment_chars: 2000,
    }],
  },
  '/g/catalog.json': [{
    page: 1,
    threads: [{
      no: 100,
      resto: 0,
      sub: 'Fixture catalog thread',
      name: 'Filtered',
      id: 'CATALOG01',
      com: 'catalog fixture',
      time: 1700000000,
      replies: 1,
      images: 1,
      ext: '.jpg',
      filename: 'fixture-image',
      tim: 1700000000001,
      h: 600,
      w: 800,
      tn_h: 75,
      tn_w: 100,
      md5: 'fixture-md5',
      fsize: 1024,
    }],
  }],
  '/g/thread/100.json': { posts: [] },
};

const createFixtureServer = () => createServer(async (request, response) => {
  const { pathname } = new URL(request.url, 'http://fixture.test');

  if (pathname === '/health') {
    response.writeHead(200, { 'content-type': 'text/plain' });
    response.end('ok');
    return;
  }

  if (pathname in json) {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(json[pathname]));
    return;
  }

  const fixture = pages[pathname];
  if (fixture) {
    const body = await readFile(fileURLToPath(new URL(fixture, fixtureDir)));
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(body);
    return;
  }

  response.writeHead(404, { 'content-type': 'text/plain' });
  response.end('fixture not found');
});

export function startFixtureServer(port = 4173) {
  return new Promise((resolve, reject) => {
    const server = createFixtureServer();
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}
