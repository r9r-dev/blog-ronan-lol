# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern dark-themed blog application built with vanilla JavaScript and Node.js/Express. It features infinite scroll, markdown support, and a containerized deployment setup.

## Development Commands

### Core Commands
- `npm start` - Start production server (from src/ directory)
- `npm run dev` - Start development server with nodemon
- `npm test` - Run Jest tests
- `npm run build` - Build frontend (currently just echoes success)
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run type checking (currently just echoes)

### Container Commands
The application uses Apple's Container (https://github.com/apple/container):
- `container build -t blog-app .` - Build container image
- `container run -p 3000:3000 blog-app` - Run container with port mapping
- `container run -d -p 3000:3000 --name blog-container blog-app` - Run in background
- `container ps` - List running containers
- `container stop blog-container` - Stop container
- `container logs blog-container` - View container logs
- Full instructions available in CONTAINER_INSTRUCTIONS.md

## Project Structure

```
/
├── src/                     # Main source code
│   ├── backend/            # Express.js server
│   │   └── server.js       # Main server file with API endpoints
│   ├── frontend/           # Vanilla JS frontend
│   │   └── app.js          # Main BlogApp class with infinite scroll
│   └── package.json        # Dependencies and scripts
├── posts/                  # Blog post markdown files
├── docs/                   # Architecture and API documentation
├── config/                 # Configuration files
├── scripts/                # Build and deployment scripts
├── docker-compose.yml      # Container orchestration
└── Dockerfile             # Production container setup
```

## Architecture

### Backend (src/backend/server.js)
- **Framework**: Express.js with security middleware (helmet, cors, rate limiting)
- **Content Management**: File-based markdown parsing with frontmatter support
- **Caching**: In-memory cache with 5-minute TTL for posts
- **API Endpoints**:
  - `GET /api/posts` - Paginated posts list
  - `GET /api/posts/:id` - Single post details
  - `GET /api/health` - Health check endpoint

### Frontend (src/frontend/app.js)
- **Architecture**: Single BlogApp class with modular methods
- **Key Features**:
  - Intersection Observer for infinite scroll
  - In-memory post caching
  - Error handling with modal display
  - Responsive navigation and theming
- **UI Patterns**: Card-based post layout, smooth animations, dark theme

### Content Structure
- Posts stored as markdown files in `/posts/` directory
- Frontmatter support for metadata (title, author, date, tags, excerpt)
- Automatic sample post generation if posts directory is empty
- Posts path: `/app/shared/posts` in container, `./posts` on host

## Key Development Patterns

### Content Loading
- Posts are cached in memory for 5 minutes
- Pagination with configurable limits
- Automatic markdown-to-HTML conversion with syntax highlighting
- Frontmatter parsing for post metadata

### API Design
- RESTful endpoints with consistent error handling
- Pagination metadata in responses
- Content separation (excerpt vs full content)
- Rate limiting and security headers

### Frontend State Management
- Class-based architecture with instance variables
- Event-driven updates using native DOM APIs
- Intersection Observer for performance-optimized infinite scroll
- Local error handling and user notifications

## Container Configuration

### Development
- Single blog-app container on port 3000
- Volume mount for posts directory (read-only)
- Health checks using wget on `/api/health`

### Production
- Includes optional nginx reverse proxy
- SSL certificate support via volume mounts
- Non-root user execution for security
- Minimal Alpine Linux base image

## Important Notes

- The working directory for development is `src/` - all npm commands must be run from there
- Posts are expected in markdown format with optional YAML frontmatter
- The application automatically creates sample posts if none exist
- Container runs as non-root user (nextjs:1001) for security
- Application serves frontend static files and handles SPA routing