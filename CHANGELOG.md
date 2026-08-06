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

- **The setup wizard now writes everything a GitHub Pages deployment needs.**
  Answer the site-URL question with a project-page URL
  (`https://you.github.io/my-community/`) and `scripts/setup.py` writes a site
  that works there:
  - Astro gains a generated `astro.config.mjs` carrying `site` and `base`.
    Astro needs the origin and the subpath as separate keys and nothing wrote
    `base` before, so a project-page site 404'd every internal link. They are
    derived from the single `base_url` answer, so the schema is unchanged and
    no one is asked the same thing twice.
  - Both frameworks gain `.github/workflows/deploy.yml`, a parameterless
    GitHub Pages workflow (everything that varies lives in the config the
    wizard already wrote). It is skipped when the site already has workflows
    of its own, so it never fights an existing deployment. Set Settings ->
    Pages -> Source: GitHub Actions once, and pushes to `main` publish.
- **Astro: `popular-markdown.mjs`,** the markdown hooks (lazy images, base-aware
  links) as a proper integration in the template model, matching what the npm
  package already does. Because an integration receives the resolved config,
  `astro build --base /elsewhere/` now applies to markdown bodies too, where the
  old config-file hook silently kept the old base.

## [0.9.1] - 2026-08-05

### Fixed

- **The docs sidebar scrolls when it outgrows the window.** On a long page the
  current entry nests every heading beneath it, which makes the sticky sidebar
  taller than the viewport, and a sticky element taller than the viewport
  cannot be scrolled: the entries below the fold, including the links to the
  other docs pages, were unreachable until you had scrolled through the whole
  article. The sidebar now stops at the bottom of the window and scrolls on its
  own, and the scroll-spy keeps the highlighted entry in view as you read.

## [0.9.0] - 2026-08-05

### Added

- **Base-aware URL helpers, as public surface.** Astro: `withBase()` and
  `absoluteUrl()` from `src/lib/url.ts`, exported by the package as
  `astro-theme-popular/url`. Hugo: `rel-src.html` (images and assets) and
  `abs-url.html` (absolute URLs) join the existing `rel-href.html`. Use them
  for any URL your own components, overrides or templates emit, and a subpath
  install keeps working. The Astro template repo's `astro.config.mjs` gained a
  `base` constant at the top: leave it `'/'` for a site at a domain root.

### Fixed

- **Sites served from a subpath now work in both themes.** A site deployed to
  `user.github.io/repo/` (Astro `base`, Hugo `baseURL` with a path) built and
  styled correctly but every internal link and image stayed at the server root
  and 404'd. Both frameworks rewrite the asset URLs they generate themselves,
  and neither touches the paths a template writes, so those had to be resolved
  explicitly.
  - Astro: new `withBase()` / `absoluteUrl()` helpers (`lib/url.ts`, exported
    from the package as `astro-theme-popular/url`) now resolve every URL the
    theme emits: navigation, cards, tags, pagination, the brand link, images
    from config and front matter, the shared behaviour scripts, and the
    absolute URLs in canonical, `og:image`, JSON-LD, RSS, `llms.txt`,
    `robots.txt` and the iCalendar feed. Markdown bodies are handled by a hook
    the integration registers on the active Markdown processor.
  - Hugo: `rel-href.html` now has a sibling, `rel-src.html`, for images and
    assets, plus `abs-url.html` for absolute URLs. Front matter written the
    Astro way (`image = "/images/x.png"`) previously lost the subpath, because
    `relURL`/`absURL` treat a leading slash as the server root. Card, hero,
    logo, favicon, avatar and body images, the JSON-LD `url`/`logo`/`image`
    fields and `og:image` all go through them now.
  - Adopter configs and content need no changes: the helpers pass external
    URLs, `mailto:`, `tel:` and `#fragment` through untouched, and accept
    paths written with or without a leading slash.
  - Both repos build a subpath site in CI and fail on any internal `href` or
    `src` left at the root (`PARITY.md`, "Subpath deployments").
