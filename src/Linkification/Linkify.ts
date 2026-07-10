import Callbacks from "../classes/Callbacks";
// #region tests_enabled
import Test from "../General/Test";
// #endregion
import { g, Conf } from "../globals/globals";
import ImageHost from "../Images/ImageHost";
import ExpandComment from "../Miscellaneous/ExpandComment";
import $ from "../platform/$";
import $$ from "../platform/$$";
import Embedding from "./Embedding";
import { registerLinkifyProcessor } from "./LinkifyActions";

// Linear-time equivalent of `(https?:\/\/)?([a-z\d-]+\.)*[a-z\d-]+$` (case-insensitive,
// same match semantics as RegExp#exec): scans backwards from the end instead of
// retrying the label/dot repetition at every start position (avoids O(n^2)
// backtracking). Returns the matched substring (mirrors `part1[0]`), or null when
// `s` doesn't end in at least one [a-z\d-] character.
function trailingUrlTail(s: string): string | null {
  const isLabelChar = (c: number) =>
    (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 45 /* '-' */;
  const isSuffix = (i: number, needle: string) => {
    if (i < needle.length) { return false; }
    for (let k = 0; k < needle.length; k++) {
      const c = s.charCodeAt(i - needle.length + k);
      if ((c >= 65 && c <= 90 ? c + 32 : c) !== needle.charCodeAt(k)) { return false; }
    }
    return true;
  };

  let i = s.length;
  const end = i;
  while (i > 0 && isLabelChar(s.charCodeAt(i - 1))) { i--; }
  if (i === end) { return null; } // no trailing [a-z\d-]+ at all

  // Consume any further (label.) groups walking backwards.
  while (i > 0 && s.charCodeAt(i - 1) === 46 /* '.' */) {
    let j = i - 1;
    while (j > 0 && isLabelChar(s.charCodeAt(j - 1))) { j--; }
    if (j === i - 1) { break; } // dot not preceded by a label, stop here
    i = j;
  }

  // Optionally swallow a leading "http://"/"https://" immediately before the labels.
  if (isSuffix(i, 'https://')) { i -= 8; }
  else if (isSuffix(i, 'http://')) { i -= 7; }

  return s.slice(i);
}

const Linkify: any = {
  init() {
    if (!(g.VIEW && ['index', 'thread', 'archive'].includes(g.VIEW)) || !Conf['Linkify']) { return; }

    if (Conf['Comment Expansion']) {
      ExpandComment.callbacks.push(this.node);
    }

    Callbacks.Post.push({
      name: 'Linkify',
      cb:   this.node
    });

    return Embedding.init();
  },

  node() {
    let link;
    if (this.isClone) { return Embedding.events(this); }
    if (!Linkify.regString.test(this.info.comment)) { return; }
    for (link of $$('a', this.nodes.comment)) {
      if (g.SITE.isLinkified?.(link)) {
        $.addClass(link, 'linkify');
        if (ImageHost.useFaster) { ImageHost.fixLinks([link]); }
        Embedding.process(link, this);
      }
    }
    const links = Linkify.process(this.nodes.comment);
    if (ImageHost.useFaster) { ImageHost.fixLinks(links); }
    for (link of links) { Embedding.process(link, this); }
  },

  process(node) {
    const test     = /[^\s"]+/g;
    const snapshot = $.X('.//br|.//text()', node);
    let i = 0;
    const links: Range[] = [];
    while ((node = snapshot.snapshotItem(i++))) {
      const {data} = node;
      if (!data || (node.parentElement.nodeName === "A")) { continue; }
      i = Linkify.scanTextNode(node, data, snapshot, i, test, links);
    }

    i = links.length;
    while (i--) {
      links[i] = Linkify.makeLink(links[i]);
    }
    return links;
  },

  // Walk the whitespace-delimited words of a single text node, recording any
  // that match a link. Returns the (possibly advanced) snapshot index.
  scanTextNode(node, data, snapshot, i, test, links) {
    let result: RegExpExecArray | null;
    while ((result = test.exec(data))) {
      const {index} = result;
      let endNode = node;
      let word    = result[0];
      let length  = index + word.length;

      // End of node, not necessarily end of space-delimited string
      if (length === data.length) {
        ({i, endNode, word, length} = Linkify.extendAcrossNodes(snapshot, i, node, word, test));
      }

      if (Linkify.regString.test(word)) {
        links.push(Linkify.makeRange(node, endNode, index, length));

        // #region tests_enabled
        Test.assert(() => word === links[links.length - 1]?.toString());
        // #endregion
      }

      if (!test.lastIndex || (node !== endNode)) { break; }
    }
    return i;
  },

  // Continue a word past the end of its text node, across <br> tags and
  // adjacent text nodes, until whitespace or an incompatible node is found.
  extendAcrossNodes(snapshot, i, node, word, test) {
    const space = /[\s"]/;
    let endNode = node;
    let length;
    let saved;
    test.lastIndex = 0;

    while (saved = snapshot.snapshotItem(i++)) {
      if ((saved.nodeName === 'BR') || ((saved.parentElement.nodeName === 'P') && !saved.previousSibling)) {
        if (Linkify.canBridgeLineBreak(word, snapshot, i)) { continue; } else { break; }
      }

      if ((saved.parentElement.nodeName === "A") && !Linkify.regString.test(word)) {
        break;
      }

      endNode = saved;
      const {data} = saved;

      const end = space.exec(data);
      if (end) {
        // Set our snapshot and regex to start on this node at this position when the loop resumes
        word += data.slice(0, end.index);
        test.lastIndex = (length = end.index);
        i--;
        break;
      } else {
        ({length} = data);
        word += data;
      }
    }

    return {i, endNode, word, length};
  },

  // Whether a link may legitimately span a line break (e.g. wrapped domain/path).
  canBridgeLineBreak(word, snapshot, i) {
    const part1 = trailingUrlTail(word);
    const part2 = snapshot.snapshotItem(i)?.data?.match(/^(\.[a-z\d-]+)*\//i);
    return !!(part1 !== null && part2 && ((part1 + part2[0]).search(Linkify.regString) === 0));
  },

  regString:
    /((https?|mailto|git|magnet|ftp|irc):([a-z\d%/?])|([-a-z\d]+\.)+(aero|asia|biz|cat|com|coop|dance|info|int|jobs|mobi|moe|museum|name|net|org|post|pro|tel|travel|xxx|xyz|edu|gov|mil|[a-z]{2})([:/]|(?![^\s"]))|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[-\w.@]+@[a-z\d.-]+\.[a-z\d])/i, // NOSONAR complex intentionally, matches URL/bare-domain/IPv4/email in one pass

  makeRange(startNode, endNode, startOffset, endOffset) {
    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode,   endOffset);
    return range;
  },

  // Number of trailing chars (closing brackets/punctuation) to trim off a matched link.
  countTrailingPunctuation(text) {
    let i = 0;
    let t = text.charAt(text.length - (1 + i));
    while (/[)\]}>.,]/.test(t)) {
      if (!/[.,]/.test(t) && !((text.match(/[()[\]{}<>]/g)).length % 2)) { break; }
      i++;
      t = text.charAt(text.length - (1 + i));
    }
    return i;
  },

  makeLink(range) {
    let encodedDomain;
    let text = range.toString();

    // Clean start of range
    let i = text.search(Linkify.regString);

    if (i > 0) {
      text = text.slice(i);
      while ((range.startOffset + i) >= range.startContainer.data.length) { i--; }

      if (i) { range.setStart(range.startContainer, range.startOffset + i); }
    }

    // Clean end of range
    i = Linkify.countTrailingPunctuation(text);

    if (i) {
      text = text.slice(0, -i);
      while ((range.endOffset - i) < 0) { i--; }

      if (i) {
        range.setEnd(range.endContainer, range.endOffset - i);
      }
    }

    // Make our link 'valid' if it is formatted incorrectly.
    if (!/((mailto|magnet):|.:\/\/)/.test(text)) {
      text = (
        /@/.test(text) ?
          'mailto:'
        :
          'http://'
      ) + text;
    }

    // Decode percent-encoded characters in domain so that they behave consistently across browsers.
    encodedDomain = text.match(/^(https?:\/\/[^/]*%[0-9a-f]{2})(.*)$/i);
    if (encodedDomain) {
      text = encodedDomain[1].replace(/%([0-9a-f]{2})/ig, function(x, y) {
        if (y === '25') { return x; } else { return String.fromCodePoint(Number.parseInt(y, 16)); }
      }) + encodedDomain[2];
    }

    const a = $.el('a', {
      className: 'linkify',
      rel:       'noreferrer noopener',
      target:    '_blank',
      href:      text
    }
    );

    // Insert the range into the anchor, the anchor into the range's DOM location, and destroy the range.
    $.add(a, range.extractContents());
    range.insertNode(a);

    return a;
  }
};
registerLinkifyProcessor(Linkify.process);

export default Linkify;
