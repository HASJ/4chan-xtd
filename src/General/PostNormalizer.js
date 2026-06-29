// @ts-nocheck
import ImageHost from "../Images/ImageHost";
import $$ from "../platform/$$";
import $ from "../platform/$";

export default function normalizePost(root) {
  let el, i;
  let node;
  const root2 = root.cloneNode(true);
  for (el of $$('.mobile', root2)) {
    $.rm(el);
  }
  for (el of $$('a[href]', root2)) {
    var {
      href
    } = el;
    href = href.replace(/(^\w+:\/\/boards\.4chan(?:nel)?\.org\/[^\/]+\/thread\/\d+)\/.*/, '$1');
    el.setAttribute('href', href);
  }
  ImageHost.fixLinks($$('.fileText > a, a.fileThumb', root2));
  for (el of $$('img[src]', root2)) {
    el.src = el.src.replace(/(spoiler-\w+)\d(\.png)$/, '$11$2');
  }
  for (el of $$('pre.prettyprinted', root2)) {
    var nodes = $.X('.//br|.//wbr|.//text()', el);
    i = 0;
    nodes = ((() => {
      const result = [];
      while (node = nodes.snapshotItem(i++)) {
        result.push(node);
      }
      return result;
    })());
    $.rmAll(el);
    $.add(el, nodes);
    el.normalize();
    $.rmClass(el, 'prettyprinted');
  }
  for (el of $$('pre[style=""]', root2)) {
    el.removeAttribute('style');
  }
  // XXX https://bugzilla.mozilla.org/show_bug.cgi?id=1021289
  $('.fileInfo[data-md5]', root2)?.removeAttribute('data-md5');
  const textNodes = $.X('.//text()', root2);
  i = 0;
  while (node = textNodes.snapshotItem(i++)) {
    node.data = node.data.replace(/\ +/g, ' ');
    // XXX https://a.4cdn.org/sci/thread/5942502.json, https://a.4cdn.org/news/thread/6.json, https://a.4cdn.org/wsg/thread/957536.json
    if (node.previousSibling?.nodeName === 'BR') { node.data = node.data.replace(/^\n+/g, ''); }
    if (node.nextSibling?.nodeName === 'BR') { node.data = node.data.replace(/\n+$/g, ''); }
    if (node.data === '') { $.rm(node); }
  }
  return root2;
}
