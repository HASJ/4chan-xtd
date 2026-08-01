import { rollup } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import setupFileInliner from './rollup-plugin-inline-file.js';
import faFix from './rollup-plugin-fa.js';
import { resolve } from 'node:path';
import generateMetadata from './meta/metadata.js';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import importBase64 from './rollup-plugin-base64.js';
import generateManifestJson from './meta/manifestJson.js';
import fixTsOutputFormat from './fix-ts-output-format.js';
import cleanup from 'rollup-plugin-cleanup';
import alias from '@rollup/plugin-alias';
import platformSpecific from './rollup-plugin-platform-specific.js';
import removeTestCode from './rollup-plugin-remove-test-code.js';

const repoRoot = process.cwd();

const buildDir = resolve(repoRoot, 'builds');

const noFormat = process.argv.includes('-no-format'); // -no-format: Skips post-processing formatting steps (faster builds, larger output).
const platform = /** @type {'crx'|'userscript'} */ (process.argv.find(arg => arg.startsWith('-platform='))?.slice(10)); // -platform=[userscript|crx]: Targets a specific build output. If omitted, builds both.
if (platform !== undefined && platform !== 'crx' && platform !== 'userscript') {
  throw new Error('incorrect value for the platform argument');
}
const buildForTest = process.argv.includes('-test'); // -test: Includes test-only code regions (`// #region tests_enabled`).

// https://github.com/rollup/plugins/discussions/1777
const tsPlugin = (typescript as any)({
  compilerOptions: {
    outDir: buildDir,
    noEmit: false,
    sourceMap: false,
  },
});
const eventPageTsPlugin = (typescript as any)({
  tsconfig: resolve(repoRoot, 'src/extension/tsconfig.json'),
  compilerOptions: {
    noEmit: false,
    sourceMap: false,
  },
});

(async () => {
  const packageJson = JSON.parse(await readFile(resolve(repoRoot, 'package.json'), 'utf-8'));

  const fileName = `${packageJson.meta.path}.user.js`;

  const metadata = await generateMetadata(packageJson, fileName);
  const metaNoDownload = metadata.replace(/downloadURL( +)(\S[^\n]*)\n/, 'downloadURL$1none\n');

  const license = await readFile(resolve(repoRoot, 'LICENSE'), 'utf8');

  const version = JSON.parse(await readFile(resolve(repoRoot, 'version.json'), 'utf-8'));

  const inlineFile = setupFileInliner(packageJson);

  const cleanupPlugin = noFormat ? undefined : cleanup({
    extensions: ['js', 'ts', 'tsx', 'json', 'html', 'css'],
    comments: 'all',
    lineEndings: 'unix',
    maxEmptyLines: 1,
    sourcemap: false,
  });

  const bundle = await rollup({
    input: resolve(repoRoot, 'src/main/Main.ts'),
    treeshake: false,
    plugins: [
      platform ? platformSpecific({
        platform,
        include: [
          // Only files that actually have platform specific code.
          "**/src/main/Main.ts",
          "**/src/platform/$.ts",
          "**/src/platform/CrossOrigin.ts",
        ],
      }) : undefined,
      buildForTest ? undefined : removeTestCode({
        include: [
          // Only files that actually have test code.
          "**/src/main/Main.ts",
          "**/src/classes/Post.ts",
          "**/src/Linkification/Linkify.ts",
        ],
        sourceMap: false,
      }),
      tsPlugin,
      (alias as any)({
        entries: [
          {
            find: /^@fa\/(.*)$/,
            replacement: resolve(repoRoot, 'node_modules/@fortawesome/free-regular-svg-icons/$1.js')
          },
          {
            find: /^@fas\/(.*)$/,
            replacement: resolve(repoRoot, 'node_modules/@fortawesome/free-solid-svg-icons/$1.js')
          },
        ]
      }),
      noFormat ? undefined : fixTsOutputFormat({
        include: ["**/*.ts", "**/*.tsx"],
      }),
      inlineFile({ include: ["**/*.html"] }),
      inlineFile({ include: ["**/*.css"] }),
      importBase64({ include: ["**/*.png", "**/*.gif", "**/*.wav", "**/*.woff", "**/*.woff2"] }),
      inlineFile({
        include: "**/package.json",
        wrap: false,
        transformer(input) {
          const meta = JSON.parse(input).meta;
          meta.includes_only = undefined;
          meta.matches_only = undefined;
          meta.matches = undefined;
          meta.matches_extra = undefined;
          meta.exclude_matches = undefined;
          meta.grants = undefined;
          return `export default ${JSON.stringify(meta, undefined, 1)};`;
        }
      }),
      inlineFile({
        include: "**/*.json",
        exclude: "**/package.json",
        wrap: false,
        transformer(input) {
          return `export default ${input};`;
        }
      }),
      faFix,
      cleanupPlugin,
    ].filter(Boolean)
  });

  /** @type {import('rollup').OutputOptions} */
  const sharedBundleOpts: any = {
    format: "iife",
    generatedCode: {
      // needed for possible circular dependencies
      constBindings: false,
    },
    // Can't be none as long as the root file defined exports
    exports: 'none',
  };

  // user script
  if (platform !== 'crx') {
    await bundle.write({
      ...sharedBundleOpts,
      banner: (metaNoDownload + license).replaceAll('\r\n', '\n'),
      // file: '../builds/test/rollupOutput.js',
      file: resolve(buildDir, fileName),
      plugins: [],
      sourcemap: false,
    });
  }

  // chrome extension
  if (platform !== 'userscript') {
    const crxDir = resolve(buildDir, 'crx');
    await bundle.write({
      ...sharedBundleOpts,
      banner: license.replaceAll('\r\n', '\n'),
      file: resolve(crxDir, 'script.js'),
    });

    const eventPage = await rollup({
      input: resolve(repoRoot, 'src/extension/eventPage.ts'),
      plugins: [
        eventPageTsPlugin,
        noFormat ? undefined : fixTsOutputFormat({ include: ["**/*.ts", "**/*.tsx"] }),
        cleanupPlugin,
      ].filter(Boolean),
    });

    await eventPage.write({
      format: 'module',
      file: resolve(crxDir, 'eventPage.js'),
    });

    await writeFile(
      resolve(crxDir, 'manifest.json'),
      generateManifestJson(packageJson, version, 2),
    );

    await writeFile(
      resolve(crxDir, 'manifestV3.json'),
      generateManifestJson(packageJson, version, 3),
    );

    for (const file of ['icon16.png', 'icon48.png', 'icon128.png']) {
      await copyFile(resolve(repoRoot, 'src/meta', file), resolve(crxDir, file));
    };
  }
})();
