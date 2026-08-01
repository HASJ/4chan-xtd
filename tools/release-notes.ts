import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractReleaseNotes(changelog: string, version: string): string {
  const cleanVersion = version.replace(/^v/, '');
  if (!cleanVersion) {
    throw new Error(`Version "${version}" not found in changelog`);
  }

  const lines = changelog.split(/\r?\n/);
  const versionPattern = new RegExp('^###\\s+\\[?v?' + escapeRegex(cleanVersion) + '(?:\\s|\\(|$|\\])');

  const targetIdx = lines.findIndex(line => line.startsWith('### ') && versionPattern.test(line));

  if (targetIdx === -1) {
    throw new Error(`Version "${version}" not found in changelog`);
  }

  const bodyLines: string[] = [];
  for (let i = targetIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith('### ')) {
      break;
    }
    bodyLines.push(lines[i]);
  }

  let start = 0;
  while (start < bodyLines.length && bodyLines[start].trim() === '') {
    start++;
  }

  let end = bodyLines.length - 1;
  while (end >= start && bodyLines[end].trim() === '') {
    end--;
  }

  // A heading with nothing under it is as useless as a missing one: it would
  // publish a release with an empty body. Fail the same way.
  if (start > end) {
    throw new Error(`Version "${version}" has an empty section in the changelog`);
  }

  return bodyLines.slice(start, end + 1).join('\n');
}

const isMain = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const versionArg = process.argv[2];
  if (!versionArg) {
    console.error('Error: Version argument is required.');
    process.exit(1);
  }

  try {
    const changelogPath = resolve(process.cwd(), 'CHANGELOG.md');
    const changelog = readFileSync(changelogPath, 'utf8');
    const notes = extractReleaseNotes(changelog, versionArg);
    console.log(notes);
  } catch (err: any) {
    console.error(err?.message || String(err));
    process.exit(1);
  }
}
