#!/usr/bin/env node
/**
 * use-demo.mjs: activate one of the demo sets (demos/<slug>) as the live site.
 *   node scripts/use-demo.mjs aquarium|foodie|kdrama|superfan
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
  console.error('usage: node scripts/use-demo.mjs <aquarium|foodie|kdrama|superfan>');
  process.exit(1);
}

rmSync(join(root, 'src/content'), { recursive: true, force: true });
rmSync(join(root, 'public/images'), { recursive: true, force: true });
cpSync(join(demo, 'content'), join(root, 'src/content'), { recursive: true });
cpSync(join(demo, 'images'), join(root, 'public/images'), { recursive: true });
cpSync(join(demo, 'config.ts'), join(root, 'src/config.ts'));
console.log(`Activated demo: ${slug}`);
