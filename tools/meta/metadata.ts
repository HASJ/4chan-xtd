// Used by the compiled build script.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export default async function generateMetadata(packageJson: any, fileName: any) {
  const meta = packageJson.meta;

  const versionFile = await readFile(resolve(process.cwd(), 'version.json'));
  const version = JSON.parse(versionFile.toString());

  const icon = await readFile(resolve(process.cwd(), 'src/meta/icon48.png'));

  const archives = JSON.parse(await readFile(resolve(process.cwd(), 'src/Archive/archives.json'), { encoding: 'utf-8' }));

  let output = `// ==UserScript==
// @name         ${meta.name}
// @version      ${version.version}
// @minGMVer     ${meta.min.greasemonkey}
// @minFFVer     ${meta.min.firefox}
// @namespace    ${packageJson.name}
// @description  ${packageJson.description}
// @license      MIT; ${meta.license}
//
`;

  output += (function () {
    return ([] as any[]).concat(
      meta.includes_only.concat(meta.matches, meta.matches_extra).map(function (match: any) {
        return '// @include      ' + match;
      }),
      meta.exclude_matches.map(function (match: any) {
        return '// @exclude      ' + match;
      })
    ).join('\n');
  })();

  output += `
// @connect      4chan.org
// @connect      4channel.org
// @connect      4cdn.org
// @connect      4chenz.github.io
//
`;
  output += archives.map(function (archive: any) {
    return '// @connect      ' + archive.domain;
  }).join('\n');

  output += `
// @connect      api.clyp.it
// @connect      api.dailymotion.com
// @connect      api.github.com
// @connect      soundcloud.com
// @connect      api.streamable.com
// @connect      vimeo.com
// @connect      www.youtube.com
// @connect      *
//
`;
  output += meta.grants.map(function (grant: any) {
    return '// @grant        ' + grant;
  }).join('\n');

  output += `
// @run-at       document-start
// @updateURL    none
// @downloadURL  ${meta.downloads}/latest/download/${fileName}
// @icon         data:image/png;base64,${icon.toString('base64')}
// @license      MIT
// ==/UserScript==
`;

  return output;
}
