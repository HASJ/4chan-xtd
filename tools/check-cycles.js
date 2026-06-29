import { readdirSync, readFileSync } from 'fs';
import { dirname, extname, join, normalize, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, '../src');
const extensions = ['.ts', '.tsx', '.js', '.jsx'];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(file, files);
    } else if (extensions.includes(extname(entry.name))) {
      files.push(file);
    }
  }
  return files;
}

const files = walk(srcDir).map(file => normalize(file));
const fileSet = new Set(files);

function resolveImport(from, specifier) {
  if (!specifier.startsWith('.')) return null;

  const base = resolve(dirname(from), specifier);
  const candidates = [
    base,
    ...extensions.map(extension => base + extension),
    ...extensions.map(extension => join(base, 'index' + extension)),
  ];

  return candidates.map(normalize).find(candidate => fileSet.has(candidate)) || null;
}

const graph = new Map(files.map(file => [file, []]));

// Matches `import ... from "path"`, `export ... from "path"`, and `import "path"`.
// Captures whether `type ` was used so we can ignore type-only imports.
// Note: This relies on a simple regex and does not parse dynamic `import()` or multiline syntax perfectly.
const importPattern = /\b(import|export)\s+(type\s+)?(?:[^'\"]*?\s+from\s*)?['\"]([^'\"]+)['\"]/g;

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  let match;
  while ((match = importPattern.exec(text))) {
    if (match[2]) continue;
    const target = resolveImport(file, match[3]);
    if (target) graph.get(file).push(target);
  }
}

let index = 0;
const indexes = new Map();
const lowlinks = new Map();
const stack = [];
const onStack = new Set();
const components = [];

function strongConnect(file) {
  indexes.set(file, index);
  lowlinks.set(file, index);
  index++;
  stack.push(file);
  onStack.add(file);

  for (const target of graph.get(file)) {
    if (!indexes.has(target)) {
      strongConnect(target);
      lowlinks.set(file, Math.min(lowlinks.get(file), lowlinks.get(target)));
    } else if (onStack.has(target)) {
      lowlinks.set(file, Math.min(lowlinks.get(file), indexes.get(target)));
    }
  }

  if (lowlinks.get(file) !== indexes.get(file)) return;

  const component = [];
  let current;
  do {
    current = stack.pop();
    onStack.delete(current);
    component.push(current);
  } while (current !== file);

  if (component.length > 1) components.push(component);
}

for (const file of files) {
  if (!indexes.has(file)) strongConnect(file);
}

const rel = file => relative(srcDir, file).replace(/\\/g, '/');

if (!components.length) {
  console.log('No circular source dependencies found.');
  process.exit(0);
}

components.sort((a, b) => b.length - a.length);
console.error('Found ' + components.length + ' circular dependency component(s).');

for (const component of components) {
  const componentSet = new Set(component);
  console.error('\nComponent (' + component.length + ' files):');
  for (const file of component.map(rel).sort()) {
    console.error('  ' + file);
  }
  console.error('  Internal edges:');
  for (const file of component.sort((a, b) => rel(a).localeCompare(rel(b)))) {
    for (const target of graph.get(file).filter(candidate => componentSet.has(candidate))) {
      console.error('    ' + rel(file) + ' -> ' + rel(target));
    }
  }
}

process.exit(1);
