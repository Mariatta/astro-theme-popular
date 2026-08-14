#!/usr/bin/env node
/**
 * create-popular: start a community site on the Popular Astro theme.
 *
 *   npm create popular@latest
 *   npm create popular@latest my-community -- --template aquarium
 *   npm create popular@latest my-community -- --template starter --site https://my.community --yes
 *
 * Writes a small project that *depends on* astro-theme-popular rather than
 * vendoring it, so the site updates with `npm update` instead of by diffing
 * tags and re-copying files. That is the whole reason the theme was packaged
 * (PACKAGING.md, "Why").
 *
 * Templates ship inside this package, collected from the repo's demo
 * workspaces at pack time (scripts/collect-templates.mjs). `starter` is the
 * neutral "Your Community" skeleton; the rest are the fictional demos, useful
 * as a fuller example to edit down.
 *
 * Dependency-free on purpose: `npm create` runs this before the user has
 * agreed to install anything, and the theme's other generator
 * (scripts/setup.py) is stdlib-only for the same reason.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { stdin, stdout } from 'node:process';

const HERE = resolve(dirname(fileURLToPath(import.meta.url)));
const TEMPLATE_DIR = join(HERE, 'templates');
const { version: VERSION } = JSON.parse(readFileSync(join(HERE, 'package.json'), 'utf8'));

const TEMPLATES = {
  starter: 'Your Community: a neutral skeleton, ready to fill in',
  aquarium: 'Rocky Cove Aquarium Club: a fuller meetup example',
  foodie: 'Lucky Town Foodie Club: a fuller meetup example',
  kdrama: 'KDrama Fan Club: a fan community with a photo gallery',
  superfan: 'Truly Madly Riley: a personal site, no organizers',
};

const die = (msg) => {
  console.error(`create-popular: ${msg}`);
  process.exit(1);
};

function parseArgs(argv) {
  const out = { dir: undefined, template: undefined, site: undefined, yes: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--yes' || arg === '-y') out.yes = true;
    else if (arg === '--template' || arg === '-t') out.template = argv[++i];
    else if (arg === '--site') out.site = argv[++i];
    else if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg.startsWith('-')) die(`unknown option ${arg}`);
    else if (out.dir === undefined) out.dir = arg;
    else die(`unexpected argument ${arg}`);
  }
  return out;
}

const HELP = `create-popular ${VERSION}

  npm create popular@latest [directory] -- [options]

Options:
  -t, --template <name>   ${Object.keys(TEMPLATES).join(', ')} (default: starter)
      --site <url>        the URL the site will be served from
  -y, --yes               accept defaults, ask nothing
  -h, --help              show this

Docs: https://popular.mariatta.ca/docs/quick-start/?fw=astro
`;

/* A project name npm will accept: lowercase, no spaces, no leading dot. */
const packageName = (dir) =>
  dir.split('/').filter(Boolean).pop()
    .toLowerCase()
    .replace(/[^a-z0-9-~][^a-z0-9-._~]*/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '') || 'my-community';

/* Astro wants the origin and the subpath separately, and a GitHub project page
   needs both. Splitting one answer keeps the question count down; the same
   split lives in scripts/setup.py (split_site_base). */
function splitSiteBase(url) {
  if (!url) return { site: 'https://example.com', base: '/' };
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    die(`--site must be a full URL (got '${url}')`);
  }
  const path = parsed.pathname.replace(/\/+$/, '');
  return { site: parsed.origin, base: path === '' ? '/' : path };
}

const astroConfig = ({ site, base }) => `import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import popular from 'astro-theme-popular';

/* \`site\` is your origin and \`base\` is the path your site is served from.
   A GitHub project page lives at you.github.io/my-community/, so its base is
   '/my-community'; leave it '/' for a site at a domain root. Every link, image
   and feed URL the theme writes follows both, markdown bodies included. */
export default defineConfig({
  site: '${site}',
  base: '${base}',
  integrations: [mdx(), popular()],
});
`;

