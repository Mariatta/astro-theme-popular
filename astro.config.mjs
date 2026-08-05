import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

/* Serving the site from a subpath rather than a domain root? A GitHub project
   page (user.github.io/repo/) is the common case. Set this to '/repo' and
   every link the theme writes picks up the prefix: it feeds Astro's `base`,
   which src/lib/url.ts reads back through import.meta.env.BASE_URL, and the
   markdown hook below. Leave it '/' for a site at a domain root. */
const base = '/';

/* Add loading="lazy" decoding="async" to markdown images (CWV), the Astro
   counterpart of Hugo's render-image.html. Dependency-free HAST walk. */
function rehypeLazyImages() {
  const walk = (node) => {
    if (node.tagName === 'img') {
      node.properties = node.properties || {};
      if (!('loading' in node.properties)) node.properties.loading = 'lazy';
      if (!('decoding' in node.properties)) node.properties.decoding = 'async';
    }
    (node.children || []).forEach(walk);
  };
  return (tree) => walk(tree);
}

/* Prefix site-absolute markdown links and image sources with the base, so
   `![](/images/x.png)` and `[the handbook](/handbook/)` in content survive a
   subpath install. Counterpart of Hugo's render-link/render-image hooks; the
   templates get the same treatment from src/lib/url.ts. */
function rehypeBaseUrls(prefix) {
  const fix = (value) =>
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    value !== prefix &&
    !value.startsWith(`${prefix}/`)
      ? prefix + value
      : value;
  const walk = (node) => {
    const p = node.properties;
    if (p) {
      if (node.tagName === 'img' && p.src) p.src = fix(p.src);
      if (node.tagName === 'a' && p.href) p.href = fix(p.href);
    }
    (node.children || []).forEach(walk);
  };
  /* An attacher, like rehypeLazyImages above: unified calls it to get the
     transformer, so the factory has to return a function that returns one. */
  return () => (tree) => walk(tree);
}

const baseHooks = base === '/' ? [] : [rehypeBaseUrls(base.replace(/\/+$/, ''))];

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  base,
  integrations: [mdx(), sitemap()],
  markdown: { rehypePlugins: [rehypeLazyImages, ...baseHooks] },
});
