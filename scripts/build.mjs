// Compiles src/entries/*.ts into dist/*.js (bundled, IIFE) and copies public/
// (manifest.json, popup.html/css, icons/, _locales/) into dist/ as-is.
// dist/ is a directly loadable unpacked extension — point chrome://extensions
// "Load unpacked" at it, or zip it with build.ps1 for the Web Store.
import { build, context } from 'esbuild';
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const publicDir = path.join(root, 'public');
const distDir = path.join(root, 'dist');
const watch = process.argv.includes('--watch');

const entries = ['background', 'content', 'popup', 'theme'].map((name) => path.join(root, 'src', 'entries', `${name}.ts`));

function copyPublicAssets() {
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });
  cpSync(publicDir, distDir, { recursive: true });
}

const buildOptions = {
  entryPoints: entries,
  bundle: true,
  format: 'iife',
  target: 'es2020',
  charset: 'utf8',
  outdir: distDir,
  logLevel: 'info'
};

if (!existsSync(publicDir)) {
  throw new Error(`Missing ${publicDir} — expected manifest.json, popup.html, popup.css, icons/, _locales/`);
}

copyPublicAssets();

if (watch) {
  const ctx = await context(buildOptions);
  await ctx.watch();
  console.log('Watching for changes... (Ctrl+C to stop)');
} else {
  await build(buildOptions);
  console.log(`Built extension into ${distDir}`);
}
