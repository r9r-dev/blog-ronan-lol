# UI Refresh — Maggie Appleton-faithful redesign

Status: drafted 2026-05-04.

## Goal

Redesign ronan.lol to match maggieappleton.com's rhythm and information architecture while staying in dark mode. Current site already references Maggie at the visual-system level (palette, three-column grid, Fraunces) but uses small body type, heavy card chrome, and a single content type. The refresh enlarges typography, splits content into two distinct sections, and aligns layout exactly with Maggie's responsive behavior.

## Non-goals

- Light mode (kept dark)
- Backend, API, or runtime cache (still pure static)
- Full content overhaul (existing 4 posts migrate as-is)

## Decisions log

| Topic | Decision |
|---|---|
| Color mode | Stay dark (warm dark palette retained) |
| Display font | Canela Deck (commercial, extracted from macOS system font) |
| Body font | Canela Text (commercial, same source) |
| Sans font | Lato (Google Fonts, free) — used for nav, eyebrows, meta, h3-as-label |
| Layout | Match Maggie precisely: full-bleed page chrome, asymmetric left-anchored body on posts, fixed-width body that does not shrink before viewport forces it |
| Routing | Two main routes: `/jardin` (digital garden) and `/articles` (finished pieces). Home is a two-column landing routing to both. |
| Content split | Two folders: `posts/garden/`, `posts/articles/`. Existing 4 posts migrate to `posts/garden/`. |
| Schema | Add optional `growthStage` (seedling / budding / evergreen) and `lastTended` (date) to frontmatter, used by garden only |
| Brand | Drop hand-drawn SVG. Plain text "~ ronan ~" in italic Canela |
| Drop cap | Removed |
| Blockquote | Replaced by quote-card component (avatar + author + date + curly-quoted body), no left color bar |
| Sidenotes | Tufte-style: numeric ref inline, full text on right rail, drops inline at narrow widths |
| TOC | Left rail when wide, collapsible card on top when narrow |
| Footer | Keep current structure, adapt to new tokens |
| Search | Reskin existing Pagefind page, no behavior change |
| Licensing | Canela served via @font-face under user's accepted personal-use risk (see Risks section) |

## Visual system

### Palette tokens

Retained from current `global.css` with body color slightly cooler:

```
--bg:             #1c1b18
--bg-soft:        #252420
--bg-card:        #2a2925
--rule:           #3a3835
--rule-soft:      #2f2e2a

--ink:            #d8d4cc
--ink-strong:     #f1ede4
--ink-soft:       #9b9892
--ink-quiet:      #6b6863

--crimson:        #e85aab   /* primary accent, links */
--bright-crimson: #ff7ac4   /* hover */
--salmon:         #ff9a8a
--sea-blue:       #2bc4da   /* secondary accent, sidenote refs */
--gold:           #ffd09c   /* garden accent */
--purple:         #9b7fd9
--orange:         #ff9d3f   /* quote-card avatar default */
```

### Type stack

```
--canela:      "Canela Deck", "Fraunces", Georgia, serif
--canela-text: "Canela Text", "Source Serif 4", Georgia, serif
--lato:        "Lato", -apple-system, BlinkMacSystemFont, system-ui, sans-serif
--mono:        "JetBrains Mono", "SF Mono", "Menlo", monospace
```

Body sets `font-family: var(--canela-text)` at 19px / line-height 1.65.

### Scale

| Role | Size | Family / weight |
|---|---|---|
| Hero h1 (home) | clamp(3.5rem, 7vw, 6.5rem) | Canela Deck 400 |
| Page h1 (jardin / articles) | clamp(3rem, 6vw, 5.5rem) | Canela Deck 600 |
| Article h1 | clamp(2.75rem, 5vw, 4.5rem) | Canela Deck 600 |
| Article h2 | clamp(2rem, 3vw, 2.75rem) | Canela Deck 100 (light) |
| Card title (h3) | 1.4375rem | Canela Deck 500 |
| Body p | 1.1875rem (19px) / lh 1.7 | Canela Text 300 |
| Article dek | clamp(1.25rem, 1.6vw, 1.5rem) | Canela Text 300, non-italic |
| Sidenote / card excerpt | 1rem / lh 1.55 | Canela Text 300 |
| Eyebrow / label | 0.75-0.875rem, uppercase, letter-spacing 0.16em, weight 700 | Lato |
| Code | 0.85em-0.92em | JetBrains Mono |