- **Astro package: markdown images regained `loading="lazy" decoding="async"`.**
  Astro 7's default Markdown processor does not run rehype plugins, and a
  plugin added by an integration after config validation was dropped silently
  (Astro warned on every build). The theme's hooks are now registered on the
  active processor, in that processor's own plugin shape.

## [0.8.1] - 2026-08-04

### Changed

- The setup wizard now adopts an unedited starter file automatically. On a fresh
  site (copied from `exampleSite` or a demo, or the Astro template), it writes
  the config and Code of Conduct seed page without `--force`, because their bytes
  still match what the theme shipped. The moment you hand-edit either one, the
  wizard protects it again and asks for `--force`. First-time setup no longer
  needs a flag.

## [0.8.0] - 2026-08-04

### Added

- Setup wizard (`scripts/setup.py`): a stdlib, zero-dependency script that reads
  the shared question schema (`setup-questions.json`) and writes a site's config,
  a Code of Conduct seed page, a `DECISIONS.md` audit trail (what was decided,
  with handbook citations, and what is still open) and a `.popular-setup.json`
  answer record. Sugar, never a gate: skip every question and you get the clean
  starter config. Runs interactively or non-interactively (`--answers file.json`)
  for the agent and CI paths, detects Hugo vs Astro, and never overwrites an
  existing file without `--force` (`--dry-run` shows the diff). Works by
  placeholder substitution on templates, so it never parses or re-serializes
  your config.
- "Before you build" worksheet (`/docs/before-you-build/`): a docs page that
  renders the same question schema as a persistent checklist (decisions to
  settle first, then values to have ready), so the worksheet cannot drift from
  the wizard. The quick-start is rewritten around the wizard, and both repos'
  `AGENTS.md` gain a "Setting up a new site for a user" interview protocol.

## [0.7.0] - 2026-07-31

### Changed

- The footer shows the theme version (e.g. `v0.7.0`) next to the Popular
  credit, on the demos and the docs site.

### Fixed

- The "no upcoming events" empty state no longer renders on event-less sites
  such as the docs site; it appears only on a community that has an events
  section but nothing upcoming.

### Added

- Recaps toolkit: `gallery` + `photo` and `pullquote` shortcodes (Hugo) /
  `Gallery` + `Photo` and `Pullquote` components (Astro). The gallery is a
  CSS-grid figure list with no JavaScript and no lightbox (each photo links to
  its full-size image); `alt` is required and a missing one fails the build.
  A recap is a blog post tagged `recap` that uses both, with a worked example
  in the KDrama demo.
- `llms.txt`: a build-time plain-text summary for AI agents at `/llms.txt`,
  naming the next upcoming event, how to join, and links to the key pages and
  the calendar feed. Always generated on Astro; on Hugo the site adds `LLMS`
  to its home outputs (the demos, exampleSite, and docs site do).
- Docs: the deliberate non-features list (job board, member directory,
  comments, photo lightbox) and the stats strip as the social-proof pattern.

### Added

- Talk archive. Events gain optional `recording` / `slides` (single-talk
  meetups) and a `talks[]` array (`title` required; `speaker`, `recording`,
  `slides` optional); when `talks[]` is present it wins over the event-level
  fields. The event page renders a Talks section (or inline links for the
  simple case), and past-event rows show a recording cue. An opt-in `/talks/`
  archive aggregates every talk newest-first, filterable by the parent event's
  tags: enable it with `content/talks/_index.md` (Hugo) or `SITE.talks = true`
  (Astro). New UI strings `watchRecording`, `viewSlides`, `hasRecording`,
  `talks`, `talksLead`.

### Changed

- Speaker, organizer, and author profile pages no longer repeat the bio: the
  page hero is now a compact banner (eyebrow, name, back link) and the bio
  lives only in the persona card below it.

### Added

- Community chat bridge and speaker pipeline. `params.community.chat =
  { url, label }` adds a "Join the chat" CTA to the home hero, the footer, and
  the no-events empty state (platform-agnostic: Discord, Slack, Matrix, Zulip).
  The starter ships a "Start here" first-timer page (`/start/`) and a "Speak
  with us" call-for-speakers page (`/speak/`). `params.speakers.invite = true`
  appends a "Your name here?" card to the speakers list (new strings
  `speakerInviteTitle`, `speakerInviteBody`), off by default.

