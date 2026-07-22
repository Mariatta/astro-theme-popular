import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

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

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  integrations: [mdx(), sitemap()],
  markdown: { rehypePlugins: [rehypeLazyImages] },
});
