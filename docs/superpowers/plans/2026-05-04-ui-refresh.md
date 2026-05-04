# UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign ronan.lol to match maggieappleton.com's rhythm and information architecture while staying in dark mode, with two routed sections (`/jardin`, `/articles`), Canela Deck/Text + Lato fonts, and a 3-col responsive article layout with sidenote rail.

**Architecture:** Astro 6 static site, content split into two collections (`garden`, `articles`) by folder, MDX added for component-driven posts, fonts self-hosted (Canela extracted from macOS system catalog, Lato from Google Fonts), responsive grid with three breakpoints (1340 / 1024 / mobile) for the article layout.

**Tech Stack:** Astro 6, Bun 1.3, MDX (`@astrojs/mdx`), Vitest (utility tests), Pagefind (search), Shiki (code), `fonttools` (Python — font extraction).

**Spec:** `docs/superpowers/specs/2026-05-04-ui-refresh-design.md`

---

## File map

**New files**
- `scripts/extract-fonts.py` — converts macOS Canela `.ttc` to per-style `.woff2`
- `public/fonts/CanelaDeck-Light.woff2`, `CanelaDeck-Regular.woff2`, `CanelaDeck-SemiBold.woff2`
- `public/fonts/CanelaText-Light.woff2`, `CanelaText-LightItalic.woff2`, `CanelaText-Regular.woff2`
- `src/utils/growthStage.ts` — formatter + glyph map
- `src/utils/growthStage.test.ts`
- `src/utils/relativeDate.test.ts`
- `src/components/QuoteCard.astro`
- `src/components/Sidenote.astro`
- `src/components/NotesRail.astro`
- `src/components/GardenCard.astro`
- `src/components/ArticleItem.astro`
- `src/components/HomeLanding.astro`
- `src/pages/jardin/index.astro`
- `src/pages/jardin/[...slug].astro`
- `src/pages/articles/index.astro`
- `src/pages/articles/[...slug].astro`
- `vitest.config.ts`
- `posts/garden/`, `posts/articles/` — folders

**Modified**
- `package.json` — add `@astrojs/mdx`, `vitest`, scripts
- `astro.config.mjs` — register MDX integration
- `src/content.config.ts` — two collections
- `src/styles/global.css` — full repaint
- `src/components/Brand.astro` — plain text "~ ronan ~"
- `src/components/Navbar.astro` — new link set, drop search input
- `src/components/Footer.astro` — token reskin
- `src/components/TocRail.astro` — collapsible at narrow widths
- `src/layouts/BaseLayout.astro` — font preload
- `src/layouts/PostLayout.astro` — new grid w/ NotesRail
- `src/pages/index.astro` — two-column landing
- `src/pages/tags/[tag].astro` — query both collections
- `src/pages/tags/index.astro` — query both collections
- `src/pages/rss.xml.js` — merge both collections
- `src/pages/search.astro` — token reskin
- `src/pages/404.astro` — token reskin
- `nginx.conf` — long cache for `/fonts/`
- `src/utils/relativeDate.ts` — add `formatPlantedTended`

**Moved**
- `posts/2024-01-15-typescript/` → `posts/garden/2024-01-15-typescript/`
- `posts/2024-02-20-microservices/` → `posts/garden/2024-02-20-microservices/`
- `posts/2024-03-10-react-hooks/` → `posts/garden/2024-03-10-react-hooks/`
- `posts/2025-09-06/` → `posts/garden/2025-09-06/`

**Deleted**
- `src/pages/[...slug].astro` (replaced by section-specific routes)
- `src/components/MetaRail.astro` (replaced by NotesRail; right-rail meta moves into article header)
- `src/components/PostCard.astro` (replaced by GardenCard + ArticleItem)
- `src/utils/cover.ts` (no longer used — gradient covers go via inline CSS in GardenCard)

---

## Phase 0 — Setup

### Task 0.1: Add MDX + Vitest

**Files:** `package.json`, `astro.config.mjs`, `vitest.config.ts` (create)

- [ ] **Step 1: Install deps**

```bash
bun add @astrojs/mdx
bun add -d vitest @types/node
```

Expected: `package.json` updated with new entries; `bun.lockb` regenerated.

- [ ] **Step 2: Register MDX in `astro.config.mjs`**

Replace the file with:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://ronan.lol',
  trailingSlash: 'never',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'rose-pine-moon',
      wrap: true,
    },
  },
  build: {
    format: 'directory',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 4: Add `test` script to `package.json`**

In the `scripts` object, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify build still passes**

```bash
bun run build
```

Expected: build completes without error. Old slug routes still render (we haven't moved posts yet).

- [ ] **Step 6: Commit**

```bash
git add package.json bun.lockb astro.config.mjs vitest.config.ts
git commit -m "chore: add MDX integration and Vitest"
```

---

## Phase 1 — Fonts

### Task 1.1: Write font extraction script

**Files:** `scripts/extract-fonts.py` (create)

- [ ] **Step 1: Create the script**

```python
#!/usr/bin/env python3
"""
Extract Canela Deck and Canela Text from macOS system .ttc files
and emit .woff2 files into public/fonts/.

Requires: pip install fonttools brotli
"""

import os
import sys
from pathlib import Path
from fontTools.ttLib import TTFont, TTCollection
from fontTools.ttLib.woff2 import compress

# macOS Apple-bundled Canela paths (validated 2026-05-04 on Darwin 25.4.0)
CANELA_DECK_TTC = Path('/System/Library/AssetsV2/com_apple_MobileAsset_Font8/da24bc1aaf401b7c6b06ee39b4d3891cfcc0b6dc.asset/AssetData/CanelaDeck.ttc')
CANELA_TEXT_TTC = Path('/System/Library/AssetsV2/com_apple_MobileAsset_Font8/9fc2ae4384380361a3bccc581eda12aa8ceca958.asset/AssetData/CanelaText.ttc')

# Map from PostScript / family name patterns -> output filename stem
DECK_WANTED = {
    'CanelaDeck-Light': 'CanelaDeck-Light',
    'CanelaDeck-Regular': 'CanelaDeck-Regular',
    'CanelaDeck-Semibold': 'CanelaDeck-SemiBold',
    'CanelaDeck-SemiBold': 'CanelaDeck-SemiBold',
}
TEXT_WANTED = {
    'CanelaText-Light': 'CanelaText-Light',
    'CanelaText-LightItalic': 'CanelaText-LightItalic',
    'CanelaText-Regular': 'CanelaText-Regular',
    'CanelaText-Medium': 'CanelaText-Regular',  # fallback if Regular absent
}

OUT_DIR = Path(__file__).resolve().parent.parent / 'public' / 'fonts'


def ps_name(font: TTFont) -> str:
    name_table = font['name']
    rec = name_table.getName(6, 3, 1) or name_table.getName(6, 1, 0)
    return str(rec) if rec else ''


def emit(ttc_path: Path, wanted: dict[str, str]) -> int:
    if not ttc_path.exists():
        print(f'  missing: {ttc_path}', file=sys.stderr)
        return 0
    coll = TTCollection(str(ttc_path))
    written = 0
    seen = set()
    for font in coll.fonts:
        ps = ps_name(font)
        if ps in wanted and wanted[ps] not in seen:
            stem = wanted[ps]
            out = OUT_DIR / f'{stem}.woff2'
            tmp_ttf = OUT_DIR / f'{stem}.ttf'
            font.flavor = None
            font.save(str(tmp_ttf))
            compress(str(tmp_ttf), str(out))
            tmp_ttf.unlink()
            seen.add(stem)
            written += 1
            print(f'  {ps} -> {out.name}')
    return written


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print('Extracting Canela Deck:')
    n1 = emit(CANELA_DECK_TTC, DECK_WANTED)
    print('Extracting Canela Text:')
    n2 = emit(CANELA_TEXT_TTC, TEXT_WANTED)
    total = n1 + n2
    print(f'\nWrote {total} font files to {OUT_DIR}')
    return 0 if total >= 4 else 1


if __name__ == '__main__':
    sys.exit(main())
```

- [ ] **Step 2: Make executable**

```bash
chmod +x scripts/extract-fonts.py
```

### Task 1.2: Run extraction

- [ ] **Step 1: Install Python deps in a throwaway venv**

```bash
python3 -m venv /tmp/font-extract-venv
source /tmp/font-extract-venv/bin/activate
pip install fonttools brotli
```

- [ ] **Step 2: Run script**

```bash
python3 scripts/extract-fonts.py
```

Expected output lists at least 4 fonts written: `CanelaDeck-Regular.woff2`, `CanelaDeck-Light.woff2`, `CanelaText-Regular.woff2`, `CanelaText-LightItalic.woff2` (more if available).

- [ ] **Step 3: Verify file sizes**

```bash
ls -la public/fonts/
```

Expected: each `.woff2` file is ~30-100 KB. Empty or tiny files indicate extraction failure.

- [ ] **Step 4: Deactivate venv**

```bash
deactivate
```

- [ ] **Step 5: Commit fonts + script**

```bash
git add scripts/extract-fonts.py public/fonts/
git commit -m "feat(fonts): extract Canela Deck and Canela Text from macOS system catalog"
```

### Task 1.3: Wire fonts into CSS

**Files:** `src/styles/global.css` — top of file only (full token rewrite happens in Phase 3)

- [ ] **Step 1: Insert `@font-face` block at top of `global.css`**

Add immediately after the leading comment block, before `:root`:

```css
/* ─── self-hosted fonts ─── */
@font-face {
  font-family: 'Canela Deck';
  src: url('/fonts/CanelaDeck-Light.woff2') format('woff2');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Canela Deck';
  src: url('/fonts/CanelaDeck-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Canela Deck';
  src: url('/fonts/CanelaDeck-SemiBold.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Canela Text';
  src: url('/fonts/CanelaText-Light.woff2') format('woff2');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Canela Text';
  src: url('/fonts/CanelaText-LightItalic.woff2') format('woff2');
  font-weight: 300;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: 'Canela Text';
  src: url('/fonts/CanelaText-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

- [ ] **Step 2: Update Google Fonts link in `BaseLayout.astro`**

In `src/layouts/BaseLayout.astro`, replace the existing `<link rel="stylesheet" ...>` for fonts with:

```html
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
    />
```

(Drop Fraunces and Source Serif 4 — Canela replaces them.)

- [ ] **Step 3: Verify dev server loads fonts**

```bash
bun run dev &
sleep 3
playwright-cli open http://localhost:4321/
playwright-cli --raw eval "JSON.stringify({h: getComputedStyle(document.querySelector('h1')).fontFamily, b: getComputedStyle(document.body).fontFamily})"
playwright-cli close
kill %1
```

Expected: returned font families list `Canela Deck` and `Lato`.

(Acceptable failure path: font fallback used if @font-face URLs 404 — fix by re-checking Step 1 paths.)

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css src/layouts/BaseLayout.astro
git commit -m "feat(fonts): wire @font-face for Canela, switch Google Fonts to Lato"
```

---

## Phase 2 — Content split

### Task 2.1: Move existing posts

- [ ] **Step 1: Create folders**

```bash
mkdir -p posts/garden posts/articles
```

- [ ] **Step 2: Move all 4 existing posts**

```bash
git mv posts/2024-01-15-typescript posts/garden/2024-01-15-typescript
git mv posts/2024-02-20-microservices posts/garden/2024-02-20-microservices
git mv posts/2024-03-10-react-hooks posts/garden/2024-03-10-react-hooks
git mv posts/2025-09-06 posts/garden/2025-09-06
```

- [ ] **Step 3: Add `growthStage: evergreen` to each frontmatter**

For each `.md` file in `posts/garden/*/`, add a `growthStage: evergreen` line in the frontmatter block. Example for `posts/garden/2024-01-15-typescript/index.md` (open and modify only the YAML frontmatter at top):

```yaml
---
title: "..."           # existing
date: 2024-01-15       # existing
tags: [...]            # existing
excerpt: "..."         # existing
type: "..."            # existing — leave or remove (now ignored for garden)
growthStage: evergreen
---
```

Repeat for the other three posts.

- [ ] **Step 4: Verify nothing broken at file level**

```bash
git status
ls posts/garden/
```

Expected: 4 directories under `posts/garden/`, each with their `.md` file. `posts/articles/` empty.

### Task 2.2: Update content.config.ts

**Files:** `src/content.config.ts`

- [ ] **Step 1: Replace file content**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tagSchema = z.union([
  z.array(z.string()),
  z.string().transform((s) => s.split(',').map((t) => t.trim()).filter(Boolean)),
]);

const baseSchema = {
  title: z.string(),
  author: z.string().default('Ronan'),
  date: z.coerce.date(),
  tags: tagSchema.optional().default([]),
  excerpt: z.string().optional(),
  draft: z.boolean().optional().default(false),
  cover: z.string().optional(),
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
    type: z.string().optional().default('Article'),
    readTime: z.number().optional(),
  }),
});

