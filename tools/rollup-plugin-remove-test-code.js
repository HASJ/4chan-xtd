import { createFilter } from "@rollup/pluginutils";
import MagicString from 'magic-string';

/**
 * Remove test code comments from the output build.
 *
 * @param {Object} opts
 * @param {import("@rollup/pluginutils").FilterPattern} opts.include
 * @param {import("@rollup/pluginutils").FilterPattern} [opts.exclude]
 * @param {boolean} opts.sourceMap
 * @returns {import("rollup").Plugin}
 */
export default function removeTestCode(opts) {
  if (!opts.include) {
    throw Error("include option should be specified");
  }

  const filter = createFilter(opts.include, opts.exclude);

  return {
    name: "removeTestCode",

    async transform(code, id) {
      if (!filter(id)) return;

      const ms = new MagicString(code);
      for (const match of code.matchAll(/\/\/ #region tests_enabled[\s\S]*?\/\/ #endregion/g)) {
        ms.remove(match.index, match.index + match[0].length);
      }

      return { code: ms.toString(), map: ms.generateMap({ hires: true }) };
    }
  };
};