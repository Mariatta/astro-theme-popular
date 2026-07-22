# PARITY.md: the Hugo ⇄ Astro contract

**Popular** ships in two implementations that must stay in sync:

- `hugo-theme-popular`: Hugo theme (canonical for shared assets)
- `astro-theme-popular`: Astro theme

This document is the contract. Any PR that changes one side must either port the
change to the other side, or open an issue labelled `parity` describing what's
pending. CI enforces the reminder (see `.github/workflows/parity-reminder.yml`).

---

## Tier 1: shared, byte-identical files (never fork these)

The design system and behaviour JS are framework-agnostic and must be **identical**
in both repos. The Hugo repo is the canonical source; copy Hugo → Astro.

| Hugo (canonical)                     | Astro                        |
|--------------------------------------|------------------------------|
| `assets/css/tokens/*.css`            | `src/styles/tokens/*.css`    |
| `assets/css/base.css`                | `src/styles/base.css`        |
| `assets/css/components.css`          | `src/styles/components.css`  |
| `assets/js/checklist.js`             | `public/scripts/checklist.js`|
| `assets/js/toc.js`                   | `public/scripts/toc.js`      |
| `assets/js/blog-filter.js`           | `public/scripts/blog-filter.js` |
| `assets/js/copy-code.js`             | `public/scripts/copy-code.js` |
| `assets/js/nav.js`                   | `public/scripts/nav.js`      |
| `scripts/sessionize-import.py`       | `scripts/sessionize-import.py` |
| `scripts/spreadsheet-import.py`      | `scripts/spreadsheet-import.py` |
| `scripts/sample-community.xlsx`      | `scripts/sample-community.xlsx` |
| `scripts/tests/`                     | `scripts/tests/`             |
| `CHANGELOG.md`                       | `CHANGELOG.md`               |
| `RELEASING.md`                       | `RELEASING.md`               |

Use `scripts/sync-shared.sh` to copy or verify (`--check` diffs and fails on drift).
Demo images are *not* in this tier: Astro's `public/images/` is an activation
copy of whichever demo is active, and per-demo imagery may drift.

**Shared invariants inside these files:**
- CSS class names (`g-*`) are the API. Renaming a class is a breaking change on BOTH sides.
- `checklist.js` localStorage key format: `popular-check:<id>`.
- JS hooks: `data-key` (checklist), `data-filterbar`/`data-filter`/`data-tags` (blog filter), `.g-doc-toc` (scroll-spy), `.g-nav__toggle`/`.g-navlinks` (nav).

## Tier 2: parallel implementations (port by hand)

Same behaviour, different language. When you change one, port the other.

| Feature            | Hugo                                   | Astro                                  |
|--------------------|----------------------------------------|----------------------------------------|
| Base shell         | `layouts/_default/baseof.html`         | `src/layouts/BaseLayout.astro`          |
| Brand token overrides | `partials/brand-vars.html`          | brand block in `BaseLayout.astro`       |
| Header / footer    | `partials/header.html`, `footer.html`  | `components/Header.astro`, `Footer.astro` |
| Home               | `layouts/index.html`                   | `pages/index.astro`                     |
| Blog list / post   | `layouts/blog/*`                       | `pages/blog/*`                          |
| Events list / page | `layouts/events/*`                     | `pages/events/*`                        |
| Organizers         | `layouts/organizers/list.html`         | `pages/organizers/[...page].astro`      |
| Docs (TOC)         | `layouts/docs/single.html`             | `pages/[slug].astro` (kind `doc`)       |
| Tag pages          | `layouts/_default/term.html`           | `pages/tags/[tag]/[...page].astro`      |
| List pagination    | `partials/pagination.html`             | `components/Pagination.astro`           |
| Cards / rows       | `partials/post-card.html`, `event-row.html`, `organizer-card.html` | `components/PostCard.astro`, `EventRow.astro`, `OrganizerCard.astro` |
| Callout            | `shortcodes/callout.html`              | `components/Callout.astro`              |
| Author box / pages | `partials/author-box.html`, `author-line.html`, `layouts/authors/*` | `components/AuthorBox.astro`, `pages/authors/[slug].astro` |
| Speaker pages      | `layouts/speakers/*` (reuses author-box) | `pages/speakers/[slug].astro` (AuthorBox with `base`) |
| Venue pages        | `layouts/venues/*`                     | `pages/venues/[slug].astro`             |
| Checklist          | `shortcodes/checklist.html`            | `components/Checklist.astro`            |
| Site configuration | `exampleSite/hugo.toml` `[params]`     | `src/config.ts`                         |