export const collections = { garden, articles };
```

- [ ] **Step 2: Build will fail until pages updated. Commit checkpoint anyway:**

```bash
git add posts/ src/content.config.ts
git commit -m "feat(content): split posts into garden and articles collections"
```

The build is intentionally broken at this commit — it's a checkpoint. Phase 6 fixes routing.

---

## Phase 3 — Visual tokens (CSS)

### Task 3.1: Replace `:root` tokens

**Files:** `src/styles/global.css`

- [ ] **Step 1: Replace the existing `:root { ... }` block** (between the two comment dividers `/* ───────── tokens ───────── */` and the next `/* ───────── reset ───────── */`) with:

```css
:root {
  /* surfaces — keep dark, slightly cooler */
  --color-bg:           #1c1b18;
  --color-bg-soft:      #252420;
  --color-bg-tinted:    #3a3835;
  --color-bg-card:      #2a2925;
  --color-bg-aside:     #2a2925;
  --color-rule:         #3a3835;
  --color-rule-soft:    #2f2e2a;

  /* ink */
  --color-text:         #d8d4cc;
  --color-text-strong:  #f1ede4;
  --color-text-soft:    #9b9892;
  --color-text-quiet:   #6b6863;

  /* accents — unchanged */
  --color-crimson:        #e85aab;
  --color-bright-crimson: #ff7ac4;
  --color-salmon:         #ff9a8a;
  --color-dark-salmon:    #fd8370;
  --color-sea-blue:       #2bc4da;
  --color-medium-sea-blue:#04a5bb;
  --color-dark-sea-blue:  #008ba3;
  --color-gold:           #ffd09c;
  --color-purple:         #9b7fd9;
  --color-orange:         #ff9d3f;

  /* roles */
  --color-link:           var(--color-crimson);
  --color-link-hover:     var(--color-bright-crimson);
  --color-accent:         var(--color-sea-blue);
  --color-eyebrow:        var(--color-crimson);

  /* type */
  --font-display: 'Canela Deck', 'Fraunces', Georgia, serif;
  --font-body:    'Canela Text', 'Source Serif 4', Georgia, serif;
  --font-sans:    'Lato', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'SF Mono', 'Menlo', monospace;

  /* fluid type scale (bigger overall — Maggie-faithful) */
  --t-xs:    0.75rem;
  --t-sm:    0.875rem;
  --t-base:  1.1875rem;        /* 19px body */
  --t-md:    1.3125rem;
  --t-lg:    1.4375rem;
  --t-xl:    clamp(2rem, 3vw, 2.75rem);     /* article h2 */
  --t-2xl:   clamp(2.75rem, 5vw, 4.5rem);   /* article h1 */
  --t-3xl:   clamp(3rem, 6vw, 5.5rem);      /* page h1 */
  --t-hero:  clamp(3.5rem, 7vw, 6.5rem);    /* home hero */

  --lead-tight:  1.05;
  --lead-snug:   1.32;
  --lead-body:   1.7;

  /* rhythm */
  --s-1:   0.25rem;
  --s-2:   0.5rem;
  --s-3:   0.75rem;
  --s-4:   1rem;
  --s-5:   1.5rem;
  --s-6:   2rem;
  --s-7:   3rem;
  --s-8:   4.5rem;
  --s-9:   6rem;
  --s-10:  8rem;

  /* layout — full-bleed, no max chrome */
  --measure:     38rem;       /* article body, ~64ch in Canela Text 19px */
  --rail-toc:    14rem;
  --rail-notes:  18rem;
  --col-gap:     3rem;
  --gutter:      clamp(1rem, 4vw, 3rem);

  /* radius */
  --radius-sm:   0.25rem;
  --radius:      0.4rem;
  --radius-lg:   0.6rem;
  --radius-pill: 999px;

  /* shadows */
  --shadow-sm:  0 2px 8px rgba(0, 0, 0, 0.30);
  --shadow-md:  0 4px 16px rgba(0, 0, 0, 0.40);
  --shadow-lg:  0 8px 32px rgba(0, 0, 0, 0.50);

  /* motion */
  --ease:      cubic-bezier(0.22, 1, 0.36, 1);
  --t-fast:    140ms;
  --t-med:     240ms;
  --t-slow:    400ms;
}
```

- [ ] **Step 2: Update `body` rule** to use Canela Text:

Find the existing `body { ... }` rule (after the reset block). Replace `font-family: var(--font-body);` and `font-size: var(--t-base);` and `line-height: var(--lead-body);` lines with the new values (already covered by the new var definitions, so no change needed if those vars are referenced). Verify the `body` rule still reads:

```css
body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--t-base);
  line-height: var(--lead-body);
  font-feature-settings: "kern", "liga", "onum";
  font-optical-sizing: auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  hanging-punctuation: first last;
  min-height: 100vh;
}
```

Remove the `background-image: radial-gradient(...)` and `background-attachment: fixed` lines — Maggie-faithful is flat dark, no ambient gradient.

- [ ] **Step 3: Remove `.post-content > p:first-of-type::first-letter` (drop cap rule)**

Search for that selector in `global.css` and delete the entire rule block (about 9 lines).

- [ ] **Step 4: Build check (will still fail because routing not updated, but CSS itself should not error)**

```bash
bun run dev &
sleep 3
curl -s http://localhost:4321/ -o /dev/null -w "%{http_code}\n"
kill %1
```

Expected: HTTP code is 500 (page renders error because old `[...slug].astro` still references old collection). That's fine. CSS compiles.

### Task 3.2: Article post layout (responsive grid)

**Files:** `src/styles/global.css`

- [ ] **Step 1: Replace the existing `.post-card.post-full` block + its responsive media queries** (lines roughly between `/* ───────── single-post layout (3 columns on desktop) ───────── */` and the next major section comment) with:

```css
/* ───────── article layout (responsive grid: header + TOC + body + notes) ───────── */
.article-grid {
  display: grid;
  grid-template-columns: 1fr;
  column-gap: var(--col-gap);
  row-gap: 0;
  align-items: start;
}

/* >= 1340px : 3-col [TOC] [BODY] [NOTES]  body fixed */
@media (min-width: 1340px) {
  .article-grid {
    grid-template-columns: var(--rail-toc) var(--measure) var(--rail-notes);
  }
  .article-grid > .article-header { grid-column: 2 / 3; grid-row: 1; }
  .article-grid > .toc-rail       { grid-column: 1 / 2; grid-row: 2; }
  .article-grid > .post-content   { grid-column: 2 / 3; grid-row: 2; }
  .article-grid > .notes-rail     { grid-column: 3 / 4; grid-row: 2; }
}

