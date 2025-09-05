# Blog Application

A modern, dark-themed blog application built with vanilla JavaScript and Node.js/Express. Features infinite scroll, markdown support, and containerized deployment.

## Features

- Simple blog focused on articles
- Blog posts has static files
- Tags
- Search field on tags, titles and content
- Dark theme with smooth animations
- Infinite scroll for seamless browsing
- Markdown support with YAML frontmatter
- Fast in-memory caching (5-minute TTL)
- Security headers and rate limiting
- Multi-platform Docker support (amd64/arm64)

## Quick Start

### Using Docker

Pull and run the latest image from GitHub Container Registry:

```bash
# Pull the latest image
docker pull ghcr.io/r9r-dev/blog-ronan-lol:latest

# Run with local posts directory
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/posts:/app/shared/posts:ro \
  --name blog \
  ghcr.io/r9r-dev/blog-ronan-lol:latest

# View logs
docker logs blog

# Stop the container
docker stop blog
```

### Using Container (macOS)

Apple's Container tool provides a lightweight alternative:

```bash
# Pull the image
container pull ghcr.io/r9r-dev/blog-ronan-lol:latest

# Run with local posts directory
container run -d \
  -p 3000:3000 \
  -v $(pwd)/posts:/app/shared/posts:ro \
  --name blog \
  ghcr.io/r9r-dev/blog-ronan-lol:latest

# View running containers
container ps

# View logs
container logs blog

# Stop the container
container stop blog
```

### Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
services:
  blog:
    image: ghcr.io/r9r-dev/blog-ronan-lol:latest
    container_name: blog-app
    ports:
      - "3000:3000"
    volumes:
      - ./posts:/app/shared/posts:ro
    environment:
      - NODE_ENV=production
      - PORT=3000
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    restart: unless-stopped
    networks:
      - blog-network

  # Optional: Nginx reverse proxy (uncomment to enable)
  # nginx:
  #   image: nginx:alpine
  #   container_name: blog-nginx
  #   ports:
  #     - "80:80"
  #   volumes:
  #     - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
  #   depends_on:
  #     - blog
  #   restart: unless-stopped
  #   networks:
  #     - blog-network

networks:
  blog-network:
    driver: bridge
```

Then run:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/r9r-dev/blog-ronan-lol.git
cd blog-ronan-lol

# Install dependencies
cd src
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linter
npm run lint
```

### Building from Source

```bash
# Build Docker image locally
docker build -t blog-app .

# Or using Container (macOS)
container build -t blog-app .
```

## Project Structure

```
/
├── src/                     # Source code
│   ├── backend/            # Express.js server
│   ├── frontend/           # Vanilla JS frontend
│   └── package.json        # Dependencies
├── posts/                  # Markdown blog posts
├── Dockerfile              # Container configuration
├── docker-compose.yml      # Orchestration config
└── .github/workflows/      # CI/CD pipelines
```

## Writing Posts

Posts are markdown files in the `/posts` directory with optional YAML frontmatter:

```markdown
---
title: My Blog Post
author: John Doe
date: 2024-01-01
tags: [javascript, docker]
excerpt: A brief description
---

# Post Content

Your markdown content here...
```

### Volume Mount for Posts

The application expects posts in `/app/shared/posts` inside the container. Mount your local posts directory:

- **Docker**: `-v $(pwd)/posts:/app/shared/posts:ro`
- **Docker Compose**: See example above
- **Container**: Same as Docker syntax

The `:ro` flag mounts as read-only for security.

## API Endpoints

- `GET /api/posts?page=1&limit=10` - Paginated posts list
- `GET /api/posts/:id` - Single post details
- `GET /api/health` - Health check endpoint

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `POSTS_DIR` - Posts directory path (default: ./posts)

## CI/CD

GitHub Actions automatically builds and publishes Docker images to GitHub Container Registry on version tags:

```bash
# Create a new version tag
git tag -a v1.0.3 -m "Release v1.0.3"
git push origin v1.0.3

# Images will be available at:
# ghcr.io/r9r-dev/blog-ronan-lol:v1.0.3
# ghcr.io/r9r-dev/blog-ronan-lol:latest
```

## Security

- Non-root container execution (user: nextjs)
- Security headers via Helmet.js
- Rate limiting on API endpoints
- CORS configuration
- Read-only volume mounts
- Input sanitization

## License

MIT

## Contributing

Pull requests are welcome! Please follow the existing code style and include tests for new features.

## Support

For issues and questions, please use the [GitHub issue tracker](https://github.com/r9r-dev/blog-ronan-lol/issues).