**Config invariant:** the `[params.brand]` keys in Hugo and the `BRAND` keys in
`src/config.ts` must stay identical (`primary`, `primaryHover`, `primaryActive`,
`link`, `linkHover`, `secondary`, `accent`, `accentHover`, `ink`, `surfaceWash`,
`surfaceWashSoft`, `surfaceInk`, `fontSans`, `fontDisplay`, `radiusCard`,
`containerMax`, plus the dark-palette keys `surfacePage`, `surfaceCard`,
`surfaceTertiary`, `textBody`, `textMuted`, `textOnBrand`, `borderSubtle`). `params.favicon` ⇄
`SITE.favicon`, falling back to the logo on both sides. `params.customCSS` ⇄
`SITE.customCSS` (extra stylesheet URLs, e.g. web fonts).

**Pagination invariant:** list pages paginate with `/…/page/N/` URLs on both
sides (page 1 is the section root). Page size comes from Hugo's standard
`[pagination] pagerSize` ⇄ `PAGINATION.pageSize` in `config.ts`; the demo
sites set both to 3. Blog, tag, and organizer lists paginate their full set;
the events list paginates past events only (upcoming always shows in full).
Both event sections group rows under `.g-year` year headings.

## Tier 2¾: UI strings (i18n)

Every user-facing string in templates comes from a named key, never hardcoded.
The key set must stay identical on both sides:

| Hugo | Astro |
|---|---|
| `i18n/en.toml` (`{{ i18n "key" }}`) | `STRINGS` in `config.ts` (`STRINGS.key`) |

Rules:

- Adding a template string means adding the same key to BOTH files, with the
  same English value.