/* 1024-1339px : 2-col [TOC] [BODY], notes drop below body */
@media (min-width: 1024px) and (max-width: 1339px) {
  .article-grid {
    grid-template-columns: var(--rail-toc) var(--measure);
  }
  .article-grid > .article-header { grid-column: 2 / 3; grid-row: 1; }
  .article-grid > .toc-rail       { grid-column: 1 / 2; grid-row: 2; }
  .article-grid > .post-content   { grid-column: 2 / 3; grid-row: 2; }
  .article-grid > .notes-rail     { grid-column: 2 / 3; grid-row: 3; margin-top: var(--s-7); }
}

/* < 1024px : 1-col, TOC top collapsible, notes inline below body */
@media (max-width: 1023px) {
  .article-grid > .article-header,
  .article-grid > .post-content,
  .article-grid > .notes-rail,
  .article-grid > .toc-rail { max-width: var(--measure); }
  .article-grid > .toc-rail { margin-bottom: var(--s-6); }
  .article-grid > .notes-rail { margin-top: var(--s-7); }
}

/* article header — eyebrow, h1, dek, meta */
.article-header { margin-bottom: var(--s-7); }
.article-eyebrow {
  display: flex; align-items: center; gap: var(--s-4);
  font-family: var(--font-sans);
  font-size: var(--t-sm);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: var(--s-5);
}
.article-eyebrow .type { color: var(--color-crimson); }
.article-eyebrow .stage { color: var(--color-gold); display: inline-flex; align-items: center; gap: 0.4em; }
.article-eyebrow .stage--seedling { color: var(--color-salmon); }
.article-eyebrow .stage--budding  { color: var(--color-sea-blue); }
.article-eyebrow .stage--evergreen { color: var(--color-gold); }

.article-header h1 {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--t-2xl);
  line-height: var(--lead-tight);
  letter-spacing: -0.02em;
  color: var(--color-text-strong);
  text-wrap: balance;
  margin-bottom: var(--s-5);
}
.article-dek {
  font-family: var(--font-body);
  font-style: normal;
  font-weight: 300;
  font-size: var(--t-md);
  line-height: 1.45;
  color: var(--color-text-soft);
  margin-bottom: var(--s-6);
}
.article-dek em { font-style: italic; color: var(--color-text-strong); }
.article-meta {
  display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--s-2) var(--s-5);
  padding: var(--s-4) 0;
  border-top: 1px solid var(--color-rule-soft);
  border-bottom: 1px solid var(--color-rule-soft);
  font-family: var(--font-sans);
}
.article-meta .tags { display: flex; gap: var(--s-5); flex: 1; }
.article-meta .tag {
  font-family: var(--font-sans);
  font-style: normal;
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--color-crimson);
  text-decoration: none;
}
.article-meta .tag:nth-child(5n+1) { color: var(--color-crimson); }
.article-meta .tag:nth-child(5n+2) { color: var(--color-sea-blue); }
.article-meta .tag:nth-child(5n+3) { color: var(--color-gold); }
.article-meta .tag:nth-child(5n+4) { color: var(--color-salmon); }
.article-meta .tag:nth-child(5n+5) { color: var(--color-purple); }
.article-meta .tag:hover { filter: brightness(1.2); text-decoration: underline; }
.article-meta .dates {
  font-size: var(--t-sm);
  color: var(--color-text-quiet);
  text-align: right;
  line-height: 1.5;
}
```

### Task 3.3: TOC rail + notes rail + sidenote ref styles

- [ ] **Step 1: Replace the existing `.toc-rail` block** (search for `/* ───────── TOC rail ───────── */`) with:

```css
/* ───────── TOC rail ───────── */
.toc-rail {
  font-family: var(--font-sans);
  font-size: 0.95rem;
}
.toc-rail .toc-summary { display: none; }
.toc-rail .toc-title {
  font-family: var(--font-sans);
  font-size: var(--t-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--color-text-soft);
  margin-bottom: var(--s-4);
  display: flex; align-items: center; gap: var(--s-2);
}
.toc-rail .toc-title::before {
  content: ""; width: 0.5em; height: 0.5em; border-radius: 50%; background: var(--color-accent);
}
.toc-rail ol { list-style: none; counter-reset: toc; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
.toc-rail li { counter-increment: toc; line-height: 1.4; }
.toc-rail li::before {
  content: counter(toc, decimal-leading-zero);
  color: var(--color-text-quiet);
  margin-right: 0.7em;
  font-family: var(--font-body);
  font-style: italic;
  font-size: 0.92em;
}
.toc-rail a { color: var(--color-text-soft); text-decoration: none; transition: color var(--t-fast) var(--ease); }
.toc-rail a:hover, .toc-rail a.active { color: var(--color-text-strong); }

@media (min-width: 1024px) {
  .toc-rail { position: sticky; top: 6rem; align-self: start; }
}

@media (max-width: 1023px) {
  .toc-rail {
    padding: var(--s-4) var(--s-5);
    border: 1px solid var(--color-rule-soft);
    border-radius: var(--radius);
    background: var(--color-bg-soft);
  }
  .toc-rail .toc-summary {
    display: flex; align-items: center; gap: 0.5rem;
    cursor: pointer; font-weight: 700; color: var(--color-text-strong);
    font-family: var(--font-sans); font-size: 0.95rem;
  }
  .toc-rail .toc-summary::before {
    content: "›"; color: var(--color-accent); font-size: 1.2rem;
    transition: transform 0.2s; display: inline-block;
  }
  .toc-rail.open .toc-summary::before { transform: rotate(90deg); }
  .toc-rail .toc-title { display: none; }
  .toc-rail .toc-body { display: none; margin-top: var(--s-4); }
  .toc-rail.open .toc-body { display: block; }
}

/* ───────── sidenote ref + notes rail ───────── */
.sidenote-ref {
  color: var(--color-accent);
  font-family: var(--font-sans);
  font-size: 0.7em;
  font-weight: 700;
  vertical-align: super;
  line-height: 0;
  padding: 0 0.15em;
  text-decoration: none;
}
.notes-rail {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--color-text-soft);
  line-height: 1.5;
}
.notes-rail .note {
  border-left: 1px solid var(--color-rule-soft);
  padding-left: var(--s-4);
  margin-bottom: var(--s-6);
}
.notes-rail .note .num {
  color: var(--color-accent);
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: var(--t-sm);
  margin-right: 0.6em;
}
.notes-rail .note a { color: var(--color-link); }
.notes-rail .notes-title {
  font-family: var(--font-sans);
  font-size: var(--t-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--color-text-quiet);
  margin-bottom: var(--s-4);
  display: none;
}
@media (max-width: 1339px) {
  .notes-rail .notes-title { display: block; }
  .notes-rail { padding-top: var(--s-5); border-top: 1px solid var(--color-rule-soft); }
}

/* ───────── quote card ───────── */
.quote-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-rule-soft);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem 1.5rem;
  margin-block: var(--s-6);
  box-shadow: var(--shadow-sm);
}
.quote-card .quote-head {
  display: flex; align-items: center; gap: 0.75rem;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  color: var(--color-text-soft);
  margin-bottom: 0.85rem;
}
.quote-card .avatar {
  width: 1.6rem; height: 1.6rem;
  border-radius: var(--radius-sm);
  color: white;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  font-family: var(--font-sans);
}
.quote-card .author { font-weight: 700; color: var(--color-text-strong); }
.quote-card .dot { color: var(--color-text-quiet); }
.quote-card .when { color: var(--color-text-quiet); }
.quote-card .quote-body {
  font-family: var(--font-body);
  font-size: 1.0625rem;
  line-height: 1.65;
  color: var(--color-text);
  font-style: normal;
}
.quote-card .quote-body::before { content: open-quote; }
.quote-card .quote-body::after  { content: close-quote; }
```

- [ ] **Step 2: Remove the existing `.meta-rail` rules** (search `/* ───────── meta rail (right sidebar) ───────── */` and delete the whole block including the responsive variants).

### Task 3.4: Update body content + heading styles

- [ ] **Step 1: Locate `.post-content` rules and replace headings + body styles** with:

```css
/* ───────── post body ───────── */
.post-content {
  font-family: var(--font-body);
  font-size: var(--t-base);
  line-height: var(--lead-body);
  color: var(--color-text);
  text-wrap: pretty;
  hyphens: auto;
}
.post-content > * + * { margin-top: var(--s-4); }

.post-content h1 {
  font-family: var(--font-display);
  font-weight: 100;
  font-size: var(--t-md);
  line-height: var(--lead-snug);
  color: var(--color-text-soft);
  margin-top: var(--s-7);
  font-style: italic;
}
.post-content h2 {
  font-family: var(--font-display);
  font-weight: 100;
  font-size: var(--t-xl);
  line-height: 1.15;
  letter-spacing: -0.005em;
  color: var(--color-text-strong);
  text-wrap: balance;
  margin-top: 3.5rem;
  margin-bottom: var(--s-3);
  scroll-margin-top: 6rem;
}
.post-content h3 {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 0.9375rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-strong);
  margin-top: var(--s-6);
  margin-bottom: var(--s-3);
  scroll-margin-top: 6rem;
}
.post-content h4 {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-soft);
  margin-top: var(--s-5);
}

.post-content em { font-style: italic; color: var(--color-text-strong); }
.post-content strong { color: var(--color-text-strong); font-weight: 600; }

.post-content a {
  color: var(--color-link);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: color var(--t-fast) var(--ease), border-color var(--t-fast) var(--ease);
}
.post-content a:hover,
.post-content a:focus-visible {
  color: var(--color-link-hover);
  border-bottom-color: currentColor;
}

/* plain markdown blockquote — head-less quote-card variant */
.post-content blockquote {
  background: var(--color-bg-card);
  border: 1px solid var(--color-rule-soft);
  border-left: 1px solid var(--color-rule-soft);     /* override prior crimson */
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  margin-block: var(--s-6);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-body);
  font-style: normal;
  color: var(--color-text);
}
.post-content blockquote::before { content: ""; }
.post-content blockquote p::before { content: open-quote; }
.post-content blockquote p:last-child::after { content: close-quote; }
.post-content blockquote p { margin: 0; }
.post-content blockquote p + p { margin-top: var(--s-3); }
```

- [ ] **Step 2: Build check**

```bash
bun run dev &
sleep 3
curl -s http://localhost:4321/ -o /dev/null -w "%{http_code}\n"
kill %1
```

CSS still compiles. Routing still broken pending Phase 6.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "refactor(css): rewrite tokens, scale, layout grid, post body styles"
```

