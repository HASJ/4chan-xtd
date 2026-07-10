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

const findClosingParen = (code, startIndex) => {
  let pairsOpen = 1;
  let index = startIndex;
  while (pairsOpen) {
    ++index;
    switch (code[index]) {
      case '(': ++pairsOpen; break;
      case ')': --pairsOpen; break;
    }
  }
  return index;
};

const skipWs = (code, index) => {
  while (/\s/.test(code[index])) { ++index; }
  return index;
};

/**
 * Given the index right after an "else" keyword, returns the index right after
 * the end of what follows it: either a `{ ... }` block, or a chained
 * `if (...) { ... } [else ...]` statement.
 */
const skipElseBody = (code, index) => {
  index = skipWs(code, index);
  if (code[index] === '{') {
    return findClosingBracket(code, index) + 1;
  }
  // else if (...) { ... } [else ...]
  index = skipWs(code, index + 'if'.length);
  const closeParen = findClosingParen(code, index); // index is at the opening '('
  index = skipWs(code, closeParen + 1);
  index = findClosingBracket(code, index) + 1; // index was at the block's opening '{'
  const afterBlock = skipWs(code, index);
  if (code.startsWith('else', afterBlock)) {
    return skipElseBody(code, afterBlock + 'else'.length);
  }
  return index;
};

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
    throw new Error("include option should be specified");
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
        const keepIf = match[1] === opts.platform;
        if (!keepIf) ms.remove(endIfIndex + 1, endIfBlockIndex - 1);

        // What follows the if block may be nothing, a plain `else { ... }`,
        // or a chained `else if (...) { ... } [else ...]`.
        const afterIfBlock = skipWs(code, endIfBlockIndex + 1);
        const hasElse = code.startsWith('else', afterIfBlock);

        if (hasElse && keepIf) {
          // We only want the if branch: drop its closing } along with the entire else chain.
          ms.remove(endIfBlockIndex, skipElseBody(code, afterIfBlock + 'else'.length));
        } else if (hasElse) {
          // We want the else chain: drop the if block's closing } and just the "else" keyword,
          // leaving the chain's own if/else structure intact as top-level code.
          ms.remove(endIfBlockIndex, afterIfBlock + 'else'.length);
        } else {
          // No else clause: just drop the if block's closing }.
          ms.remove(endIfBlockIndex, endIfBlockIndex + 1);
        }
      }

      return { code: ms.toString(), map: opts.minify ? ms.generateMap() : { mappings: '' } };
    }
  };
};