- Dates go through the site locale: Hugo `time.Format` (localizes via the
  site's `languageCode`), Astro `toLocaleDateString(SITE.locale, ...)`.
- Shared JS must stay language-free: any text it renders is read from
  `data-*` attributes on `<body>` (`data-copy-label`, `data-checklist-done`),
  emitted by `baseof.html` / `BaseLayout.astro`, with English fallbacks.
- Keys used by only one side are allowed but must exist in both files and be
  commented (currently: `eyebrowTag`, `taggedCount`, Astro tag pages).

## Tier 3: content model (schema contract)

Front-matter fields must accept the same names on both sides
(Hugo: TOML front matter; Astro: YAML + zod schema in `src/content.config.ts`):

- **blog**: `title, date, author, authors[], guestAuthors[{name,title,photo,bio,website,social[]}], description, image, tags[], speaker{name,title,photo,bio}`
- **authors**: `title, role, photo, bio, website, social[{label,icon,url}]`
- **events**: `title, date (event start; upcoming/past pivot), description, image, tags[], time, venue, venueWanted, address, venueRef (venues slug; wins over flat venue fields), checkin, venueNotes (overrides the venue page's notes), speaker (one-liner fallback), speakers[] (speaker slugs), rsvp, meetupUrl (metadata only; not rendered)`
- **speakers**: `title, role, photo, bio, website, social[{label,icon,url}]` (same shape as authors)
- **venues**: `title, address, photo, notes (arrival notes, inherited by events), accessibility, website`
- **organizers**: `title, weight, role, photo, description, social[{label,icon,url}]`
- **docs / pages**: `title, eyebrow, lead`

Adding a field = update Hugo templates + Astro schema & components + this doc.

---

## Tier 3½: demo sets

Both repos ship the same four fictional demos: three communities (Rocky Cove
Aquarium Club / Lucky Town Foodie Club / KDrama Fan Club) and one personal
site (Truly Madly Riley: a superfan's site with the blog as a news feed,
events as an influencer's appearances, and no organizers). Demo *content and
config values* must stay equivalent across repos: Hugo `demos/*` ⇄ Astro
`demos/*` (slugs `aquarium`, `foodie`, `kdrama`, `superfan`; Hugo dirs use
full names, so `demos/truly-madly-riley` ⇄ `demos/superfan`). The demo
switcher bar is `params.demoBar` (Hugo) ⇄ `DEMO_BAR` in `config.ts` (Astro)
with identical slugs/labels/icons.

The neutral "Your Community" starter ships on both sides: Hugo
`exampleSite/` ⇄ Astro `demos/starter/` (which is also the Astro repo's
default active `src/`). The starter never sets the demo bar and is not part
of the deployed demo set.

## Release checklist

1. `scripts/sync-shared.sh --check` passes.
2. Tier-2 changes ported (or a `parity` issue exists).
3. Both example sites build: `hugo server` / `npm run build`.
4. Bump versions together; note cross-repo changes in both changelogs.

## Event JSON-LD (schema.org/Event)

Event pages emit `schema.org/Event` JSON-LD (Hugo `partials/jsonld-event.html`,
Astro `src/lib/eventld.ts`), keys sorted so the two are byte-identical. Only
resolvable keys are emitted (no empty strings/arrays/null).

**The `time` → `startDate` contract** (both implementations and
`scripts/tests/test_event_time.py` must agree):

| `time` value | startDate suffix |
|---|---|
| `6:00 PM` | `T18:00` |
| `18:30` | `T18:30` |
| `12:00 AM` | `T00:00` |
| `12:00 PM` | `T12:00` |
| `6:00 PM · doors 5:30` | `T18:00` |
| `doors at 5:30` | date-only |
| *(absent)* | date-only |
| `25:00` / `9:99` (out of range) | date-only |

Only a leading `HH:MM[am|pm]` token is parsed; put the true start time first.
The date part is the `date` field's calendar day, so write `date` as a plain
date (no time/offset) and the clock time in `time`. Fields: `cancelled`
(EventCancelled + visible danger badge, i18n `eventCancelled`), `online`
(OnlineEventAttendanceMode + VirtualLocation), `price`/`currency`/`cost`
(paid-event offers). `scripts/check-jsonld.py` validates every built block.

## Organization & BlogPosting JSON-LD (Tier 2)

Home pages emit `schema.org/Organization` (Hugo `jsonld-org.html`, Astro
`buildOrgLd`), with `sameAs` = the social config's URLs verbatim (so the RSS
URL differs by framework by design). Blog singles emit `BlogPosting` (Hugo
`jsonld-blogpost.html`, Astro `buildBlogPostingLd`): authors resolve through
the renameable authors section, falling back to the Organization; dates are
RFC3339 without milliseconds. Both use the shared key-sorted `jsonld()`.

## SEO: robots, sitemap, meta (Tier 2)

Both emit `robots.txt` advertising the sitemap (Hugo `enableRobotsTXT` +
`layouts/robots.txt`; Astro `robots.txt.ts` endpoint + `@astrojs/sitemap`),
plus `og:locale`, `og:image:alt` (from optional `imageAlt`), and a
`noindex,follow` on taxonomy pages when `seo.noindexTaxonomies` is set.
Sitemap URLs are absolute and subpath-safe. Astro-only dependency:
`@astrojs/sitemap` (config-only, no client JS).

## Computed stat values

Home-page stat `value`s: `@pastEventCount` and `@count:<section>[:rounded]`
resolve to live counts. Hugo: `partials/stat-value.html`. Astro: `formatStat`
in `src/lib/stats.ts`. Drafts are excluded, matching Hugo's RegularPages.

## Organizer profile pages

Organizer entries render a profile page (bio card + page body), linked from
their card, mirroring speakers. Hugo: `organizers/single.html`. Astro:
`organizers/[slug].astro` (injected under the `organizers` opt-out key in the
package). Eyebrow string `eyebrowOrganizer`. AuthorBox/author-box render the
organizer's `description` as the bio.

## Nested-page back link

A page nested in a section renders a back link to its parent, labeled by the
parent's `shortTitle` (optional front-matter) or title. Hugo derives the
parent via `.Parent`; Astro derives it from a slashed page id and serves
pages through `[...slug]`. `shortTitle` is in the pages schema
(`content.config.ts`) on the Astro side.

## Renameable sections

`[params.sections]` (Hugo) ⇄ `SECTIONS_MAP` (Astro) rename the sections the
theme reads: `authors` (post-author byline resolution and link base) and
`team` (homepage team grid and button). Defaults `authors` / `organizers`.
On Astro the value names a collection that must exist in `content.config.ts`.

## Blog post ordering (the post-navigation contract)

Older/newer navigation on blog singles orders posts by **date descending,
then title ascending, then slug/path ascending**; "next" is the newer post.
Hugo gets this from `.NextInSection` (its native section order); Astro sorts
explicitly with the same keys. Setting `weight` on a blog post is
unsupported: it would reorder Hugo but not Astro.

## Allowed asymmetries (by design)

- `head-extra.html` hook is Hugo-only: Hugo sites override a partial, Astro
  sites vendor the repo and edit `BaseLayout.astro` directly.
- `SITE.rssTitle` is Astro-only: Hugo's feed link title comes from the RSS
  output format and site title.