---

## Phase 4 — Components

### Task 4.1: Brand → plain text "~ ronan ~"

**Files:** `src/components/Brand.astro`

- [ ] **Step 1: Replace whole file**

```astro
---
const { class: cls = '' } = Astro.props;
---

<a href="/" class:list={['brand', cls]} aria-label="ronan.lol">~ ronan ~</a>
```

- [ ] **Step 2: Add `.brand` rule to `global.css`** (replace existing `.brand` + `.brand-mark` + `.brand-letter` blocks)

```css
/* ───────── brand ───────── */
.brand {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: var(--t-md);
  color: var(--color-bright-crimson);
  text-decoration: none;
  letter-spacing: 0.02em;
  transition: color var(--t-fast) var(--ease);
}
.brand:hover { color: var(--color-salmon); }
```

### Task 4.2: Navbar update

**Files:** `src/components/Navbar.astro`

- [ ] **Step 1: Replace whole file**

```astro
---
import Brand from './Brand.astro';
const { pathname } = Astro.url;
const is = (prefix: string) => pathname.startsWith(prefix);
---

<header class="navbar">
  <div class="navbar-inner">
    <Brand />
    <nav class="nav-links" aria-label="Navigation principale">
      <a href="/jardin" class:list={['nav-link', { active: is('/jardin') }]}>Jardin</a>
      <a href="/articles" class:list={['nav-link', { active: is('/articles') }]}>Articles</a>
      <a href="/search" class:list={['nav-link', { active: is('/search') }]}>Recherche</a>
    </nav>
  </div>
</header>
```

- [ ] **Step 2: Replace `.navbar` and `.navbar-inner` rules in `global.css`, and add `.nav-link`** (search for existing block and replace):

```css
/* ───────── navbar ───────── */
.navbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(28, 27, 24, 0.78);
  backdrop-filter: blur(10px) saturate(140%);
  -webkit-backdrop-filter: blur(10px) saturate(140%);
  border-bottom: 1px solid var(--color-rule-soft);
}
.navbar-inner {
  margin: 0 auto;
  padding: var(--s-3) var(--gutter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-5);
}
.nav-links { display: flex; gap: var(--s-6); font-family: var(--font-sans); font-size: 1rem; }
.nav-link {
  color: var(--color-text-soft);
  text-decoration: none;
  transition: color var(--t-fast) var(--ease);
}
.nav-link:hover { color: var(--color-text-strong); }
.nav-link.active { color: var(--color-text-strong); font-weight: 600; }
.nav-link[href="/jardin"].active   { color: var(--color-gold); }
.nav-link[href="/articles"].active { color: var(--color-crimson); }
```

Also remove `.search-container`, `.search-input`, `.search-icon`, `.search-clear` rules from `global.css` (no longer used in navbar).

### Task 4.3: QuoteCard component

**Files:** `src/components/QuoteCard.astro`

- [ ] **Step 1: Create file**

```astro
---
interface Props {
  author: string;
  date?: string;
  avatar?: string;          // initial letter
  avatarColor?: 'orange' | 'crimson' | 'sea-blue' | 'gold' | 'purple' | 'salmon';
}
const { author, date, avatar, avatarColor = 'orange' } = Astro.props;
const initial = avatar ?? author[0]?.toUpperCase() ?? '?';
const colorVar = `var(--color-${avatarColor})`;
---

<figure class="quote-card">
  <figcaption class="quote-head">
    <span class="avatar" style={`background: ${colorVar};`}>{initial}</span>
    <span class="author">{author}</span>
    {date && <><span class="dot">·</span><span class="when">{date}</span></>}
  </figcaption>
  <blockquote class="quote-body"><slot /></blockquote>
</figure>
```

### Task 4.4: Sidenote + NotesRail components

**Files:** `src/components/Sidenote.astro`, `src/components/NotesRail.astro`

- [ ] **Step 1: Create `src/components/Sidenote.astro`**

```astro
---
interface Props { num: number; }
const { num } = Astro.props;
---

<a class="sidenote-ref" href={`#sidenote-${num}`} aria-describedby={`sidenote-${num}`}>{num}</a>
```

- [ ] **Step 2: Create `src/components/NotesRail.astro`**

```astro
---
interface Note { num: number; html: string; }
interface Props { notes: Note[]; }
const { notes } = Astro.props;
---

{notes.length > 0 && (
  <aside class="notes-rail">
    <p class="notes-title">Notes & sources</p>
    {notes.map((note) => (
      <div class="note" id={`sidenote-${note.num}`}>
        <p><span class="num">{note.num}</span><Fragment set:html={note.html} /></p>
      </div>
    ))}
  </aside>
)}
```

The `notes` array is supplied by the page from frontmatter. First-iteration model: define notes in post frontmatter as a map.

### Task 4.5: GardenCard component

**Files:** `src/components/GardenCard.astro`

- [ ] **Step 1: Create file**

```astro
---
import type { CollectionEntry } from 'astro:content';
import { formatPlantedTended } from '../utils/relativeDate';
import { stageGlyph, stageLabel, stageClass } from '../utils/growthStage';

interface Props {
  post: CollectionEntry<'garden'>;
  showExcerpt?: boolean;
}
const { post, showExcerpt = true } = Astro.props;
const { data, id } = post;
const slug = id.replace(/\/index$/, '');
const url = `/jardin/${slug}`;
const meta = formatPlantedTended(data.date, data.lastTended);
const topic = data.tags?.[0] ?? '';
---

<a class="garden-card" href={url}>
  {data.cover ? (
    <div class="card-thumb" style={`background-image: url('${data.cover}');`}></div>
  ) : (
    <div class={`card-thumb no-img card-cover-${(slug.charCodeAt(0) % 5) + 1}`}></div>
  )}
  <p class="card-eyebrow">
    <span class={stageClass(data.growthStage)}>{stageGlyph(data.growthStage)} {stageLabel(data.growthStage)}</span>
    {topic && <><span> · </span><span>{topic}</span></>}
  </p>
  <h3>{data.title}</h3>
  {showExcerpt && data.excerpt && <p class="card-excerpt">{data.excerpt}</p>}
  <p class="card-meta">{meta}</p>
</a>
```

- [ ] **Step 2: Add CSS for `.garden-card` block** (append to `global.css`):

```css
/* ───────── garden card ───────── */
.garden-card {
  display: flex; flex-direction: column;
  text-decoration: none;
  color: inherit;
}
.garden-card .card-thumb {
  aspect-ratio: 16 / 10;
  background: var(--color-bg-card);
  border: 1px solid var(--color-rule-soft);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: var(--s-4);
  background-size: cover;
  background-position: center;
  transition: transform var(--t-med) var(--ease), box-shadow var(--t-med) var(--ease);
}
.garden-card:hover .card-thumb { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.garden-card .card-thumb.no-img {
  display: flex; align-items: center; justify-content: center;
  background:
    radial-gradient(ellipse 60% 80% at 30% 30%, rgba(255, 255, 255, 0.06), transparent 60%),
    var(--cover, var(--color-bg-card));
}
.card-cover-1 { --cover: oklch(0.32 0.10 25); }
.card-cover-2 { --cover: oklch(0.32 0.08 200); }
.card-cover-3 { --cover: oklch(0.32 0.10 60); }
.card-cover-4 { --cover: oklch(0.32 0.08 145); }
.card-cover-5 { --cover: oklch(0.32 0.08 290); }

.garden-card .card-eyebrow {
  display: flex; align-items: center; gap: 0.6rem;
  font-family: var(--font-sans);
  font-size: var(--t-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--color-text-quiet);
  margin-bottom: var(--s-2);
}
.garden-card .stage-evergreen { color: var(--color-gold); }
.garden-card .stage-budding   { color: var(--color-sea-blue); }
.garden-card .stage-seedling  { color: var(--color-salmon); }

.garden-card h3 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: var(--t-lg);
  line-height: 1.2;
  color: var(--color-text-strong);
  margin-bottom: var(--s-2);
  text-wrap: balance;
}
.garden-card:hover h3 { color: var(--color-link); }
.garden-card .card-excerpt {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--color-text-soft);
  margin-bottom: var(--s-3);
  text-wrap: pretty;
}
.garden-card .card-meta {
  margin-top: auto;
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  color: var(--color-text-quiet);
}
```

### Task 4.6: ArticleItem component

**Files:** `src/components/ArticleItem.astro`

- [ ] **Step 1: Create file**

```astro
---
import type { CollectionEntry } from 'astro:content';
import { formatAbsoluteDate, readTimeMinutes } from '../utils/relativeDate';

interface Props {
  post: CollectionEntry<'articles'>;
  body?: string;
  showExcerpt?: boolean;
}
const { post, body = '', showExcerpt = true } = Astro.props;
const { data, id } = post;
const slug = id.replace(/\/index$/, '');
const url = `/articles/${slug}`;
const readTime = data.readTime ?? readTimeMinutes(body);
const dateStr = formatAbsoluteDate(data.date);
---

<article class="article-item">
  <p class="item-eyebrow">
    <span class="leaf">❦</span>
    <span>{data.type}</span>
    <span> · </span>
    <span>{readTime} min</span>
  </p>
  <h3><a href={url}>{data.title}</a></h3>
  {showExcerpt && data.excerpt && <p class="item-excerpt">{data.excerpt}</p>}
  <p class="item-meta">{dateStr}</p>
