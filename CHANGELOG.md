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