`em` uses italic (Canela Text 300 italic). `strong` uses Canela Text 600.

### Spacing rhythm

4pt base. Variables `--s-1` through `--s-10` from current system retained.

Article body: `> * + * { margin-top: 1.25rem }`. h2 has `margin-top: 3.5rem`. h3 (label-style): `margin-top: 2.25rem`. Pretty rule (❦) at 4rem block margin.

### Layout tokens

```
--gutter:     clamp(1rem, 4vw, 3rem)
--measure:    38rem    /* article body, ~64ch in Canela Text @ 19px */
--rail-toc:   14rem
--rail-notes: 18rem
--col-gap:    3rem
```

Width math: `gutter*2 + toc + body + notes + col-gap*2 = 96 + 224 + 608 + 288 + 96 = 1312px`. 3-col mode requires viewport ≥ 1340px to leave buffer.

## Layout system

### Article post page

A single CSS grid contains header + TOC rail + body + notes rail. Header lives in the body column so its eyebrow/h1/dek/meta align flush-left with the body.

**Responsive breakpoints**, in order of which rail collapses first:

1. **≥ 1340px** — three columns: `[TOC] [BODY] [NOTES]`. Body fixed at `--measure`. TOC and notes are sticky.
2. **1024-1339px** — two columns: `[TOC] [BODY]`. Notes rail moves to grid row 3, beneath body, full-width up to `--measure`.
3. **< 1024px** — single column. TOC becomes a collapsible card above the body. Body expands up to `--measure`. Notes remain inline below body.

Body width does not shrink before reaching the 1024 breakpoint; only the rails dissolve around it. That is the core of "take all space available" without sacrificing legibility.

### Page chrome

Nav, page headers (jardin / articles), grid sections all stretch edge-to-edge with `--gutter` on each side. There is no `--content-max` cap — full bleed at every viewport.

### Index pages (`/jardin`, `/articles`)

Page header is left-anchored, capped at 56rem. Content beneath fills viewport width minus gutters. Filter bar uses sticky bordered band. Grid uses `repeat(auto-fill, minmax(min(20rem, 100%), 1fr))` so cards reflow at any width.

## Routing

| Route | Purpose | Renders |
|---|---|---|
| `/` | Home / landing | Hero + two-column landing (recent garden items left, recent articles right) |
| `/jardin` | Digital Garden index | Page header + topic filter + growth-stage filter + card grid |
| `/jardin/[slug]` | Single garden item | 3-col article post layout |
| `/articles` | Articles index | Page header + topic filter + 3-col list (no thumbnails) |
| `/articles/[slug]` | Single article | 3-col article post layout |
| `/tags/[tag]` | Tag page | List of posts (both folders) bearing the tag, mixed |
| `/tags` | Tag index | List of all tags with counts |
| `/search` | Pagefind search | Reskinned existing page |
| `/404` | Not found | Reskinned existing page |
| `/rss.xml` | RSS feed | Both folders combined, sorted by date |

Slugs derive from filename (existing collection loader behavior, base path adjusted per folder).

## Content model

### Folder split

```
posts/
├─ garden/
│  ├─ <existing-2024-01-15-typescript>/
│  ├─ <existing-2024-02-20-microservices>/
│  ├─ <existing-2024-03-10-react-hooks>/
│  └─ <existing-2025-09-06>/
└─ articles/
```

All 4 existing posts migrate to `posts/garden/` (decision: user prefers garden as default for legacy content).

### Schema (Zod)

