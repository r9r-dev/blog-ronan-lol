# Product

## Register

brand

## Users

Other developers and technical peers. Reading on a laptop, often from a link shared in chat or a feed reader, sometimes from search. They came for one specific post; the rest of the site is bonus. They scan first, then commit to reading if the writing earns it. They are tolerant of dense pages and intolerant of marketing scaffolding. Reduced-motion users and color-blind readers are part of this audience too.

## Product Purpose

A long-running personal writing surface at ronan.lol. Holds technical posts, occasional personal pieces, and a small permanent index. Success is the post staying readable years from now without a redesign, and the front door not embarrassing the writing.

The current OpenCode-inspired terminal aesthetic is being **discarded**. Treat the current `index.html` and `styles.css` as if they did not exist. Variants must work in **departure mode by default** — propose new identities consistent with the brand voice below, not refinements of the current loud-terminal treatment.

Anchor reference: **maggieappleton.com**. Three-column reading layout (left TOC rail, centered body, right metadata/footnote rail), full-palette warm cream/dark mode, hand-drawn brand mark with sprig flourishes, layered warm-tinted shadows, rounded corners (~6px), italic display serif (Canela Deck → free analog Fraunces), inline-italic colored topic links (no chip backgrounds), gardening relative-time metaphor ("Planté il y a 3 mois"). Aspire to that *care and craft*, not just the surface tokens.

## Brand Personality

Quiet, restrained, archival. Confident enough to use plain typography and trust the reader. Built to last more than a year of taste cycles. Voice in copy: peer-to-peer, no marketing register, no second-person sales energy ("you'll love"), no exclamation. Short titles, real dates, precise verbs.

## Anti-references

The brand explicitly rejects all five below. The current `index.html` and `styles.css` (loud-terminal/OpenCode, JetBrains Mono everywhere, dark gray palette, sharp 0px radii, monospace-as-aesthetic) are themselves a hard anti-reference. Live variants on this surface run in departure mode; do not preserve its identity.

- **Current site (loud terminal / OpenCode skin).** Mono-only typography, near-black grid, sharp 0px corners, "retro terminal-style blog" framing in the meta description. Diffuse away from this — it is the failure mode, not the starting identity.

- **Medium-style SaaS blog.** Cream background, large humanist serif, hero metric, clap/like counts, avatar-plus-date footer. The default tech-blog skin and the most overfit visual reflex for "personal blog about tech."
- **Hashnode / dev.to template.** Card grid of posts with cover images, tag chips, generic CTA hover. Reads as a portal, not a writer.
- **Notion-page-as-blog.** Sans body, light gray rules between sections, emoji-prefixed headings, callout boxes everywhere. Looks like a dumped doc.
- **Crypto / hacker neon.** Pure `#000` background with neon green or cyan accent, glow shadows, monospace as decoration. The training-data reflex for "developer + dark."

## Design Principles

1. **Writing earns the page, the page does not earn the writing.** Hierarchy serves reading order; nothing decorates the writer. No hero metrics, no author cards, no "subscribe" interruptions in the body.
2. **Quiet is not empty.** Density of links, dates, and structure is welcome; ornament is not. Restraint comes from removing decoration, not removing information.
3. **Archival over trendy.** Pick choices that will not look dated in five years. No glassmorphism, no bento grids, no current-year gradient palette. Type and structure carry the design; effects do not.
4. **Peer-to-peer voice.** Devs read this. No onboarding tone, no marketing copy, no "let's dive in." Titles state the thing; intros do not restate the title.
5. **Pivot, do not preserve.** When generating variants on the current site, prefer directions that move toward quiet/archival over directions that refine the current loud-terminal treatment. The transitional state is allowed to break.

## Accessibility & Inclusion

Best-effort, not audited against a formal WCAG level. Floor in practice:

- Honor `prefers-reduced-motion`. Animations are decoration, not load-bearing.
- Body text contrast comfortable on dark and light variants alike; no chroma-on-chroma type.
- Focus states visible; never `outline: none` without a visible replacement.
- Don't encode meaning in color alone (e.g. tag color). Pair with shape, weight, or label.
- Real `<time>` and semantic headings; not divs with classes.