</article>
```

- [ ] **Step 2: Add CSS for `.article-item`**

```css
/* ───────── article item (notes-style list) ───────── */
.article-item { display: flex; flex-direction: column; }
.article-item .item-eyebrow {
  display: flex; align-items: center; gap: 0.6rem;
  font-family: var(--font-sans);
  font-size: var(--t-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--color-text-quiet);
  margin-bottom: var(--s-2);
}
.article-item .leaf { color: var(--color-accent); font-style: normal; }
.article-item h3 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: var(--t-lg);
  line-height: 1.2;
  margin-bottom: var(--s-2);
  text-wrap: balance;
}
.article-item h3 a { color: var(--color-text-strong); text-decoration: none; }
.article-item:hover h3 a { color: var(--color-link); }
.article-item .item-excerpt {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--color-text-soft);
  margin-bottom: var(--s-3);
  text-wrap: pretty;
}
.article-item .item-meta {
  margin-top: auto;
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  color: var(--color-text-quiet);
}
```

### Task 4.7: HomeLanding component

**Files:** `src/components/HomeLanding.astro`

- [ ] **Step 1: Create file**

```astro
---
import GardenCard from './GardenCard.astro';
import ArticleItem from './ArticleItem.astro';
import type { CollectionEntry } from 'astro:content';

interface Props {
  garden: CollectionEntry<'garden'>[];
  articles: CollectionEntry<'articles'>[];
}
const { garden, articles } = Astro.props;
---

<section class="home-landing">
  <div class="home-col home-col--garden">
    <p class="col-eyebrow eyebrow-garden">🌿 Jardin Numérique</p>
    <h2>Jardin Numérique</h2>
    <p class="col-dek">Notes et idées vivantes.</p>
    <ul class="col-list">
      {garden.slice(0, 3).map((post) => (
        <li><GardenCard post={post} showExcerpt={false} /></li>
      ))}
    </ul>
    <a href="/jardin" class="col-cta">Voir tout le jardin →</a>
  </div>
  <div class="home-col home-col--articles">
    <p class="col-eyebrow eyebrow-articles">❦ Articles</p>
    <h2>Articles</h2>
    <p class="col-dek">Pièces finies. Long-form, plus posées, publiées dans leur état définitif.</p>
    <ul class="col-list">
      {articles.slice(0, 3).map((post) => (
        <li><ArticleItem post={post} showExcerpt={false} /></li>
      ))}
    </ul>
    <a href="/articles" class="col-cta">Tous les articles →</a>
  </div>
</section>
```

- [ ] **Step 2: Add CSS**

```css
/* ───────── home landing (two columns routing to /jardin and /articles) ───────── */
.home-landing {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--s-7);
  padding-top: var(--s-7);
  border-top: 1px solid var(--color-rule-soft);
}
@media (min-width: 880px) {
  .home-landing { grid-template-columns: 1fr 1fr; gap: var(--s-8); }
}
.home-col .col-eyebrow {
  font-family: var(--font-sans);
  font-size: var(--t-sm);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: var(--s-3);
}
.eyebrow-garden { color: var(--color-gold); }
.eyebrow-articles { color: var(--color-crimson); }
.home-col h2 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(2.5rem, 4vw, 3.75rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: var(--color-text-strong);
  margin-bottom: var(--s-3);
}
.home-col .col-dek {
  font-family: var(--font-body);
  font-size: var(--t-md);
  color: var(--color-text-soft);
  margin-bottom: var(--s-6);
  max-width: 40ch;
}
.home-col .col-list { list-style: none; padding: 0; margin: 0; }
.home-col .col-list li { padding: var(--s-4) 0; border-bottom: 1px solid var(--color-rule-soft); }
.home-col .col-cta {
  display: inline-flex; align-items: center; gap: 0.4em;
  margin-top: var(--s-6);
  font-family: var(--font-body);
  font-style: italic;
  font-size: 1.0625rem;
  color: var(--color-link);
  text-decoration: none;
}
.home-col .col-cta:hover { color: var(--color-link-hover); }
```

### Task 4.8: Refactor TocRail for collapsible behavior

**Files:** `src/components/TocRail.astro`

- [ ] **Step 1: Replace whole file**

```astro
---
import type { MarkdownHeading } from 'astro';
interface Props { headings: MarkdownHeading[]; }
const { headings } = Astro.props;
const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
---

{items.length > 0 && (
  <aside class="toc-rail">
    <button class="toc-summary" type="button" aria-expanded="false" aria-controls="toc-body">Table des matières</button>
    <p class="toc-title">Sommaire</p>
    <div class="toc-body" id="toc-body">
      <ol>
        {items.map((h) => (
          <li class={`depth-${h.depth}`}><a href={`#${h.slug}`}>{h.text}</a></li>
        ))}
      </ol>
    </div>
  </aside>
)}

<script>
  function setupToc() {
    const rail = document.querySelector('.toc-rail');
    if (!rail) return;
    const summary = rail.querySelector('.toc-summary');
    summary?.addEventListener('click', () => {
      rail.classList.toggle('open');
      const expanded = rail.classList.contains('open');
      summary.setAttribute('aria-expanded', String(expanded));
    });

    const links = rail.querySelectorAll<HTMLAnchorElement>('.toc-body a');
    const idToLink = new Map<string, HTMLAnchorElement>();
    links.forEach((a) => {
      const id = a.getAttribute('href')?.slice(1);
      if (id) idToLink.set(id, a);
    });
    const headings = Array.from(idToLink.keys())
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            links.forEach((l) => l.classList.remove('active'));
            idToLink.get(e.target.id)?.classList.add('active');
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    headings.forEach((h) => observer.observe(h));
  }
  document.addEventListener('astro:page-load', setupToc);
</script>
```

- [ ] **Step 2: Verify all 8 components compile**

```bash
bun run dev &
sleep 3
curl -s http://localhost:4321/jardin -o /dev/null -w "%{http_code}\n"
kill %1
```

Expected: 404 (not yet implemented) — but no compilation error in Astro logs. Check `bun run dev` output for component errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ src/styles/global.css
git commit -m "feat(components): add Brand, Navbar, QuoteCard, Sidenote, NotesRail, GardenCard, ArticleItem, HomeLanding; refactor TocRail"
```

---

## Phase 5 — Layouts

### Task 5.1: PostLayout — new responsive grid

**Files:** `src/layouts/PostLayout.astro`

- [ ] **Step 1: Replace whole file**

```astro
---
import BaseLayout from './BaseLayout.astro';
import TocRail from '../components/TocRail.astro';
import NotesRail from '../components/NotesRail.astro';
import { formatRelativeDate, formatAbsoluteDate, readTimeMinutes } from '../utils/relativeDate';
import { stageGlyph, stageLabel, stageClass } from '../utils/growthStage';
import type { CollectionEntry } from 'astro:content';
import type { MarkdownHeading } from 'astro';

interface NoteEntry { num: number; html: string; }

interface Props {
  post: CollectionEntry<'garden'> | CollectionEntry<'articles'>;
  headings: MarkdownHeading[];
  body: string;
  notes?: NoteEntry[];
}

const { post, headings, body, notes = [] } = Astro.props;
const { data, collection } = post;
const isGarden = collection === 'garden';

const readTime = (data as any).readTime ?? readTimeMinutes(body);
const plantedRel = formatRelativeDate(data.date);
const plantedAbs = formatAbsoluteDate(data.date);
const tendedRel = isGarden && (data as any).lastTended ? formatRelativeDate((data as any).lastTended) : null;

const backHref = isGarden ? '/jardin' : '/articles';
const backLabel = isGarden ? 'Retour au jardin' : 'Retour aux articles';

const stage = isGarden ? (data as any).growthStage as 'seedling' | 'budding' | 'evergreen' : null;
const articleType = !isGarden ? (data as any).type as string : null;
---

<BaseLayout title={data.title} description={data.excerpt}>
  <article class="article-grid">

    <header class="article-header">
      <a href={backHref} class="back-button">{backLabel}</a>
      <p class="article-eyebrow">
        {isGarden && stage ? (
          <span class={`stage stage--${stage}`}>{stageGlyph(stage)} {stageLabel(stage)}</span>
        ) : (
          <span class="type">{articleType}</span>
        )}
        {!isGarden && <span class="dot" aria-hidden="true">·</span>}
        {!isGarden && <span class="read-time">{readTime} min de lecture</span>}
      </p>
      <h1>{data.title}</h1>
      {data.excerpt && <p class="article-dek" set:html={data.excerpt} />}
      <div class="article-meta">
        {data.tags?.length > 0 && (
          <div class="tags">
            {data.tags.map((tag: string) => (
              <a class="tag" href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}>{tag}</a>
            ))}
          </div>
        )}
        <div class="dates">
          <span title={plantedAbs}>Planté {plantedRel}</span>
          {tendedRel && <><br /><span>Arrosé {tendedRel}</span></>}
        </div>
      </div>
    </header>

    <TocRail headings={headings} />

    <div class="post-content">
      <slot />
    </div>

    <NotesRail notes={notes} />
  </article>
</BaseLayout>
```

- [ ] **Step 2: Add `.back-button` CSS** (place above `.article-header`):

```css
.article-header .back-button {
  display: inline-flex; align-items: center; gap: 0.4em;
  color: var(--color-text-soft);
  font-family: var(--font-body);
  font-style: italic;
  font-size: var(--t-sm);
  text-decoration: none;
  margin-bottom: var(--s-6);
  transition: color var(--t-fast) var(--ease);
}
.article-header .back-button::before { content: "←"; color: var(--color-accent); font-style: normal; }
.article-header .back-button:hover { color: var(--color-link); }
```

### Task 5.2: BaseLayout font preload