```ts
const baseSchema = {
  title: z.string(),
  author: z.string().default('Ronan'),
  date: z.coerce.date(),
  tags: tagSchema.optional().default([]),
  excerpt: z.string().optional(),
  draft: z.boolean().optional().default(false),
};

const garden = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './posts/garden' }),
  schema: z.object({
    ...baseSchema,
    growthStage: z.enum(['seedling', 'budding', 'evergreen']).optional().default('seedling'),
    lastTended: z.coerce.date().optional(),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './posts/articles' }),
  schema: z.object({
    ...baseSchema,
    type: z.string().optional().default('Article'),  // Article | Essai | Note de lecture
    readTime: z.number().optional(),
  }),
});

export const collections = { garden, articles };
```

`type` field on the existing schema becomes `articles`-only and is repurposed for the eyebrow label. Garden uses `growthStage` instead.

## Components

### Nav

`<Navbar>` — flex row, full-bleed.
- Brand: text "~ ronan ~" italic Canela Deck 500, crimson, links to `/`.
- Links: Jardin (gold when active) / Articles (crimson when active) / Recherche / À propos.
- No inline search input. Search lives at `/search`.

### Footer

Keep current Footer.astro structure (headline + RSS pill + nav lists + copyright + meta). Repaint with new tokens. Headline uses Canela Deck italic.

### `<HomeLanding>`

Two-column section under hero:
- Left col: `🌿 Jardin Numérique` eyebrow (gold), h2, dek, list of 3 most recent garden items, "Voir tout le jardin →" CTA
- Right col: `❦ Articles` eyebrow (crimson), h2, dek, list of 3 most recent articles, "Tous les articles →" CTA
- Each list item: meta line + title + optional excerpt, separated by 1px rule
- Below 760px: stacks to single column

### `<GardenCard>`

Used on `/jardin` and home left col.
- Thumbnail slot (16:10 aspect ratio): if frontmatter `cover` provided, use it; otherwise gradient fallback w/ deterministic hue
- Eyebrow: stage glyph + topic
- Title (Canela Deck 500, ~1.44rem)
- Excerpt (Canela Text 300, ~1rem) — truncate to ~3 lines
- Meta footer: "Planté il y a X · arrosé Y" (or just "Planté X" if no `lastTended`)

### `<ArticleItem>`

Used on `/articles` and home right col. No thumbnail.
- Eyebrow: ❦ glyph + type + "X min"
- Title (Canela Deck 500)
- Optional excerpt (truncate ~3 lines)
- Date in absolute form

### `<TocRail>`

Existing component, refactored:
- Wide (≥ 1024px): sticky left rail, label "Sommaire" + decimal-leading-zero numbered list
- Narrow: rendered as `<details>` with summary "Table des matières", collapsed by default
- Active link follows IntersectionObserver scrollspy (already implemented)

### `<NotesRail>`

New component. Receives sidenote definitions from frontmatter or inline directives. Renders:
- Wide (≥ 1340px): sticky right rail, each note in left-bordered block
- Narrow: drops inline below body, prefixed with "Notes & sources" label

Each note: numeric tag (sea-blue Lato) + body (Canela Text). Body can contain links and inline code.

Sidenote refs in body: `<sup class="sidenote-ref"><a href="#nN">N</a></sup>`.

### `<QuoteCard>`

Replaces decorated blockquote.
- Container: `--bg-card` background, 1px `--rule-soft` border, 0.6rem radius, padding 1.25/1.5rem, soft shadow
- Head: 1.6rem rounded avatar (initial letter on colored square — orange default, or per-quote color), author name (Canela Text 600), separator dot, when (Canela Text quiet)
- Body: Canela Text 1.0625rem with curly quotes via `::before` / `::after` `content: open-quote / close-quote`

Plain markdown `> blockquote` continues to render as a simple `<blockquote>` styled as a head-less quote-card (just body + curly quotes). Rich quote cards require MDX usage.

### `<PrettyRule>`

Centered ❦ glyph in sea-blue, letter-spacing 0.6em. Replaces `<hr>` element in markdown post-style via existing rendering.

## Markdown + MDX

Add `@astrojs/mdx` integration. Keep `.md` files working unchanged. New `.mdx` files in either folder can import and use components:

