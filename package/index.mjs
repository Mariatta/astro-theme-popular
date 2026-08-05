/** Popular: Astro integration entry.
 *
 *   import popular from 'astro-theme-popular';
 *   export default defineConfig({
 *     site: 'https://your.community',
 *     integrations: [mdx(), popular()],
 *   });
 *
 * Override components without forking: popular({ overrides: { Header:
 *   './src/overrides/Header.astro' } }). Theme code imports overridable
 * components from popular:component/<Name>; the integration resolves each
 * to the adopter's file or the theme default.
 *
 * Theme config (SITE, STRINGS, BRAND, NAV, ...) lives in the adopter's
 * `popular.config.ts` (same named exports as the classic src/config.ts;
 * the shape is the parity contract, see PARITY.md). Theme code reads it
 * through the `popular:config` virtual module.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';

/* Markdown body hooks: loading="lazy" decoding="async" on images (CWV parity
   with Hugo's render-image.html), and site-absolute links/images prefixed with
   the configured `base` so `![](/images/x.png)` and `[the handbook](/handbook/)`
   survive a subpath install (parity with Hugo's render hooks passing paths
   through relURL). Everything the templates write is handled by src/lib/url.ts
   instead; MDX component props (<Photo src="/images/x.png">) are JSX, not HAST,
   so the components prefix those themselves.

   Registered on the active markdown processor rather than through
   `markdown.rehypePlugins`: Astro 7's default processor is Sätteri, which does
   not run remark/rehype plugins at all, and plugins added by an integration
   after config validation are never coerced, so they are silently dropped
   (Astro warns "your satteri processor doesn't run them" on every build).
   Mutating processor.options is what does reach both Markdown and MDX: Astro
   preserves the processor's reference identity, and @astrojs/mdx reads the same
   object at astro:config:done. */

const prefixPath = (value, prefix) =>
  typeof value === 'string' &&
  prefix &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  value !== prefix &&
  !value.startsWith(`${prefix}/`)
    ? prefix + value
    : value;

/* Sätteri shape: filtered visitors, mutations through ctx.setProperty. */
function satteriMarkdownHooks(prefix) {
  return {
    name: 'popular-markdown-hooks',
    element: [
      {
        filter: ['img'],
        visit(node, ctx) {
          const props = node.properties ?? {};
          if (!('loading' in props)) ctx.setProperty(node, 'loading', 'lazy');
          if (!('decoding' in props)) ctx.setProperty(node, 'decoding', 'async');
          const src = prefixPath(props.src, prefix);
          if (src !== props.src) ctx.setProperty(node, 'src', src);
        },
      },
      {
        filter: ['a'],
        visit(node, ctx) {
          const props = node.properties ?? {};
          const href = prefixPath(props.href, prefix);
          if (href !== props.href) ctx.setProperty(node, 'href', href);
        },
      },
    ],
  };
}

/* unified/rehype shape, for a site that opted into `markdown.processor:
   unified({...})` (or set the deprecated markdown.rehypePlugins, which Astro
   coerces into one). Dependency-free HAST walk. */
function rehypeMarkdownHooks(prefix) {
  const walk = (node) => {
    const props = node.properties;
    if (props) {
      if (node.tagName === 'img') {
        if (!('loading' in props)) props.loading = 'lazy';
        if (!('decoding' in props)) props.decoding = 'async';
        props.src = prefixPath(props.src, prefix);
      }
      if (node.tagName === 'a') props.href = prefixPath(props.href, prefix);
    }
    (node.children || []).forEach(walk);
  };
  return () => (tree) => walk(tree);
}

function registerMarkdownHooks(config, logger) {
  /* config.base is '/' with no base configured, '/my-community' with one. */
  const prefix = (config.base ?? '/').replace(/\/+$/, '');
  const processor = config.markdown?.processor;
  if (Array.isArray(processor?.options?.hastPlugins)) {
    processor.options.hastPlugins.push(satteriMarkdownHooks(prefix));
  } else if (Array.isArray(processor?.options?.rehypePlugins)) {
    processor.options.rehypePlugins.push(rehypeMarkdownHooks(prefix));
  } else {
    logger.warn(
      `markdown.processor "${processor?.name ?? 'unknown'}" takes neither hastPlugins nor rehypePlugins: ` +
        'markdown images will not get loading="lazy"' +
        (prefix ? ', and site-absolute links in content will not carry the base' : ''),
    );
  }
}

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
  speakers: [
    ['/speakers', 'speakers/index.astro'],
    ['/speakers/[...slug]', 'speakers/[slug].astro'],
  ],
  venues: [
    ['/venues', 'venues/index.astro'],
    ['/venues/[...slug]', 'venues/[slug].astro'],
  ],
  tags: [['/tags/[tag]/[...page]', 'tags/[tag]/[...page].astro']],
  // Opt-in talk archive: injected always, but the page only builds when
  // SITE.talks is true (gated in the route's getStaticPaths).
  talks: [['/talks/[...page]', 'talks/[...page].astro']],
  rss: [['/rss.xml', 'rss.xml.js']],
  robots: [['/robots.txt', 'robots.txt.ts']],
  calendar: [['/events/calendar.ics', 'events/calendar.ics.ts']],
  llms: [['/llms.txt', 'llms.txt.ts']],
};

const OVERRIDABLE = ['Header', 'Footer', 'Hero', 'EventRow', 'PostCard', 'OrganizerCard', 'AuthorBox', 'PageHero'];

export default function popular(options = {}) {
  const configFile = options.configFile ?? './popular.config.ts';
  const overrides = options.overrides ?? {};
  return {
    name: 'astro-theme-popular',
    hooks: {
      'astro:config:setup': ({ config, injectRoute, injectScript, updateConfig, addWatchFile, logger }) => {
        const root = fileURLToPath(config.root);
        const userConfig = path.resolve(root, configFile);
        addWatchFile(userConfig);
        registerMarkdownHooks(config, logger);
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
              {
                name: 'popular:component',
                resolveId(id) {
                  if (id.startsWith('popular:component/')) return '\0' + id;
                },
                load(id) {
                  if (!id.startsWith('\0popular:component/')) return;
                  const name = id.slice('\0popular:component/'.length);
                  const target = overrides[name]
                    ? path.resolve(root, overrides[name])
                    : `astro-theme-popular/components/${name}.astro`;
                  return `export { default } from ${JSON.stringify(target)};`;
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
