# Changelog

One theme, two implementations: versions are tagged in lockstep in
[hugo-theme-popular](https://github.com/Mariatta/hugo-theme-popular) and
[astro-theme-popular](https://github.com/Mariatta/astro-theme-popular), and this
file ships identically in both (PARITY.md Tier 1). Format follows
[Keep a Changelog](https://keepachangelog.com/); versions follow
[semver](https://semver.org/). During 0.x, minor versions may contain breaking
changes; they will be called out here.

To hear about new releases: watch either repo on GitHub (Watch → Custom →
Releases) or subscribe to the releases feed
(`https://github.com/Mariatta/hugo-theme-popular/releases.atom`).

## [Unreleased]

### Added

- Back link to the parent section on nested pages, labeled by the parent's
  optional `shortTitle` front-matter field or its title. Astro serves pages
  through a rest-param route to support nested page ids.
- Renameable content sections: `[params.sections]` (Hugo) / `SECTIONS_MAP`
  (Astro) point post-author bylines (`authors`) and the homepage team grid
  (`team`) at differently-named sections, for communities whose people are
  not "organizers" or whose blog is not written by "authors". No template
  overrides needed.

### Fixed

- Post cards on date-less pages no longer render "Jan 0001" or a stray
  eyebrow separator (affects sections of static pages rendered through the
  default list).

## [0.4.0] - 2026-07-14

### Added

- Astro package: `popular({ routes: { speakers: false, ... } })` disables
  any injected route group, the supported way to replace part of the
  content model or provide your own `/` or `/rss.xml`.
- Astro package: injected slug routes use rest params, so folder-organized
  content ids (`2019-pycon-us/cooper-lees`) build.

### Changed

- Astro: theme pages tolerate undefined or empty collections, rendering no
  pages instead of failing the build.
- Theme-only CI workflows (deploys, releases, parity checks and reminders)
  no longer run in forks of either repo.

## [0.3.0] - 2026-07-09

### Added

- Older/newer post navigation on blog posts, with the cross-framework
  ordering contract pinned in PARITY.md (date descending, then title, then
  slug; `weight` on posts is unsupported). New UI string keys:
  `postNavigation`, `newerPost`, `olderPost`.
- The Sessionize importer can store a site's endpoint: `--id <embed-id>`
  shorthand, or persist it in `popular-import.toml` (`[sessionize]` with
  `id` or `url`) and run with just `--site .`.
- An updating guide at /docs/updating/: release discovery, per-install-method
  update steps, and which customization hooks survive updates.
- Astro: phase 1 of npm packaging (PACKAGING.md): the theme as an installable
  Astro integration under `package/`, with a smoke consumer built in CI.
  Experimental; the copy-this-repo model is unchanged and remains canonical.

## [0.2.0] - 2026-07-08

### Fixed

- Query-string URLs no longer double-escape (`&` became `&amp;amp;`, breaking
  links) in buttons, footer and header links, social icons, and markdown
  links. CI now fails on any double-escaped ampersand in built output.
- Markdown links no longer render a stray space before following punctuation.
- Astro: the RSS `<link rel="alternate">` resolves against the configured
  site instead of hardcoding `/rss.xml`, fixing subpath deployments.

### Changed

- The footer theme credit in demos and starters now links to the project
  site (mariatta.ca/hugo-theme-popular) instead of the author's personal
  site. Adopters control their own credit via footer config.

### Added

- `g-btn--accent` button variant, with an `accentHover` brand key (defaults
  to a darkened accent).
- `--gold-100` (card image placeholder tint) now derives from `brand.primary`
  like its sibling tints, instead of staying champagne on re-branded sites.
- Hugo: a `head-extra.html` hook for analytics or any other head markup,
  overridable per site without replacing the whole head partial.
- Astro: optional `SITE.rssTitle` for the feed link title.

## [0.1.0] - 2026-07-08

First public release.

### Added

- The theme, in Hugo and Astro parity: events (upcoming/past, venues,
  speakers, check-in and arrival notes, RSVP, "venue wanted"), multi-author
  blog with tag filtering and pagination, organizers, sponsors, and a docs
  area with scroll-tracking TOC and persistent checklists.
- Config-first branding: one `brand` block recolors and retypes the whole
  site, dark palettes included, plus `customCSS` for anything further.
- Content importers (stdlib-only Python): Sessionize (`sessionize-import.py`)
  and spreadsheet (`spreadsheet-import.py`, with `--make-sample` starter
  workbook). Unicode-safe slugs, never overwrite, Hugo and Astro output.
- Four fictional demos (Rocky Cove Aquarium Club, Lucky Town Foodie Club,
  KDrama Fan Club, Truly Madly Riley) plus the neutral "Your Community"
  starter (Hugo `exampleSite/`, Astro `demos/starter/`).
- Accessibility groundwork: required alt text enforced in CI, keyboard
  navigable menus, checklist checkboxes announce state, skip link, WCAG
  link underlines.
- CI: helper-script tests, image-alt checks (Hugo 0.146 floor + latest),
  cross-repo parity check, base-path escape scan on deploys.
- Hugo Modules support (`go.mod`): import as
  `github.com/Mariatta/hugo-theme-popular`.
