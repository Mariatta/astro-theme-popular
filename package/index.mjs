/** Popular: Astro integration entry.
 *
 *   import popular from 'astro-theme-popular';
 *   export default defineConfig({
 *     site: 'https://your.community',
 *     integrations: [mdx(), popular()],
 *   });
 *
 * Theme config (SITE, STRINGS, BRAND, NAV, ...) lives in the adopter's
 * `popular.config.ts` (same named exports as the classic src/config.ts;
 * the shape is the parity contract, see PARITY.md). Theme code reads it
 * through the `popular:config` virtual module.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';

/* Injected routes, grouped by opt-out key: popular({ routes: { speakers:
   false } }) skips a group. Disabling is also the durable answer when your
   site provides its own page at a theme path (`/`, `/rss.xml`): Astro is
   deprecating silent route collisions. Slug routes use rest params so
   folder-organized content ids (2019-pycon-us/cooper-lees) resolve. */
const ROUTES = {
  home: [['/', 'index.astro']],
  pages: [['/[...slug]', '[...slug].astro']],
  authors: [['/authors/[...slug]', 'authors/[slug].astro']],
  blog: [
    ['/blog/[...page]', 'blog/[...page].astro'],
    ['/blog/[...slug]', 'blog/[slug].astro'],
  ],
  events: [
    ['/events/[...page]', 'events/[...page].astro'],
    ['/events/[...slug]', 'events/[slug].astro'],
  ],
  organizers: [
    ['/organizers/[...page]', 'organizers/[...page].astro'],
    ['/organizers/[...slug]', 'organizers/[slug].astro'],
  ],
  speakers: [['/speakers/[...slug]', 'speakers/[slug].astro']],
  venues: [['/venues/[...slug]', 'venues/[slug].astro']],
  tags: [['/tags/[tag]/[...page]', 'tags/[tag]/[...page].astro']],
  rss: [['/rss.xml', 'rss.xml.js']],
  robots: [['/robots.txt', 'robots.txt.ts']],
};

export default function popular(options = {}) {
  const configFile = options.configFile ?? './popular.config.ts';
  return {
    name: 'astro-theme-popular',
    hooks: {
      'astro:config:setup': ({ config, injectRoute, injectScript, updateConfig, addWatchFile }) => {
        const root = fileURLToPath(config.root);
        const userConfig = path.resolve(root, configFile);
        addWatchFile(userConfig);
        updateConfig({
          integrations: [sitemap()],
          vite: {
            plugins: [
              {
                name: 'popular:config',
                resolveId(id) {
                  if (id === 'popular:config') return '\0popular:config';
                },
                load(id) {
                  if (id === '\0popular:config') {
                    return `export * from ${JSON.stringify(userConfig)};`;
                  }
                },
              },
            ],
          },
        });
        // Behavior JS (Tier-1 shared files, byte-identical with the Hugo
        // repo). Injected as one bundled page script: hashed, deduplicated,
        // loaded once per page like the classic <script defer> tags.
        injectScript(
          'page',
          [
            'nav',
            'checklist',
            'toc',
            'blog-filter',
            'copy-code',
          ].map((s) => `import 'astro-theme-popular/scripts/${s}.js';`).join('\n'),
        );
        for (const [key, routes] of Object.entries(ROUTES)) {
          if (options.routes?.[key] === false) continue;
          for (const [pattern, entry] of routes) {
            injectRoute({
              pattern,
              entrypoint: `astro-theme-popular/pages/${entry}`,
              prerender: true,
            });
          }
        }
      },
    },
  };
}