**Files:** `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Insert preload links inside `<head>`** (immediately before the existing Google Fonts `<link rel="stylesheet" ...>`)

```html
    <link rel="preload" href="/fonts/CanelaDeck-Regular.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/CanelaText-Light.woff2" as="font" type="font/woff2" crossorigin />
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/ src/styles/global.css
git commit -m "feat(layouts): rebuild PostLayout for new grid, preload Canela"
```

---

## Phase 6 — Pages

### Task 6.1: Section index — `/jardin`

**Files:** `src/pages/jardin/index.astro`

- [ ] **Step 1: Create file**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import GardenCard from '../../components/GardenCard.astro';

const posts = (await getCollection('garden', ({ data }) => !data.draft))
  .sort((a, b) => {
    const aT = (a.data.lastTended ?? a.data.date).getTime();
    const bT = (b.data.lastTended ?? b.data.date).getTime();
    return bT - aT;
  });

const total = posts.length;

const allTopics = Array.from(new Set(posts.flatMap((p) => p.data.tags ?? []))).slice(0, 8);
const stages: Array<['seedling' | 'budding' | 'evergreen', string, string]> = [
  ['evergreen', '🌲 Evergreen', 'stage-evergreen'],
  ['budding', '🌿 Budding', 'stage-budding'],
  ['seedling', '🌱 Seedling', 'stage-seedling'],
];
---

<BaseLayout title="Jardin Numérique — ronan.lol" description="Notes vivantes, en cours d'arrosage.">
  <header class="page-header">
    <p class="page-eyebrow eyebrow-garden">🌿 Jardin Numérique <span class="page-count">· {total}</span></p>
    <h1 class="page-title">Le Jardin</h1>
    <p class="page-dek">
      Une collection de notes, d'essais et d'idées à moitié cuites que j'arrose plus ou moins régulièrement. Certaines deviennent des arbres. D'autres meurent. Toutes évoluent.
    </p>
  </header>

  <div class="filters" data-filter-root>
    <div class="filter-group">
      <span class="filter-label">Sujets</span>
      <div class="filter-list">
        <a href="/jardin" class="filter-link active">Tout</a>
        {allTopics.map((t) => (
          <a href={`/tags/${encodeURIComponent(t.toLowerCase())}`} class="filter-link">{t}</a>
        ))}
      </div>
    </div>
    <div class="filter-group">
      <span class="filter-label">Étape</span>
      <div class="filter-list">
        <a href="/jardin" class="filter-link active">Tout</a>
        {stages.map(([s, label, cls]) => (
          <a href={`/jardin?stage=${s}`} class={`filter-link ${cls}`}>{label}</a>
        ))}
      </div>
    </div>
  </div>

  <section class="garden-grid">
    {posts.map((post) => <GardenCard post={post} />)}
  </section>
</BaseLayout>
```

- [ ] **Step 2: Add page-header + filters + garden-grid CSS** to `global.css`:

```css
/* ───────── page header ───────── */
.page { max-width: 100%; margin: 0; padding: var(--s-7) var(--gutter) var(--s-9); }
.page-header { max-width: 56rem; margin-bottom: var(--s-8); }
.page-eyebrow {
  display: inline-flex; align-items: baseline; gap: 0.6rem;
  font-family: var(--font-sans);
  font-size: var(--t-sm);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: var(--s-4);
}
.page-eyebrow.eyebrow-garden { color: var(--color-gold); }
.page-eyebrow.eyebrow-articles { color: var(--color-crimson); }
.page-count { color: var(--color-accent); font-feature-settings: "tnum"; font-weight: 500; }
.page-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--t-3xl);
  line-height: var(--lead-tight);
  letter-spacing: -0.02em;
  color: var(--color-text-strong);
  text-wrap: balance;
  margin-bottom: var(--s-4);
}
.page-dek {
  font-family: var(--font-body);
  font-size: var(--t-md);
  font-weight: 300;
  line-height: 1.45;
  color: var(--color-text-soft);
  max-width: 48ch;
}

/* ───────── filters ───────── */
.filters {
  display: flex; flex-wrap: wrap; gap: var(--s-4) var(--s-6);
  padding: var(--s-4) 0;
  border-top: 1px solid var(--color-rule-soft);
  border-bottom: 1px solid var(--color-rule-soft);
  margin-bottom: var(--s-7);
  font-family: var(--font-sans);
}
.filter-group { display: flex; align-items: baseline; gap: var(--s-4); }
.filter-label {
  font-size: var(--t-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--color-text-quiet);
}
.filter-list { display: flex; flex-wrap: wrap; gap: var(--s-4); }
.filter-list .filter-link {
  font-size: 0.9375rem;
  color: var(--color-text-soft);
  text-decoration: none;
  font-weight: 500;
}
.filter-list .filter-link:hover,
.filter-list .filter-link.active { color: var(--color-link); }
.filter-list .stage-evergreen.active { color: var(--color-gold); }
.filter-list .stage-budding.active   { color: var(--color-sea-blue); }
.filter-list .stage-seedling.active  { color: var(--color-salmon); }

/* ───────── garden grid ───────── */
.garden-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr));
  gap: var(--s-7) var(--s-6);
}

/* ───────── articles list ───────── */
.articles-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr));
  gap: var(--s-7);
}
```

### Task 6.2: Section index — `/articles`

**Files:** `src/pages/articles/index.astro`

- [ ] **Step 1: Create file**

```astro
---
import { getCollection } from 'astro:content';
import { render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import ArticleItem from '../../components/ArticleItem.astro';

const raw = await getCollection('articles', ({ data }) => !data.draft);
const posts = await Promise.all(
  raw.map(async (post) => {
    const { remarkPluginFrontmatter } = await render(post);
    return { post, body: (post as any).body ?? '' };
  })
);
posts.sort((a, b) => b.post.data.date.getTime() - a.post.data.date.getTime());

const total = posts.length;
const allTopics = Array.from(new Set(posts.flatMap(({ post }) => post.data.tags ?? []))).slice(0, 8);
---

<BaseLayout title="Articles — ronan.lol" description="Pièces finies. Long-form, plus posées.">
  <header class="page-header">
    <p class="page-eyebrow eyebrow-articles">❦ Articles <span class="page-count">· {total}</span></p>
    <h1 class="page-title">Articles</h1>
    <p class="page-dek">
      Pièces finies. Long-form, plus posées, publiées dans leur état définitif. Pas d'arrosage, pas d'évolution — la pensée à un moment donné.
    </p>
  </header>

  <div class="filters">
    <div class="filter-group">
      <span class="filter-label">Sujets</span>
      <div class="filter-list">
        <a href="/articles" class="filter-link active">Tout</a>
        {allTopics.map((t) => (
          <a href={`/tags/${encodeURIComponent(t.toLowerCase())}`} class="filter-link">{t}</a>
        ))}
      </div>
    </div>
  </div>

  <section class="articles-list">
    {posts.map(({ post, body }) => <ArticleItem post={post} body={body} />)}
  </section>
</BaseLayout>
```

### Task 6.3: Single garden post — `/jardin/[...slug]`

**Files:** `src/pages/jardin/[...slug].astro`

- [ ] **Step 1: Create file**

```astro
---
import { getCollection, render } from 'astro:content';
import PostLayout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('garden', ({ data }) => !data.draft);
  return posts.map((post) => {
    const slug = post.id.replace(/\/index$/, '');
    return { params: { slug }, props: { post } };
  });
}

const { post } = Astro.props;
const { Content, headings } = await render(post);
const body = (post as any).body ?? '';
const notes = ((post.data as any).notes ?? null) as Array<{ num: number; html: string }> | null;
---

<PostLayout post={post} headings={headings} body={body} notes={notes ?? []}>
  <Content />
</PostLayout>
```

### Task 6.4: Single article — `/articles/[...slug]`

**Files:** `src/pages/articles/[...slug].astro`

- [ ] **Step 1: Create file** (same shape as 6.3 but for `articles` collection)

```astro
---
import { getCollection, render } from 'astro:content';
import PostLayout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('articles', ({ data }) => !data.draft);
  return posts.map((post) => {
    const slug = post.id.replace(/\/index$/, '');
    return { params: { slug }, props: { post } };
  });
}

const { post } = Astro.props;
const { Content, headings } = await render(post);
const body = (post as any).body ?? '';
const notes = ((post.data as any).notes ?? null) as Array<{ num: number; html: string }> | null;
---

<PostLayout post={post} headings={headings} body={body} notes={notes ?? []}>
  <Content />
</PostLayout>
```

### Task 6.5: Refactor home `/`

**Files:** `src/pages/index.astro`

- [ ] **Step 1: Replace whole file**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import HomeLanding from '../components/HomeLanding.astro';

const garden = (await getCollection('garden', ({ data }) => !data.draft))
  .sort((a, b) => {
    const aT = (a.data.lastTended ?? a.data.date).getTime();
    const bT = (b.data.lastTended ?? b.data.date).getTime();
    return bT - aT;
  });
const articles = (await getCollection('articles', ({ data }) => !data.draft))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

const totalAll = garden.length + articles.length;
---

<BaseLayout title="ronan.lol" description="Carnet de Ronan Lamour — notes, articles, expériences.">
  <header class="page-header home-hero">
    <p class="page-eyebrow"><span class="page-count">{totalAll}</span> Le carnet de Ronan</p>
    <h1 class="hero-title">Notes, <em>essais</em>, et expériences techniques que j'arrose.</h1>
    <p class="page-dek">Un coin du web où je plante des idées sur l'ingénierie, le design, et tout ce que je n'ai pas encore compris.</p>
  </header>

  <HomeLanding garden={garden} articles={articles} />
