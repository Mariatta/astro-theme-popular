/** Popular: markdown body hooks for the template-model site.
 *
 *   import popularMarkdown from './popular-markdown.mjs';
 *   export default defineConfig({ integrations: [mdx(), sitemap(), popularMarkdown()] });
 *
 * Two things, both parity with Hugo's render hooks (PARITY.md):
 *
 *   - loading="lazy" decoding="async" on markdown images (Core Web Vitals,
 *     Hugo's render-image.html).
 *   - site-absolute links and image sources prefixed with the configured
 *     `base`, so `![](/images/x.png)` and `[the handbook](/handbook/)` in
 *     content survive a subpath install (Hugo's render-link/render-image
 *     passing paths through relURL). Everything the templates write is
 *     handled by src/lib/url.ts instead; MDX component props
 *     (<Photo src="/images/x.png">) are JSX, not HAST, so the components
 *     prefix those themselves.
 *
 * This is an integration rather than a plain `markdown.rehypePlugins` entry in
 * astro.config.mjs for two reasons. Astro 7's default processor is Sätteri,
 * which does not run remark/rehype plugins at all. And an integration is
 * handed the *resolved* config, so `astro build --base /elsewhere/` is honored;
 * a hook registered from a `const` in the config file would silently keep the
 * old base and leave every markdown link unprefixed.
 *
 * The packaged integration (package/index.mjs) carries the same logic for npm
 * consumers. Keep the two in step.
 */

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
   unified({...})`. Dependency-free HAST walk. */
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

export default function popularMarkdown() {
  return {
    name: 'popular-markdown',
    hooks: {
      'astro:config:setup': ({ config, logger }) => {
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
      },
    },
  };
}
