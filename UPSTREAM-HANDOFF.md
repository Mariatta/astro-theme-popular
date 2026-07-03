# Upstream handoff: findings from the Maintainers Summit port

Issues found while porting the PyCon US Maintainers Summit site onto this
theme (fork branch `theme-port` in the maintainersummit repo, worktree at
`~/github/mariatta/maintainersummit-theme`). Each Astro-side fix should be
mirrored in hugo-theme-popular per PARITY.md.

## Bugs

### 1. Back link and eyebrow collide on event pages

`src/pages/events/[slug].astro`: the back link is `display:inline-flex` and
`.g-eyebrow` is `inline-block`, so "All events" and the date eyebrow render on
one line with no gap; the link's `margin-bottom` does nothing. The blog post
page avoids this only because a block element happens to follow the link.

Fix: wrap the back link in a block element (see fork commit `24fb73c`), or
make `.g-eyebrow` block-level.

### 2. Docs sidebar sort is a no-op

`src/pages/[slug].astro` sorts docs by `data.weight ?? 100`, but `weight` is
not declared in the docs schema in `src/content.config.ts`, so every doc gets
100 and the nav order is effectively filesystem order.

Fix: add `weight` to the docs schema, or drop the sort. (The fork replaced it
with an `order` field plus an `audience` enum.)

### 3. Tag URLs are not slugified (parity bug)

`src/components/PostCard.astro`, `src/pages/blog/[...page].astro`, and
`src/pages/tags/[tag]/[...page].astro` put raw tag text into `/tags/${t}/`.
A tag like "Thank You" produces a URL with a space and capital letters. Hugo
urlizes taxonomy terms automatically, so the two themes generate different
URLs for multi-word tags.

Fix: add a `tagSlug()` helper (see the fork's `src/lib/slugs.ts`) and use it
for tag routes and links, keeping the first-seen spelling as the display
label.

## Accessibility / design robustness

### 4. Links are indistinguishable from text under dark brand palettes

`--text-link` is derived from `BRAND.primaryActive` and links have no
underline (`src/styles/base.css`), so any adopter with a dark navy or ink
palette gets links that look exactly like body text. WCAG 1.4.1: color must
not be the only distinguisher.

Fix (both in fork commit `a49adca`):
- underline prose links: `.g-prose a { text-decoration: underline; text-underline-offset: 2px; }`
- add optional `BRAND.link` / `BRAND.linkHover` overrides in the brand-vars
  logic in `src/layouts/BaseLayout.astro` (Hugo mirror: `brand-vars.html`).

### 5. Favicon falls back to the logo PNG

`src/layouts/BaseLayout.astro` uses `<link rel="icon" href={SITE.logo}>`. No
logo means no favicon, and a header logo is rarely a good favicon.

Fix: separate `SITE.favicon` config with logo fallback
(`SITE.favicon ?? SITE.logo` in the fork).

## Enhancements worth upstreaming

### 6. Draft posts

The blog schema has no `draft` field, so unpublished posts cannot live in the
repo. Hugo supports drafts natively, so this is arguably a parity gap too.

Fork version: `draft: z.boolean().default(false)` plus filters in the list
page, tag pages, author pages, RSS, and the post route.

### 7. Richer SEO head

The fork's BaseLayout adds, and upstream could lift wholesale:
- canonical URL
- `og:type` and article meta (published/modified time, per-author and per-tag
  properties)
- Twitter card falls back to `summary` when there is no image
- absolute URLs (canonical, og:image, RSS link) resolve against the live
  request origin in dev and the configured `site` in builds

### 8. RSS bylines and categories

`src/pages/rss.xml.js` emits only title/date/description/link. The fork adds
resolved author names (authors collection, guest authors, plain string
fallback) and tags as categories.

### 9. Multi-edition event mode (the big one)

The summit needs yearly editions instead of a rolling calendar: events with
`year` and `status`, `speakers` and `topics` collections referencing events,
and per-edition subroutes (`/events/<id>/`, `/events/<id>/speakers/`,
`/events/<id>/topics/`) with a tabbed subnav and prev/next navigation.

The fork implements all of this (branch `theme-port`), but upstreaming needs a
design decision first: how an edition-based mode coexists with the existing
date-driven meetup mode (config switch, separate collection, or a second
starter). Not a straight copy.

## Explicitly not an upstream problem

The narrow reading column (`g-narrow`, about 52rem) on blog post pages is the
theme's intentional article layout, and the upstream post page is internally
consistent (hero and body both narrow). The misalignment seen on the summit's
event pages came from the port placing a new full-width subnav next to the
narrow hero, and was fixed in the fork by widening those pages.