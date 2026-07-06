import { createFilter } from "@rollup/pluginutils";

export default function setupFileInliner(packageJson) {
  /** @param {string} string */
  const escape = (string) => string.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\\${');

  /**
   * @param {Object} opts
   * @param {import("@rollup/pluginutils").FilterPattern} opts.include
   * @param {import("@rollup/pluginutils").FilterPattern} [opts.exclude]
   * @param {(input: string) => string} [opts.transformer] Optional function to transform the string.
   * @param {boolean} [opts.wrap] Wether to look for <%= meta.stuff %> and replace it, and wrap in a string,
   *  defaults to true.
   * @returns {import("rollup").Plugin}
   */
  return function inlineFile(opts) {
    if (!opts.include) {
      throw Error("include option should be specified");
    }

    if (opts.transformer && typeof opts.transformer !== 'function') {
      throw new Error('If transformer is given, it must be a function');
    }

    const wrap = 'wrap' in opts ? opts.wrap : true;

    const filter = createFilter(opts.include, opts.exclude);

    return {
      name: "inlineFile",

      async transform(code, id) {
        if (filter(id)) {
          code = code.replace(/\r\n/g, '\n');
          if (opts.transformer) {
            code = opts.transformer(code);
          }
          if (wrap) {
            code = escape(code.trim());
            code = code.replace(/<%= meta\.(\w+) %>/g, (match, $1) => {
              return escape(packageJson.meta[$1]);
            });
            code = `export default \`${code}\`;`;
          }

          return { code, map: { mappings: '' } };
        }
      }
    };
  };
}
