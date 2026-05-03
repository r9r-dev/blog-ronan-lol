# ronan.lol

Carnet personnel de Ronan Lamour. Notes techniques, lectures, et expériences en français et anglais.

Statique, généré par [Astro](https://astro.build) à partir de markdown sous `posts/`. Recherche full-text via [Pagefind](https://pagefind.app), indexée au build.

## Stack

- **Astro 6** — pages statiques, content collections, view transitions
- **Bun** — runtime + package manager
- **Source Serif 4 + Fraunces + JetBrains Mono** — typographie via Google Fonts
- **Shiki** — coloration syntaxique build-time (`rose-pine-moon`)
- **Pagefind** — recherche statique
- **nginx (production)** — servi en image Docker multistage

## Structure

```
posts/                  Markdown source (frontmatter: title, date, tags, excerpt, type)
src/
├─ content.config.ts    Zod schema pour les frontmatters
├─ styles/global.css    Système visuel complet
├─ components/          Brand, Navbar, Footer, PostCard, TocRail, MetaRail
├─ layouts/             BaseLayout, PostLayout
├─ pages/               index, [...slug], 404, search, rss.xml, tags/
├─ scripts/             code-copy.ts, emoji.ts (rerunnent sur view transition)
└─ utils/               relativeDate, cover (couleurs + monogramme)
public/                 Static assets
astro.config.mjs        Site config + Shiki + sitemap + view transitions
Dockerfile              Build statique → nginx:alpine
nginx.conf              Cache long pour /_astro/, court pour /pagefind/
```

## Commandes

```sh
bun install               Installation
bun run dev               Dev server sur http://localhost:4321
bun run build             Build statique → dist/ + index Pagefind
bun run preview           Aperçu du build local
bun astro check           Type-check (nécessite @astrojs/check)
```

## Déploiement Docker

```sh
docker build -t ronan-lol .
docker run --rm -p 8080:80 ronan-lol
```

Le multistage build installe les deps, génère le site statique + l'index Pagefind, puis copie `dist/` dans `nginx:alpine`. `/healthz` répond pour le healthcheck.

## Ajouter un post

```sh
mkdir -p posts/$(date +%Y-%m-%d)-mon-titre
cat > posts/$(date +%Y-%m-%d)-mon-titre/index.md <<'EOF'
---
title: "Mon titre"
date: $(date +%Y-%m-%d)
tags: [astro, design]
excerpt: "Une phrase de résumé."
---

Contenu en markdown.
EOF
```

Le frontmatter est validé au build par le schema Zod dans `src/content.config.ts`. Erreur de validation = build qui échoue, plutôt que page cassée en prod.
