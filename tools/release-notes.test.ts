import { describe, expect, it } from 'vitest';
import { extractReleaseNotes } from './release-notes.js';

const sampleChangelog = `## 4chan XTd changelog

Introductory preamble text.

### 2.31.1 (2026-08-01)

- Other
  - Dropped minified build.
  - Stopped emitting standalone meta.

The installed userscript is byte-for-byte identical to 2.31.0.

### 2.31.10 (2026-08-01)

- Feature from 2.31.10.

### 12.31.1 (2026-08-01)

- Feature from 12.31.1.

### [2.30.0](https://github.com/HASJ/4chan-xtd/compare/v2.26.20...v2.30.0) (2026-07-07)

- Architecture
  - Completed codebase-wide migration.

### 2.26.20 (2026-07-05)

- Maintenance
  - Removed vendored upstream changelog history.`;

describe('extractReleaseNotes', () => {
  it('returns the section body excluding the heading line and next section heading', () => {
    const notes = extractReleaseNotes(sampleChangelog, '2.31.1');
    expect(notes).not.toContain('### 2.31.1');
    expect(notes).not.toContain('### 2.31.10');
    expect(notes).toContain('- Other');
    expect(notes).toContain('The installed userscript is byte-for-byte identical to 2.31.0.');
  });

  it('trims leading and trailing blank lines while preserving interior blank lines and indentation', () => {
    const notes = extractReleaseNotes(sampleChangelog, '2.31.1');
    const lines = notes.split('\n');
    expect(lines[0]).toBe('- Other');
    expect(lines[1]).toBe('  - Dropped minified build.');
    expect(notes).toContain('\n\nThe installed userscript');
    expect(lines[lines.length - 1]).toBe('The installed userscript is byte-for-byte identical to 2.31.0.');
  });

  it('accepts and ignores a leading v on the version parameter', () => {
    const withV = extractReleaseNotes(sampleChangelog, 'v2.31.1');
    const withoutV = extractReleaseNotes(sampleChangelog, '2.31.1');
    expect(withV).toBe(withoutV);
  });

  it('performs exact matching on version numbers and avoids partial prefix/suffix matches', () => {
    const notes2311 = extractReleaseNotes(sampleChangelog, '2.31.1');
    expect(notes2311).toContain('- Other');
    expect(notes2311).not.toContain('Feature from 2.31.10');
    expect(notes2311).not.toContain('Feature from 12.31.1');

    const notes23110 = extractReleaseNotes(sampleChangelog, '2.31.10');
    expect(notes23110).toBe('- Feature from 2.31.10.');

    const notes12311 = extractReleaseNotes(sampleChangelog, '12.31.1');
    expect(notes12311).toBe('- Feature from 12.31.1.');
  });

  it('handles headers formatted with markdown links', () => {
    const notes = extractReleaseNotes(sampleChangelog, '2.30.0');
    expect(notes).toContain('- Architecture');
    expect(notes).toContain('  - Completed codebase-wide migration.');
  });

  it('returns the last section in the file in full', () => {
    const notes = extractReleaseNotes(sampleChangelog, '2.26.20');
    expect(notes).toBe('- Maintenance\n  - Removed vendored upstream changelog history.');
  });

  it('throws an error containing the version string when the version is not found', () => {
    expect(() => extractReleaseNotes(sampleChangelog, '9.9.9')).toThrow('9.9.9');
    expect(() => extractReleaseNotes(sampleChangelog, 'v9.9.9')).toThrow('v9.9.9');
  });

  // An empty body would publish a release with no notes at all, which is the
  // outcome this whole tool exists to prevent.
  it('throws when the section exists but has no content', () => {
    const changelog = '### 2.0.0 (2026-01-01)\n\n\n### 1.0.0 (2025-01-01)\n\n- Something.';

    expect(() => extractReleaseNotes(changelog, '2.0.0')).toThrow('2.0.0');
  });
});
