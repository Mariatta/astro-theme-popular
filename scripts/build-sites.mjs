#!/usr/bin/env node
/**
 * Build every demo plus the gallery landing page into one tree, the way the
 * published site is laid out (gallery at the root, demos at subpaths).
 *
 *   node scripts/build-sites.mjs <site-origin> <base-prefix> <output-dir>
 *   node scripts/build-sites.mjs https://you.github.io /astro-theme-popular public
 *   node scripts/build-sites.mjs "$DEPLOY_PRIME_URL" "" public
 *
 * Used by .github/workflows/deploy-demo.yml (GitHub Pages, production) and by
 * the Netlify preview build (see AGENTS.md, "Settings that live outside this
 * repo"). One script so a preview cannot quietly differ from production.
 *
 * Since phase 3 each demo is its own workspace consuming the package, so this
 * builds them where they live instead of copying one into src/ at a time. That
 * makes the deployment an integration test: five real consumers, five configs,
 * built from the same package an adopter installs.
 *
 * Each demo is built with Astro's own `--base`, which is what makes every
 * link, image, feed and canonical URL land under the demo's subpath.
 *
 * Set POPULAR_PREVIEW_NOTE to render the preview banner on every page (the
 * env-var switch is meant for exactly this: a build nobody owns).
 *
 * Not part of the theme. Adopters who copy this repo never run it.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [site, basePrefix = '', outDir = 'public'] = process.argv.slice(2);
if (!site) {
  console.error('usage: build-sites.mjs <site-origin> <base-prefix> <output-dir>');
  process.exit(2);
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(process.cwd(), outDir);
const DEMOS = ['aquarium', 'foodie', 'kdrama', 'superfan'];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

for (const slug of DEMOS) {
  const cwd = join(ROOT, 'demos', slug);
  const base = `${basePrefix}/${slug}`;
  execFileSync('npx', ['astro', 'build', '--site', site, '--base', base], {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
  cpSync(join(cwd, 'dist'), join(OUT, slug), { recursive: true });
  rmSync(join(cwd, 'dist'), { recursive: true, force: true });
}

/* The gallery is a hand-written landing page, not an Astro build. */
cpSync(join(ROOT, 'demos/gallery/index.html'), join(OUT, 'index.html'));

console.log(`built ${DEMOS.length} demos + gallery into ${OUT} (site ${site}, base ${basePrefix || '/'})`);
