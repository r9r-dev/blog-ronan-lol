# Multistage build for ronan.lol Astro site.
# Build context = repository root.
#
# Build:
#   docker build -t ronan-lol .
# Run:
#   docker run --rm -p 8080:80 ronan-lol

# ─────── build stage ───────
FROM oven/bun:1.3-alpine AS build
WORKDIR /app

# Install deps first (cache-friendly).
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source + content.
COPY . .

# Build static site + Pagefind index.
RUN bun run build

# ─────── serve stage ───────
FROM nginx:1.27-alpine
RUN apk add --no-cache wget

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