</BaseLayout>
```

- [ ] **Step 2: Add `.hero-title` CSS** (append to `global.css`):

```css
.home-hero { margin-bottom: var(--s-8); }
.hero-title {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: var(--t-hero);
  line-height: var(--lead-tight);
  letter-spacing: -0.015em;
  color: var(--color-text-strong);
  text-wrap: balance;
  max-width: 22ch;
  margin-bottom: var(--s-5);
}
.hero-title em {
  font-family: var(--font-body);
  font-weight: 300;
  font-style: italic;
  color: var(--color-salmon);
}
```

### Task 6.6: Delete old slug route

- [ ] **Step 1: Delete file**

```bash
git rm src/pages/[...slug].astro
```

### Task 6.7: Update tag pages

**Files:** `src/pages/tags/[tag].astro`, `src/pages/tags/index.astro`

- [ ] **Step 1: Read existing `[tag].astro` to understand its layout**

```bash
cat src/pages/tags/[tag].astro
```

Note: review the file to preserve its existing visual treatment as much as possible.

- [ ] **Step 2: Replace `src/pages/tags/[tag].astro`** with a version that queries both collections:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import GardenCard from '../../components/GardenCard.astro';
import ArticleItem from '../../components/ArticleItem.astro';

export async function getStaticPaths() {
  const garden = await getCollection('garden', ({ data }) => !data.draft);
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  const tags = new Set<string>();
  [...garden, ...articles].forEach((p) => (p.data.tags ?? []).forEach((t: string) => tags.add(t.toLowerCase())));
  return Array.from(tags).map((tag) => ({ params: { tag } }));
}

const { tag } = Astro.params;
const garden = (await getCollection('garden', ({ data }) => !data.draft && data.tags?.some((t: string) => t.toLowerCase() === tag)));
const articles = (await getCollection('articles', ({ data }) => !data.draft && data.tags?.some((t: string) => t.toLowerCase() === tag)));
const total = garden.length + articles.length;
---

<BaseLayout title={`#${tag} — ronan.lol`} description={`Tout ce qui touche à « ${tag} ».`}>
  <header class="page-header">
    <p class="page-eyebrow"><span class="page-count">· {total}</span> Étiquette</p>
    <h1 class="page-title">#{tag}</h1>
    <p class="page-dek">Tout ce que j'ai écrit qui touche à <em>{tag}</em>.</p>
  </header>

  {garden.length > 0 && (
    <section style="margin-bottom: var(--s-8);">
      <h2 class="section-heading">Dans le jardin</h2>
      <div class="garden-grid">
        {garden.map((post) => <GardenCard post={post} />)}
      </div>
    </section>
  )}

  {articles.length > 0 && (
    <section>
      <h2 class="section-heading">Articles</h2>
      <div class="articles-list">
        {articles.map((post) => <ArticleItem post={post} />)}
      </div>
    </section>
  )}
</BaseLayout>
```

- [ ] **Step 3: Add `.section-heading` CSS**

```css
.section-heading {
  font-family: var(--font-display);
  font-weight: 100;
  font-size: var(--t-xl);
  color: var(--color-text-strong);
  margin-bottom: var(--s-5);
}
```

- [ ] **Step 4: Update `src/pages/tags/index.astro`** — read first, then rewrite to query both collections:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

const garden = await getCollection('garden', ({ data }) => !data.draft);
const articles = await getCollection('articles', ({ data }) => !data.draft);
const counts = new Map<string, number>();
[...garden, ...articles].forEach((p) => (p.data.tags ?? []).forEach((t: string) => {
  const key = t.toLowerCase();
  counts.set(key, (counts.get(key) ?? 0) + 1);
}));
const tags = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
---

<BaseLayout title="Étiquettes — ronan.lol" description="Toutes les étiquettes du carnet.">
  <header class="page-header">
    <p class="page-eyebrow"><span class="page-count">{tags.length}</span> Étiquettes</p>
    <h1 class="page-title">Étiquettes</h1>
  </header>

  <ul class="tag-cloud">
    {tags.map(([tag, count]) => (
      <li><a href={`/tags/${encodeURIComponent(tag)}`}>#{tag}<span class="tag-count">{count}</span></a></li>
    ))}
  </ul>
</BaseLayout>
```

- [ ] **Step 5: Add `.tag-cloud` CSS**

```css
.tag-cloud {
  list-style: none; padding: 0;
  display: flex; flex-wrap: wrap; gap: var(--s-3) var(--s-5);
  font-family: var(--font-body);
  font-size: var(--t-md);
}
.tag-cloud a {
  color: var(--color-link);
  text-decoration: none;
  transition: color var(--t-fast) var(--ease);
}
.tag-cloud a:hover { color: var(--color-link-hover); }
.tag-count {
  font-family: var(--font-sans);
  font-size: 0.7em;
  color: var(--color-text-quiet);
  margin-left: 0.4em;
  vertical-align: super;
}
```

### Task 6.8: Update RSS feed

**Files:** `src/pages/rss.xml.js`

- [ ] **Step 1: Read existing file**

```bash
cat src/pages/rss.xml.js
```

- [ ] **Step 2: Rewrite to merge both collections**

```js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const garden = await getCollection('garden', ({ data }) => !data.draft);
  const articles = await getCollection('articles', ({ data }) => !data.draft);

  const items = [
    ...garden.map((p) => ({
      title: p.data.title,
      pubDate: p.data.lastTended ?? p.data.date,
      description: p.data.excerpt ?? '',
      link: `/jardin/${p.id.replace(/\/index$/, '')}`,
      categories: p.data.tags ?? [],
    })),
    ...articles.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.excerpt ?? '',
      link: `/articles/${p.id.replace(/\/index$/, '')}`,
      categories: p.data.tags ?? [],
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'ronan.lol',
    description: 'Carnet de Ronan Lamour — notes, articles, expériences.',
    site: context.site,
    items,
  });
}
```

### Task 6.9: Reskin search + 404

**Files:** `src/pages/search.astro`, `src/pages/404.astro`

- [ ] **Step 1: Read existing search page**

```bash
cat src/pages/search.astro
```

- [ ] **Step 2: Rewrite `src/pages/search.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Recherche — ronan.lol" description="Cherche dans le carnet.">
  <header class="page-header">
    <p class="page-eyebrow">Recherche plein-texte</p>
    <h1 class="page-title">Recherche</h1>
    <p class="page-dek">Tape un mot, une idée, un nom. Pagefind cherche dans tout le carnet.</p>
  </header>

  <div id="search" class="pagefind-host"></div>

  <link rel="stylesheet" href="/pagefind/pagefind-ui.css">
  <script src="/pagefind/pagefind-ui.js"></script>
  <script>
    document.addEventListener('astro:page-load', () => {
      // @ts-expect-error - Pagefind ships an unbundled global
      if (typeof PagefindUI === 'undefined' || document.querySelector('#search .pagefind-ui')) return;
      // @ts-expect-error
      new PagefindUI({ element: '#search', resetStyles: false, showImages: false });
    });
  </script>
</BaseLayout>
```

- [ ] **Step 3: Add Pagefind theme override** to `global.css`:

```css
/* ───────── Pagefind reskin ───────── */
.pagefind-host {
  --pagefind-ui-primary: var(--color-link);
  --pagefind-ui-text: var(--color-text);
  --pagefind-ui-background: var(--color-bg);
  --pagefind-ui-border: var(--color-rule);
  --pagefind-ui-tag: var(--color-bg-card);
  --pagefind-ui-border-radius: var(--radius);
  --pagefind-ui-font: var(--font-body);
}
.pagefind-host .pagefind-ui__form { padding: 0; }
```

- [ ] **Step 4: Read existing 404**

```bash
cat src/pages/404.astro
```

- [ ] **Step 5: Rewrite `src/pages/404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Introuvable — ronan.lol" description="Cette page ne pousse plus ici.">
  <header class="page-header">
    <p class="page-eyebrow">404 — perdu</p>
    <h1 class="page-title">Cette page ne pousse plus ici.</h1>
    <p class="page-dek">Peut-être qu'elle a été déterrée, peut-être qu'elle n'a jamais existé. Essaie le <a href="/jardin">jardin</a> ou les <a href="/articles">articles</a>.</p>
  </header>
</BaseLayout>
```

- [ ] **Step 6: Build whole site**

```bash
bun run build
```

Expected: build completes cleanly. `dist/jardin/`, `dist/articles/`, `dist/tags/` all generated. RSS contains both collections.

- [ ] **Step 7: Commit**

```bash
git add src/pages/ src/styles/global.css
git commit -m "feat(pages): wire jardin/articles routes, refactor home, update tags + rss + search + 404"
```

---

## Phase 7 — Utilities + tests (TDD)

### Task 7.1: growthStage util

**Files:** `src/utils/growthStage.ts`, `src/utils/growthStage.test.ts`

- [ ] **Step 1: Write failing test first** — `src/utils/growthStage.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { stageGlyph, stageLabel, stageClass } from './growthStage';

describe('stageGlyph', () => {
  it('returns plant emoji per stage', () => {
    expect(stageGlyph('seedling')).toBe('🌱');
    expect(stageGlyph('budding')).toBe('🌿');
    expect(stageGlyph('evergreen')).toBe('🌲');
  });

  it('falls back to seedling glyph for unknown', () => {
    // @ts-expect-error testing fallback
    expect(stageGlyph('unknown')).toBe('🌱');
  });
});

describe('stageLabel', () => {
  it('returns capitalized english label', () => {
    expect(stageLabel('seedling')).toBe('Graine');
    expect(stageLabel('budding')).toBe('Bourgeon');
    expect(stageLabel('evergreen')).toBe('Pérenne');
  });
});

describe('stageClass', () => {
  it('returns BEM-style class name', () => {
    expect(stageClass('seedling')).toBe('stage-seedling');
    expect(stageClass('budding')).toBe('stage-budding');
    expect(stageClass('evergreen')).toBe('stage-evergreen');
  });
});
```

- [ ] **Step 2: Run test — confirm failure**

```bash
bun run test
```

Expected: FAIL — `Cannot find module './growthStage'`.

- [ ] **Step 3: Implement** — `src/utils/growthStage.ts`

```ts
export type GrowthStage = 'seedling' | 'budding' | 'evergreen';

const GLYPH: Record<GrowthStage, string> = {
  seedling: '🌱',
  budding: '🌿',
  evergreen: '🌲',
};

const LABEL: Record<GrowthStage, string> = {
  seedling: 'Graine',
  budding: 'Bourgeon',
  evergreen: 'Pérenne',
};

export function stageGlyph(stage: GrowthStage | string): string {
  return GLYPH[stage as GrowthStage] ?? GLYPH.seedling;
}

export function stageLabel(stage: GrowthStage): string {
  return LABEL[stage] ?? 'Graine';
}

export function stageClass(stage: GrowthStage): string {
  return `stage-${stage}`;
}
```

