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
