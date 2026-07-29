#!/usr/bin/env node
/**
 * use-demo.mjs: activate one of the demo sets (demos/<slug>) as the live site.
 *   node scripts/use-demo.mjs starter|aquarium|foodie|kdrama|superfan
 * Copies the demo's config.ts → src/config.ts, content → src/content,
 * and images → public/images. Adopters: ignore this: put your own content
 * straight into src/ and delete demos/.
 */
import { cpSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
const demo = join(root, 'demos', slug ?? '');

if (!slug || !existsSync(demo)) {
  console.error('usage: node scripts/use-demo.mjs <starter|aquarium|foodie|kdrama|superfan>');
  process.exit(1);
}

rmSync(join(root, 'src/content'), { recursive: true, force: true });
rmSync(join(root, 'public/images'), { recursive: true, force: true });
// Astro's content layer persists collection entries in a data store under
// node_modules/.astro (with generated types mirrored in ./.astro). The store
// is keyed by build state, not by which demo is active, so without clearing it
// the previous demo's entries (e.g. starter's organizers, whose photos do not
// exist in the next demo) leak into the build as broken content. This matters
// most in the deploy workflow, which builds every demo back-to-back in one
// job. Drop both caches so each activation loads only this demo.
rmSync(join(root, 'node_modules/.astro'), { recursive: true, force: true });
rmSync(join(root, '.astro'), { recursive: true, force: true });
cpSync(join(demo, 'content'), join(root, 'src/content'), { recursive: true });
cpSync(join(demo, 'images'), join(root, 'public/images'), { recursive: true });
cpSync(join(demo, 'config.ts'), join(root, 'src/config.ts'));
console.log(`Activated demo: ${slug}`);