- [ ] **Step 4: Re-run test — confirm pass**

```bash
bun run test
```

Expected: 4 tests passing.

### Task 7.2: relativeDate `formatPlantedTended`

**Files:** `src/utils/relativeDate.ts`, `src/utils/relativeDate.test.ts` (create)

- [ ] **Step 1: Write failing test** — `src/utils/relativeDate.test.ts`

```ts
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { formatPlantedTended, formatRelativeDate, formatAbsoluteDate, readTimeMinutes } from './relativeDate';

describe('formatPlantedTended', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-04T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns just planted when no lastTended', () => {
    const planted = new Date('2026-04-04');
    const result = formatPlantedTended(planted, undefined);
    expect(result).toMatch(/^Planté /);
    expect(result).not.toMatch(/arrosé/);
  });

  it('joins planted and tended when both provided', () => {
    const planted = new Date('2025-11-01');
    const tended = new Date('2026-05-01');
    const result = formatPlantedTended(planted, tended);
    expect(result).toMatch(/^Planté /);
    expect(result).toMatch(/ · arrosé /);
  });

  it('skips tended when same as planted', () => {
    const date = new Date('2026-04-04');
    const result = formatPlantedTended(date, date);
    expect(result).not.toMatch(/arrosé/);
  });
});

describe('readTimeMinutes', () => {
  it('returns at least 1 for empty string', () => {
    expect(readTimeMinutes('')).toBe(1);
  });
  it('rounds reasonable text to integer minutes', () => {
    const text = 'lorem '.repeat(1100);          // ~1100 words
    expect(readTimeMinutes(text, 220)).toBe(5);  // 1100 / 220 = 5
  });
});

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-04T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns relative french string for past day', () => {
    const result = formatRelativeDate(new Date('2026-05-03T12:00:00Z'));
    expect(result).toMatch(/hier/);
  });
});

describe('formatAbsoluteDate', () => {
  it('returns french long date', () => {
    expect(formatAbsoluteDate(new Date('2026-05-04T12:00:00Z'))).toMatch(/4 mai 2026/);
  });
});
```

- [ ] **Step 2: Run — fail on `formatPlantedTended`**

```bash
bun run test
```

Expected: FAIL — `formatPlantedTended is not a function`.

- [ ] **Step 3: Implement** — append to `src/utils/relativeDate.ts`

```ts
export function formatPlantedTended(planted: Date, tended?: Date | null): string {
  const plantedStr = `Planté ${formatRelativeDate(planted)}`;
  if (!tended) return plantedStr;
  if (tended.getTime() === planted.getTime()) return plantedStr;
  return `${plantedStr} · arrosé ${formatRelativeDate(tended)}`;
}
```

- [ ] **Step 4: Re-run tests — all pass**

```bash
bun run test
```

Expected: 9 tests passing across both files.

- [ ] **Step 5: Commit**

```bash
git add src/utils/
git commit -m "feat(utils): growthStage helper + formatPlantedTended w/ tests"
```

---

## Phase 8 — Final polish + verification

### Task 8.1: Footer reskin

**Files:** `src/components/Footer.astro`

- [ ] **Step 1: Read existing**

```bash
cat src/components/Footer.astro
```

- [ ] **Step 2: Replace whole file**

```astro
---
const year = new Date().getFullYear();
---

<footer class="site-footer">
  <div class="site-footer-inner">
    <div class="site-footer-block">
      <p class="site-footer-headline">Le carnet pousse <em>tranquillement</em>.</p>
      <a href="/rss.xml" class="site-footer-rss">
        <span class="site-footer-rss-icon">RSS</span>
        <span>S'abonner au flux</span>
      </a>
      <p class="site-footer-copyright">© {year} Ronan Lamour · Hébergé chez moi · ronan.lol</p>
    </div>

    <nav class="site-footer-block site-footer-block--nav" aria-label="Plan du site">
      <ul class="site-footer-list">
        <li><a href="/jardin">Jardin</a></li>
        <li><a href="/articles">Articles</a></li>
        <li><a href="/tags">Étiquettes</a></li>
      </ul>
      <ul class="site-footer-list site-footer-list--meta">
        <li><a href="/search">Recherche</a></li>
        <li><a href="/rss.xml">RSS</a></li>
      </ul>
    </nav>
  </div>
</footer>
```

(Replace existing tokens in the existing CSS rules; existing `.site-footer*` rules remain since they reference variables which are now updated. Verify in browser.)

### Task 8.2: nginx font cache

**Files:** `nginx.conf`

- [ ] **Step 1: Read existing**

```bash
cat nginx.conf
```

- [ ] **Step 2: Add `/fonts/` location block** alongside the existing `/_astro/` block. Insert before the catch-all location:

```nginx
        location /fonts/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
            try_files $uri =404;
        }
```

### Task 8.3: Build + visual smoke test

- [ ] **Step 1: Build**

```bash
bun run build
```

Expected: build succeeds, no errors. `dist/jardin/index.html`, `dist/articles/index.html`, `dist/jardin/<slug>/index.html` etc all generated.

- [ ] **Step 2: Type check**

```bash
bun astro check
```

Expected: 0 errors. (Warnings are acceptable.)

- [ ] **Step 3: Run preview server**

```bash
bun run preview &
sleep 3
```

- [ ] **Step 4: Visual smoke via playwright-cli — home**

```bash
playwright-cli open http://localhost:4321/
playwright-cli resize 1440 900
playwright-cli screenshot --filename=/tmp/smoke-home.png
```

Verify:
- "~ ronan ~" brand top-left
- Navbar links: Jardin / Articles / Recherche
- Big Canela Deck hero "Notes, *essais*, et expériences..."
- Two-column landing below w/ Jardin + Articles columns

- [ ] **Step 5: Smoke /jardin**

```bash
playwright-cli goto http://localhost:4321/jardin
playwright-cli screenshot --filename=/tmp/smoke-jardin.png
```

Verify:
- Page header "Le Jardin" w/ count
- Filter bar: Sujets + Étape (with stage glyphs)
- Card grid w/ stage glyph + title + meta

- [ ] **Step 6: Smoke /articles**

```bash
playwright-cli goto http://localhost:4321/articles
playwright-cli screenshot --filename=/tmp/smoke-articles.png
```

Verify:
- "Articles" heading
- Topic filter only (no stage filter)
- 3-col list w/ ❦ leaf eyebrow

- [ ] **Step 7: Smoke single garden post**

```bash
playwright-cli goto http://localhost:4321/jardin/2024-03-10-react-hooks
playwright-cli screenshot --filename=/tmp/smoke-post-wide.png
playwright-cli resize 1100 900
playwright-cli screenshot --filename=/tmp/smoke-post-medium.png
playwright-cli resize 800 900
playwright-cli screenshot --filename=/tmp/smoke-post-narrow.png
playwright-cli close
```

Verify across the 3 viewports:
- Wide (1440): TOC left + body + notes right
- Medium (1100): TOC left + body, notes drop below
- Narrow (800): TOC top collapsed, body, notes inline

- [ ] **Step 8: Stop preview**

```bash
kill %1
```

- [ ] **Step 9: Commit final polish**

```bash
git add src/components/Footer.astro nginx.conf
git commit -m "feat(footer,nginx): reskin footer + cache fonts immutably"
```

---

## Self-review

**Spec coverage check:**

| Spec section | Tasks |
|---|---|
| Palette tokens | 3.1 |
| Type stack + scale | 3.1 |
| Spacing rhythm | 3.1 |
| Layout tokens | 3.1 |
| Article post page (responsive grid) | 3.2, 5.1 |
| Page chrome (full-bleed) | 3.1 (--gutter), implicit in pages |
| Index pages (jardin/articles) | 6.1, 6.2 |
| Routing table | 6.1-6.9 |
| Folder split | 2.1 |
| Schema (Zod) | 2.2 |
| Nav | 4.2 |
| Footer | 8.1 |
| HomeLanding | 4.7, 6.5 |
| GardenCard | 4.5 |
| ArticleItem | 4.6 |
| TocRail | 4.8 |
| NotesRail | 4.4 |
| QuoteCard | 4.3 |
| Sidenote | 4.4 |
| PrettyRule | covered by existing `hr::after` rule retained from previous CSS — no rewrite needed |
| MDX support | 0.1 |
| Sidenotes via frontmatter | NotesRail accepts `notes` array; PostLayout passes from frontmatter (5.1) |
| Quote card MDX | QuoteCard.astro is MDX-importable (4.3) |
| Plain markdown blockquote → head-less card | covered by 3.4 (CSS rule on `.post-content blockquote`) |
| Font extraction | 1.1, 1.2 |
| @font-face wiring | 1.3 |
| Lato preload | 5.2 |
| Cover images | GardenCard supports `data.cover` (4.5) |
| Risk: licensing fallback | Spec section, no task — change in tokens (3.1) is the lever |
| Migration plan steps | All 12 steps mapped to phases 0-8 |

**Gaps detected & filled inline:**
- Pretty rule (❦): retained from existing CSS, confirmed not removed.
- nginx cache for `/fonts/` was a spec-implied step (note in spec point 11). Added as Task 8.2.

**Placeholder scan:** none of "TBD", "TODO", "implement later", "similar to Task N", or vague "add error handling" patterns present.

**Type consistency:**
- `GrowthStage` type = same union in both growthStage.ts and content.config.ts.
- `formatPlantedTended(planted, tended)` arg order consistent across PostLayout, GardenCard, tests.
- `stageClass(stage)` returns `stage-${stage}` — used in CSS rules `.stage-seedling`, `.stage-budding`, `.stage-evergreen` (all defined in 3.2 and 4.5).

Plan is ready for execution.
