import { describe, expect, it } from 'vitest';
import removeTestCode from './rollup-plugin-remove-test-code.js';

describe('removeTestCode', () => {
  it('removes test-only regions while preserving production code', async () => {
    const plugin = removeTestCode({ include: '**/*.ts', sourceMap: true });
    const result = await (plugin.transform as any)([
      'const production = true;',
      '// Keep this production comment.',
      '// #region tests_enabled',
      'const testOnly = true;',
      '// #endregion',
      'export default production;',
    ].join('\n'), 'src/fixture.ts');

    expect(result.code).toContain('const production = true;');
    expect(result.code).toContain('// Keep this production comment.');
    expect(result.code).toContain('export default production;');
    expect(result.code).not.toContain('testOnly');
  });
});
