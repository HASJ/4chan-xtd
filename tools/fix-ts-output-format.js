import { createFilter } from "@rollup/pluginutils";

/**
 * TypeScript's output has two problems:
 *  1) It doubles the indent from two spaces to four spaces
 *  2) It puts the `else` keyword on a new line
 *
 * This transformer fixes that, and prevents the file size of the output from
 * bloating when files are moved from js to ts.
 *
 * Must be called **after** the TypeScript plugin.
 *
 * Does not generate a source map, so shouldn't be run in the minified build.
 *
 * @param {Object} opts
 * @param {import("@rollup/pluginutils").FilterPattern} opts.include
 * @param {import("@rollup/pluginutils").FilterPattern} [opts.exclude]
 * @returns {import("rollup").Plugin}
 */
export default function fixTsOutputFormat(opts) {
  if (!opts.include) {
    throw Error("include option should be specified");
  }

  const filter = createFilter(opts.include, opts.exclude);

  return {
    name: "fixTsOutputFormat",

    async transform(code, id) {
      if (filter(id)) {
        return {
          code: code
            .replace(/^ {4,}/gm, (match) => match.slice(0, match.length / 2))
            .replace(/\}\r?\n *(else|catch|finally)/g, '} $1'),
          map: { mappings: '' }
        };
      }
    }
  };
};