const packageJson = (name) => `${JSON.stringify({
  name,
  private: true,
  type: 'module',
  scripts: { dev: 'astro dev', build: 'astro build', preview: 'astro preview' },
  dependencies: {
    '@astrojs/mdx': '^7.0.2',
    astro: '^7.0.6',
    'astro-theme-popular': `^${VERSION}`,
  },
}, null, 2)}\n`;

const CONTENT_CONFIG = `// The theme package owns the content model; this file just adopts it.
// Add your own collections here if you need them.
export { collections } from 'astro-theme-popular/schemas';
`;

const GITIGNORE = `dist/
node_modules/
.astro/
.DS_Store
`;

const readme = (name, template) => `# ${name}

A community site built with [Popular](https://popular.mariatta.ca/), started
from the \`${template}\` template.

\`\`\`bash
npm install
npm run dev
\`\`\`

- **Your settings** live in \`popular.config.ts\`: name, navigation, footer,
  brand colours, and the UI strings.
- **Your content** lives in \`src/content/\`: events, blog posts, organizers,
  speakers, venues, and the handbook.
- **Your images** live in \`public/images/\`.
- **Updating the theme** is \`npm update astro-theme-popular\`. You are not
  holding a copy of it, so there is nothing to re-merge.

Docs: https://popular.mariatta.ca/docs/?fw=astro
`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    stdout.write(HELP);
    return;
  }

  const interactive = !args.yes && stdin.isTTY;
  const rl = interactive ? createInterface({ input: stdin, output: stdout }) : null;
  const ask = async (question, fallback) => {
    if (!rl) return fallback;
    const answer = (await rl.question(question)).trim();
    return answer === '' ? fallback : answer;
  };

  try {
    if (interactive) stdout.write(`\nPopular ${VERSION}: a community-first Astro theme.\n\n`);

    const dir = args.dir ?? await ask('Directory [my-community]: ', 'my-community');

    let template = args.template;
    if (!template && interactive) {
      stdout.write('\nTemplates:\n');
      for (const [slug, blurb] of Object.entries(TEMPLATES)) {
        stdout.write(`  ${slug.padEnd(9)} ${blurb}\n`);
      }
      template = await ask('\nTemplate [starter]: ', 'starter');
    }
    template ??= 'starter';
    if (!Object.hasOwn(TEMPLATES, template)) {
      die(`unknown template '${template}'. Choose one of: ${Object.keys(TEMPLATES).join(', ')}`);
    }

    const siteUrl = args.site ?? await ask(
      '\nSite URL, if you know it [https://example.com]: ', 'https://example.com');

    const target = resolve(process.cwd(), dir);
    if (existsSync(target) && readdirSync(target).length > 0) {
      die(`${dir} already exists and is not empty`);
    }

    const from = join(TEMPLATE_DIR, template);
    if (!existsSync(from)) {
      die(`this build of create-popular has no '${template}' template ` +
          `(templates/ is populated at pack time; see scripts/collect-templates.mjs)`);
    }

    const name = packageName(dir);
    mkdirSync(target, { recursive: true });
    cpSync(from, target, { recursive: true });
    mkdirSync(join(target, 'src'), { recursive: true });
    writeFileSync(join(target, 'src', 'content.config.ts'), CONTENT_CONFIG);
    writeFileSync(join(target, 'astro.config.mjs'), astroConfig(splitSiteBase(siteUrl)));
    writeFileSync(join(target, 'package.json'), packageJson(name));
    writeFileSync(join(target, '.gitignore'), GITIGNORE);
    writeFileSync(join(target, 'README.md'), readme(name, template));

    stdout.write(`\nCreated ${name} in ${dir} from the ${template} template.\n\n`);
    stdout.write('Next:\n');
    stdout.write(`  cd ${dir}\n`);
    stdout.write('  npm install\n');
    stdout.write('  npm run dev\n\n');
    stdout.write('Then edit popular.config.ts to make it yours.\n');
    stdout.write('Docs: https://popular.mariatta.ca/docs/quick-start/?fw=astro\n\n');
  } finally {
    rl?.close();
  }
}

await main();
