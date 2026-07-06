# AGENTS.md: working in astro-popular

Instructions for AI agents (and new contributors) working in this repository.

## What this repo is

**Popular** is a community/meetup theme that ships as two parallel
implementations: this repo (Astro) and the sibling repo `hugo-theme-popular`
(Hugo). Both implement the same design, content model, and demos. A written
contract (`PARITY.md`) plus `scripts/sync-shared.sh --check` keep them from
drifting. If the sibling repo is checked out next to this one, many changes
here must be mirrored there (see "Parity rules" below).

## The single most important thing to know

`src/` holds the **active site**, which is a *copy* produced by demo
activation. The real sources for the demos live in `demos/<name>/`
(aquarium, foodie, kdrama, plus `superfan`: Truly Madly Riley, a fictional
personal site demonstrating individual use; it has no Hugo twin, see
PARITY.md). Running:

```bash
npm run demo:aquarium   # or demo:foodie / demo:kdrama / demo:superfan
```

copies that demo's `config.ts`, `content/`, and `images/` over `src/config.ts`,
`src/content/`, and `public/images/`. Consequences:

- To change a demo, edit `demos/<name>/**`, then re-run `npm run demo:<name>`
  to see it. Edits made only under `src/` are lost on the next activation.
- If a change "mysteriously" does not appear, check whether `src/` is just a
  stale activation copy. `src/config.ts` should be identical to the activated
  demo's `config.ts`.
- When editing shared config shape (NAV, FOOTER, BRAND), apply the same edit to
  `src/config.ts` **and** all four `demos/*/config.ts`.

## Commands

```bash
npm install
npm run dev            # dev server for the active site in src/
npm run build          # builds to dist/
npm run demo:<name>    # activate a demo (copies into src/, see above)
```

To bulk-populate events and speakers from a Sessionize event, run
`python3 scripts/sessionize-import.py --url <sessionize view/All endpoint> --site .`
(or `scripts/spreadsheet-import.py --xlsx <workbook>` for spreadsheet-based
planning; both share the same conventions) instead of writing the files by hand (never overwrites existing files).

`dist/` and `.astro/` are generated; never hand-edit them.
`public/` here is **source** (static assets, shared scripts), unlike Hugo
where `public/` is build output.

## Parity rules (important)

- `src/styles/**` and `public/scripts/**` must stay **byte-identical** with
  `hugo-theme-popular/assets/css/**` and `assets/js/**`. After editing either
  side, copy to the other repo and run `bash scripts/sync-shared.sh --check`
  (image drift is known and tolerated).
- New shared JS files must be registered in three places: a `<script>` tag in
  `src/layouts/BaseLayout.astro`, the bundle in hugo-theme-popular's
  `layouts/_default/baseof.html`, and the file table in both `PARITY.md`s.
- Component changes usually need an equivalent change in the mapped Hugo
  template; the mapping table is in `PARITY.md`.
- The content model is zod-validated in `src/content.config.ts`; if you add a
  front matter field, update the schema, both `PARITY.md`s, and the Hugo side.

## Adding content

Front matter is YAML (`---`). Key content types (full schema in
`src/content.config.ts` and `PARITY.md`):

- **Blog post** (`content/blog/*.md`): `title`, `date`, `authors: ["slug"]`
  (matching `content/authors/<slug>.md`), `description`, `image`, `tags`.
- **Event** (`content/events/*.md`): `title`, `date`, `image`, plus venue fields.
- **Organizer** (`content/organizers/*.md`): `title`, `weight`, `role`, `photo`,
  `description`, `social` list (`label`, `icon`, `url`).
- **Speaker** (`content/speakers/*.md`): same shape as authors; events reference
  them via `speakers: ["slug"]`.
- **Venue** (`content/venues/*.md`): `title`, `address`, `notes` (arrival
  instructions, inherited by events), `accessibility`, `website`; events
  reference one via `venueRef: "slug"`.

Image paths are **root-absolute** (`/images/post-1.png`), both in front matter
and in markdown bodies. The theme's links assume deployment at a domain root.
Put an italic line right after a body image for a caption.

Remember: add demo content under `demos/<name>/content/`, not only `src/`.

## Configuration knobs

- `NAV` supports one level of nesting via a `children` array on an item;
  it renders as a dropdown (see `src/components/Header.astro`).
- `BRAND` drives all colors/fonts; `BaseLayout.astro` emits an `html:root`
  override. Keep the `html:root` selector: since Astro 7, the bundled token CSS
  is injected after the inline override, and plain `:root` would lose the
  specificity tie and revert the site to the theme's default palette.
- `FOOTER` takes `tagline`, optional `credit: { label, url }`, and `columns`.

## Naming conventions

- Config keys, component props, and frontmatter fields must be descriptive
  words, never single letters or cryptic abbreviations. A reader should
  understand a key without opening the component that consumes it. Example:
  the `HOME.stats` entries use `value` and `label` (renamed from the old
  `n` and `l`; do not reintroduce short forms like these).
- The same applies to `STRINGS` keys, CSS custom properties, and JS `data-*`
  hooks: name for meaning, and keep the names identical across both repos
  since the key names are part of the parity contract.

## Internationalization (UI strings)

- Never hardcode user-facing text in components/pages. Add a key to `STRINGS`
  in every config (`src/config.ts` + all `demos/*/config.ts`) and use
  `STRINGS.key`; add the same key to hugo-theme-popular's `i18n/en.toml`
  (the key sets must match, see PARITY.md).
- Dates: always `toLocaleDateString(SITE.locale, ...)`, never a hardcoded
  `'en-US'`. `SITE.locale` also drives `<html lang>`.
- Shared JS must stay language-free; pass text via `data-*` attributes on
  `<body>` (see `data-copy-label` / `data-checklist-done` in BaseLayout).
- Site owners translate by editing `STRINGS` and `SITE.locale` in `config.ts`.

## CI checks

- `.github/workflows/image-alt.yml` activates and builds each demo and fails if
  any `<img>` lacks a non-empty `alt` attribute, or any markdown image is
  written as `![](...)`. Always give images meaningful alt text (image captions
  go in an italic line after the image, not in `alt`).
- `.github/workflows/helper-tests.yml` runs the Python helper-script tests
  (`python3 -m unittest discover -s scripts/tests`); run them after touching
  anything in `scripts/`.

## Writing style for content and docs

- No em dashes anywhere; use a comma or a colon instead.
- Demo copy must identify the framework: "an Astro demo site", never just
  "a demo site". (The Hugo repo says "a Hugo demo site".)
- All demo/example content is fictional; every outbound link in demo content
  points to `example.com`. Do not add real organizations or people. Exception:
  license attribution must keep its real links (the Code of Conduct credits
  the Django CoC and Geek Feminism template, as CC-BY requires).
- The theme credit is "Popular. An Astro theme by Mariatta." linking to
  https://mariatta.ca (set per site via `FOOTER.credit`).