```mdx
---
title: "..."
growthStage: evergreen
---

import { Quote, Sidenote } from '~/components/post';

<Sidenote num={1}>
  Cette nuance n'est pas évidente dans la doc officielle.
</Sidenote>

The quote below uses a card.

<Quote author="dan_abramov" avatar="D" avatarColor="orange" date="15 fév 2026">
  L'illusion d'une closure fraîche est ce qui rend ces bugs si pernicieux.
</Quote>
```

`<Sidenote>` registers the note text and renders the inline ref where invoked; the layout collects notes for the right rail. Implementation: a context-style array passed via Astro slot or via remark plugin reading children before render. Simplest first version: declare notes manually in frontmatter and refer to them by id; iterate to component-driven later if needed.

For the first iteration, ship:
- `<Quote>` MDX component (drop-in)
- Sidenotes via frontmatter `notes: { 1: "...", 2: "..." }` + manual `<sup>` refs in body. Works in both `.md` and `.mdx`.

## Asset pipeline

### Fonts

- `public/fonts/CanelaDeck-Light.woff2`
- `public/fonts/CanelaDeck-Regular.woff2`
- `public/fonts/CanelaDeck-SemiBold.woff2`
- `public/fonts/CanelaText-Light.woff2`
- `public/fonts/CanelaText-LightItalic.woff2`
- `public/fonts/CanelaText-Regular.woff2`

Extracted from `/System/Library/AssetsV2/com_apple_MobileAsset_Font8/.../CanelaDeck.ttc` and `CanelaText.ttc`. Conversion pipeline:

1. Copy `.ttc` to a working dir
2. Use `fonttools` (`pip install fonttools brotli`) to split TTC into individual TTFs: `from fontTools.ttLib import TTCollection; TTCollection(...).save_individual()`
3. Convert each TTF to WOFF2: `from fontTools.ttLib.woff2 import compress; compress(in, out)` or via `woff2_compress` CLI

`@font-face` declarations live in `global.css`, with `font-display: swap` and `unicode-range` limited to Latin Extended for size.

Lato comes from Google Fonts via existing preconnect pattern.

### Cover images for garden

Optional per-post: `cover: cover.png` in frontmatter, file colocated in post folder, processed by Astro image pipeline. When absent, gradient fallback applies.

## Risks

- **Font licensing.** Canela is sold by Commercial Type. Apple bundles it under a system catalog license that does not authorize web embedding. Serving it via @font-face on a public site is technically unlicensed redistribution. The user has accepted the risk knowing the site is personal and traffic is minimal. Mitigation: if a takedown arrives, swap to `Fraunces` (already in fallback list) and `Source Serif 4` for body. The `--canela` and `--canela-text` vars in tokens make this a one-line change.
- **Body width tradeoff.** Fixing body at 38rem means at 1024-1339px there is significant whitespace right of the body. This is intentional — Maggie's signature.
- **Sidenote ergonomics on touch.** Tufte-style sidenotes assume mouse hover or wide viewport. On mobile, refs become tap targets that scroll to the inline notes block at the bottom. This is acceptable for a reading site.

## Migration plan (preview)

1. Move all 4 existing posts to `posts/garden/`. Add `growthStage: evergreen` to each (as default for legacy content).
2. Update `content.config.ts` to two collections.
3. Add `@astrojs/mdx` integration.
4. Extract fonts from system .ttc files; place in `public/fonts/`.
5. Rewrite `global.css` tokens, scale, layout grid; remove drop-cap, card cover gradient, monogram, brand SVG references.
6. Build new `pages/jardin/index.astro`, `pages/jardin/[...slug].astro`, `pages/articles/index.astro`, `pages/articles/[...slug].astro`.
7. Refactor `pages/index.astro` to two-column landing.
8. Build new components: `HomeLanding`, `GardenCard`, `ArticleItem`, `QuoteCard`, `NotesRail`. Refactor `Navbar`, `TocRail`, `Footer`.
9. Update RSS to merge both collections; update tag pages to query both.
10. Reskin `pages/search.astro` and `pages/404.astro`.
11. Update `nginx.conf` cache rules if `/fonts/` path needs aggressive caching.
12. Smoke-test locally + via `bun run build && bun run preview`.

Detailed implementation plan to be produced via the writing-plans skill after this spec is approved.
