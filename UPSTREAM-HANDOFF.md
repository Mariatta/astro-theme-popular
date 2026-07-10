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

## Round 2: fork syncs and the npm package (2026-07)

Status of round 1: items 1 through 8 shipped by v0.3.0 (several in 0.2.0).
Item 9, the multi-edition event mode, remains open and is still the fork's
reason to exist. The findings below come from three upstream merges into the
fork (up to v0.3.0) and from a real adoption attempt of the published npm
package.

### 10. npm package: phase 2 needs route opt-outs and rest params

`astro-theme-popular@0.3.0` installs and builds cleanly for a fresh consumer
(the package README quickstart was verified against the registry tarball, 15
pages). Pointing the integration at the summit fork instead fails, and the
failure modes are exactly the phase-2 surface PACKAGING.md anticipates:

- **No route opt-outs.** The integration injects all twelve routes
  unconditionally. A site that replaces part of the content model needs
  something like `popular({ routes: { speakers: false, venues: false } })`
  or the planned override map before it can adopt the package.
- **`[slug]` params reject nested ids.** The summit's speakers live at
  `<event>/<person>` (`2019-pycon-us/cooper-lees`). The injected
  `/speakers/[slug]` route hard-fails the build with "Missing parameter:
  slug" because a slash cannot fill a single param. Injected routes should
  use rest params (`[...slug]`) so organized-into-folders content works.
- **Undefined collections are queried.** The injected venues route logs
  "The collection venues does not exist" when the adopter never defined it.
  Injected routes should no-op when their collection is absent.
- **Static routes collide.** `/` and `/rss.xml` collide with the adopter's
  own files; Astro warns this becomes a hard error in a future version, so
  "project route wins" is not a durable shadowing story.

Reproduction: branch `npm-package-experiment` in the fork worktree
(`~/github/mariatta/maintainersummit-theme`), one commit on top of the
v0.3.0 sync.

### 11. Accent button variant

The theme defines `BRAND.accent` but no button variant that uses it. The
fork added `.g-btn--accent` with a hover state in `components.css`, a
`BRAND.accentHover` key, and the `--color-accent-hover` mapping in
BaseLayout's brand vars (with a `var(--color-accent-hover,
var(--color-accent))` fallback). The summit home hero uses
`variant: 'accent'`; any adopter would reasonably expect that variant to
exist. Small and Hugo-mirrorable.

### 12. Starter content and theme-only CI are papercuts for merge-based forks

A fork that tracks this repo by `git merge` inherits things a diverged site
must delete every sync:

- **Live sample content in `src/content`.** Since the starter-skeleton
  change, `src/content` ships sample entries (event, post, organizer,
  speaker, venue, docs, pages). On a fork with replaced schemas the sample
  event fails the build outright; the rest silently publishes sample pages.
  Options: mark samples `draft: true`, move the skeleton under `demos/`
  (already inert for forks), or document that forks delete them.
- **Theme-only workflows run in forks.** `package-smoke.yml`'s drift guard
  compares `src/` against `package/` and will fail on every push in a fork
  whose `src/` is deliberately diverged; `release.yml` and `deploy-demo.yml`
  do not belong in a downstream site repo either. Guarding jobs with
  `if: github.repository == 'Mariatta/astro-theme-popular'` would let forks
  keep the files (and merge cleanly) without running them.

Most adopters copy rather than merge, so this is low priority; it mainly
taxes the summit fork until the npm package makes vendoring unnecessary.
