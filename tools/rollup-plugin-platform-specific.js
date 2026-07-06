import { createFilter } from "@rollup/pluginutils";
import MagicString from 'magic-string';

/**
 * Find the closing } of the current block.
 * @param {string} code
 * @param {number} startIndex
 */
const findClosingBracket = (code, startIndex) => {
  let pairsOpen = 1;
  let index = startIndex;
  while (pairsOpen) {
    ++index;
    switch (code[index]) {
      case '{': ++pairsOpen; break;
      case '}': --pairsOpen; break;
    }
  }
  return index;
};

const elseRegex = /\s*else\s*\{/y;

/**
 * There is some platform specific code. By platform we mean users script or extension version.
 * Should be wrapped in a simple if (platform === 'crx') or if (platform === 'userscript'), since this script is not
 * that advanced.
 *
 * @param {Object} opts
 * @param {import("@rollup/pluginutils").FilterPattern} opts.include
 * @param {import("@rollup/pluginutils").FilterPattern} [opts.exclude]
 * @param {'crx'|'userscript'} opts.platform
 * @param {boolean} opts.minify
 * @returns {import("rollup").Plugin}
 */
export default function platformSpecific(opts) {
  if (!opts.include) {
    throw Error("include option should be specified");
  }

  const filter = createFilter(opts.include, opts.exclude);

  return {
    name: "platformSpecific",

    async transform(code, id) {
      if (!filter(id)) return;

      const ms = new MagicString(code);

      for (const match of code.matchAll(/if \(platform === '(crx|userscript)'\) \{/g)) {
        // remove opening if
        const endIfIndex = match.index + match[0].length
        ms.remove(match.index, endIfIndex);

        // remove content of if block if we're targeting the other platform
        const endIfBlockIndex = findClosingBracket(code, endIfIndex);
        if (match[1] !== opts.platform) ms.remove(endIfIndex + 1, endIfBlockIndex - 1);

        // remove closing }
        ms.remove(endIfBlockIndex, endIfBlockIndex + 1);

        elseRegex.lastIndex = endIfBlockIndex + 1;
        const elseMatch = code.match(elseRegex);
        if (elseMatch) {
          const endElseIndex = elseMatch.index + elseMatch[0].length;
          // remove else {
          ms.remove(endIfBlockIndex + 1, endElseIndex);

          // remove else content if applicable
          const endElseBlockIndex = findClosingBracket(code, endElseIndex);
          if (match[1] === opts.platform) ms.remove(endElseIndex, endElseBlockIndex - 1);

          // remove final }
          ms.remove(endElseBlockIndex, endElseBlockIndex + 1);
        }
      }

      return { code: ms.toString(), map: opts.minify ? ms.generateMap() : { mappings: '' } };
    }
  };
};