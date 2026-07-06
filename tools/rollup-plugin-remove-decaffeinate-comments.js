import { createFilter } from "@rollup/pluginutils";
import MagicString from 'magic-string';

/**
 * Remove decaffeinate comments from the output build.
 *
 * @param {Object} opts
 * @param {import("@rollup/pluginutils").FilterPattern} opts.include
 * @param {import("@rollup/pluginutils").FilterPattern} [opts.exclude]
 * @returns {import("rollup").Plugin}
 */
export default function removeDecaffeinateComments(opts) {
  if (!opts.include) {
    throw Error("include option should be specified");
  }

  const filter = createFilter(opts.include, opts.exclude);

  return {
    name: "removeDecaffeinateComments",

    async transform(code, id) {
      if (!filter(id)) return;

      const match = code.match(/\/\*\r?\n +\* decaffeinate suggestions:/);
      if (!match) return;

      const ms = new MagicString(code);

      ms.remove(match.index, code.indexOf('*/', match.index) + 3);

      // no mappings, the minified build should not run this,
      // because those decaffeinate comments are minified away anyway.
      return { code: ms.toString(), map: { mappings: '' } };
    }
  };
};