import type { APIRoute } from 'astro';

/* Generated so the Sitemap URL respects `site` + base path. @astrojs/sitemap
   emits sitemap-index.xml. */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site ?? 'https://example.com').href;
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
};