### Fixed

- Astro: the speakers and venues list pages (`/speakers/`, `/venues/`) were
  missing, so the "All speakers" / "All venues" back links on detail pages led
  to 404s. Both list pages now exist, mirroring the Hugo templates.

### Added

- Notice banner and designed empty states. `params.notice = { text, url? }`
  renders a static, non-dismissible banner above the header (inline-markdown
  text, an optional link, no JavaScript). When there are no upcoming events,
  the home page and the events list now render a designed empty state (a
  message, the community chat CTA if configured, and the calendar-subscribe
  link) instead of a blank section. New UI strings `learnMore`, `joinChat`.

### Added

- Venue access & logistics fields: `wheelchair` (a badge on the venue and on
  events held there), `transit`, `parking`, and a freeform `access` note,
  shown as a "Getting there & access" section. Inclusion as a data-model
  concern. Matching spreadsheet-importer columns. New UI strings
  `gettingThere`, `wheelchairAccessible`, `transit`, `parking`.

### Added

- Calendar feed: an iCalendar (`.ics`) feed of events at
  `/events/calendar.ics`, so members subscribe once and every future meetup
  appears in their calendar app. Reuses the event `time` parsing (so the feed
  and the Event structured data agree), marks cancelled events, and adds a
  "Subscribe to calendar" link to the events list. `scripts/check-ics.py`
  validates it in CI. Hugo: add `Calendar` to the events section outputs.

### Fixed

- Speaker, venue and organizer profile pages now show a back link to their
  list (matching blog posts and events); the organizer link follows the
  renamed team section. New UI strings `allSpeakers`, `allVenues`,
  `allOrganizers`.

### Added

- Astro package: component overrides. `popular({ overrides: { Header:
  './src/overrides/Header.astro' } })` replaces any of Header, Footer, Hero,
  EventRow, PostCard, OrganizerCard, AuthorBox, PageHero without forking the
  theme. (Hugo adopters already override via native template lookup.)

## [0.6.0] - 2026-07-23

Search-engine optimisation: structured data, crawl plumbing, Core Web Vitals,
and an FAQ block. Zero client JavaScript added.

### Added

- Structured data (JSON-LD, byte-identical across both frameworks):
  `schema.org/Event` on event pages (rich-result eligible, with best-effort
  `time` parsing; see PARITY.md for the contract), `Organization` on home
  pages, `BlogPosting` on blog posts, and `FAQPage` from FAQ blocks.
- New event fields: `cancelled` (a visible danger badge **and** the structured
  status, so they never disagree), `online` (virtual location), and
  `price`/`currency`/`cost` (paid-event offers).
- FAQ block: `{{< faq >}}`/`{{< question >}}` shortcodes (Astro `<FAQ>`/
  `<FAQItem>`), native `<details>` with zero JavaScript, answers in the DOM
  for indexing and AI answer engines. Gated FAQPage JSON-LD via
  `seo.faqJsonLd` (default true).
- Crawl plumbing: `robots.txt` advertising the sitemap, `og:locale`,
  `og:image:alt` (optional `imageAlt` field), and an opt-in `noindex` on
  taxonomy pages (`seo.noindexTaxonomies`). Astro adds `@astrojs/sitemap`.
- Core Web Vitals: markdown and card/list images lazy-load with async
  decoding (hero and event lead stay eager); a `preconnect` to the Font
  Awesome CDN when the default URL is used.
- New SEO and FAQ documentation pages; `scripts/check-jsonld.py` validates
  every built JSON-LD block in CI.

## [0.5.0] - 2026-07-21

### Added

- Computed home-page stats: `@count:<section>` (and `@count:<section>:rounded`)
  render a live entry count for any section, generalizing `@pastEventCount`.
  Factored into a reusable resolver (Hugo `partials/stat-value.html`, Astro
  `src/lib/stats.ts`).
- Organizer profile pages: each organizer entry renders a bio-card profile
  page (Hugo `organizers/single.html`, Astro `organizers/[slug]`), and
  organizer cards link to it. New `eyebrowOrganizer` UI string.
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
