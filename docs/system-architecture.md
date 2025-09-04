# Minimalist Blog System Architecture

## 1. System Overview

### Architecture Paradigm
- **Pattern**: Layered Architecture with Clean Architecture principles
- **Style**: RESTful API with file-based content management
- **Approach**: Container-first deployment with Docker multi-stage builds

### High-Level Architecture Diagram (Text-based)

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Web Browser  │  Mobile App  │  API Clients  │  RSS Readers │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│         Load Balancer (nginx) / CDN (Optional)             │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │   Frontend    │  │   Backend API   │  │  Static Files │  │
│  │   (React/     │  │   (Node.js/     │  │   Server      │  │
│  │   Next.js)    │  │   Express)      │  │   (nginx)     │  │
│  └───────────────┘  └─────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Content    │  │   Cache     │  │    Search           │  │
│  │  Manager    │  │  Manager    │  │    Service          │  │
│  │  Service    │  │  (Redis)    │  │   (Full-text)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   DATA ACCESS LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  File System    │  │   Metadata   │  │   Asset       │  │
│  │  Repository     │  │   Database   │  │   Storage     │  │
│  │  (Markdown)     │  │  (SQLite)    │  │  (S3/Local)   │  │
│  └─────────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  Container Runtime (Docker) │ Monitoring │ Logging │ Backup  │
└─────────────────────────────────────────────────────────────┘
```

## 2. Component Architecture

### 2.1 Frontend Layer
- **Technology**: React with Next.js (SSG/SSR)
- **Responsibilities**: 
  - Blog post rendering
  - Navigation and search UI
  - SEO optimization
  - Progressive Web App features

### 2.2 Backend API Layer
- **Technology**: Node.js with Express.js
- **Responsibilities**:
  - RESTful API endpoints
  - Content parsing and metadata extraction
  - Authentication (if needed)
  - Rate limiting and security

### 2.3 Content Management Layer
- **Technology**: File-based with markdown processing
- **Responsibilities**:
  - Markdown parsing and rendering
  - Content validation
  - Metadata extraction
  - Content indexing

### 2.4 Data Storage Strategy
- **Primary**: File-based markdown storage
- **Metadata**: SQLite for indexing and search
- **Cache**: Redis for performance optimization
- **Assets**: Local filesystem or S3-compatible storage

## 3. API Design Specification

### 3.1 Core Endpoints

```
GET /api/v1/posts
  - Query Parameters:
    - page: number (default: 1)
    - limit: number (default: 10, max: 50)
    - search: string (optional)
    - tag: string (optional)
    - category: string (optional)
    - sort: string (date|title|views, default: date)
    - order: string (asc|desc, default: desc)
  - Response: PaginatedPostList

GET /api/v1/posts/{slug}
  - Parameters:
    - slug: string (URL-friendly post identifier)
  - Response: PostDetail

GET /api/v1/posts/{slug}/related
  - Parameters:
    - slug: string
    - limit: number (default: 5)
  - Response: PostList

GET /api/v1/tags
  - Response: TagList with post counts

GET /api/v1/categories
  - Response: CategoryList with post counts

GET /api/v1/search
  - Query Parameters:
    - q: string (search query)
    - page: number (default: 1)
    - limit: number (default: 10)
  - Response: SearchResult

GET /api/v1/rss
  - Response: RSS/XML feed

GET /api/v1/sitemap.xml
  - Response: XML sitemap for SEO
```

### 3.2 Response Schemas

```typescript
interface PaginatedPostList {
  posts: PostSummary[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_posts: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

interface PostSummary {
  slug: string;
  title: string;
  excerpt: string;
  published_date: string;
  updated_date: string;
  tags: string[];
  category: string;
  reading_time: number;
  image_url?: string;
}

interface PostDetail extends PostSummary {
  content: string; // Rendered HTML
  markdown: string; // Raw markdown (optional)
  author: AuthorInfo;
  seo: SEOMetadata;
}
```

## 4. Project Structure Design

```
blog/
├── src/                          # Source code
│   ├── backend/                  # Backend API
│   │   ├── api/                  # API endpoints
│   │   │   ├── v1/
│   │   │   │   ├── posts.js
│   │   │   │   ├── search.js
│   │   │   │   └── metadata.js
│   │   │   └── middleware/
│   │   │       ├── auth.js
│   │   │       ├── rate-limit.js
│   │   │       ├── cors.js
│   │   │       └── error-handler.js
│   │   ├── services/             # Business logic
│   │   │   ├── content-service.js
│   │   │   ├── search-service.js
│   │   │   ├── cache-service.js
│   │   │   └── metadata-service.js
│   │   ├── repositories/         # Data access
│   │   │   ├── file-repository.js
│   │   │   ├── metadata-repository.js
│   │   │   └── cache-repository.js
│   │   ├── utils/                # Utilities
│   │   │   ├── markdown-parser.js
│   │   │   ├── slug-generator.js
│   │   │   ├── logger.js
│   │   │   └── validators.js
│   │   └── server.js             # Express app setup
│   ├── frontend/                 # Frontend application
│   │   ├── components/           # React components
│   │   │   ├── Layout/
│   │   │   ├── PostList/
│   │   │   ├── PostDetail/
│   │   │   ├── Search/
│   │   │   └── Navigation/
│   │   ├── pages/                # Next.js pages
│   │   │   ├── index.js
│   │   │   ├── posts/
│   │   │   └── search/
│   │   ├── hooks/                # Custom React hooks
│   │   ├── utils/                # Frontend utilities
│   │   └── styles/               # CSS/SCSS files
│   └── shared/                   # Shared utilities
│       ├── types/                # TypeScript types
│       ├── constants/            # Application constants
│       └── validators/           # Shared validation
├── content/                      # Blog content
│   ├── posts/                    # Markdown blog posts
│   │   ├── 2024/
│   │   └── drafts/
│   ├── assets/                   # Images, media
│   │   ├── images/
│   │   └── uploads/
│   └── meta/                     # Metadata files
│       ├── authors.json
│       ├── categories.json
│       └── site-config.json
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   │   ├── backend/
│   │   └── frontend/
│   ├── integration/              # Integration tests
│   ├── e2e/                      # End-to-end tests
│   └── fixtures/                 # Test data
├── docs/                         # Documentation
│   ├── api/                      # API documentation
│   ├── deployment/               # Deployment guides
│   └── architecture/             # Architecture docs
├── config/                       # Configuration files
│   ├── database/                 # Database configs
│   ├── docker/                   # Docker configs
│   ├── nginx/                    # Web server configs
│   └── env/                      # Environment configs
├── scripts/                      # Utility scripts
│   ├── build.js                  # Build scripts
│   ├── deploy.js                 # Deployment scripts
│   ├── migrate.js                # Migration scripts
│   └── content-import.js         # Content management
├── docker-compose.yml            # Local development
├── Dockerfile                    # Production container
├── package.json                  # Node.js dependencies
└── README.md                     # Project documentation
```

## 5. Docker Deployment Strategy

### 5.1 Multi-Stage Dockerfile

```dockerfile
# Stage 1: Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Development dependencies
FROM node:18-alpine AS dev-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=dev-deps /app/dist ./dist
COPY --from=dev-deps /app/public ./public
COPY package*.json ./

# Set up content directory
RUN mkdir -p /app/content/posts /app/content/assets
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
```

### 5.2 Docker Compose Architecture

```yaml
version: '3.8'
services:
  blog-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./content:/app/content:ro
      - blog-assets:/app/public/assets
    depends_on:
      - redis
      - nginx

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx:/etc/nginx/conf.d
      - blog-assets:/var/www/assets:ro
      - certbot-certs:/etc/letsencrypt
    depends_on:
      - blog-app

volumes:
  redis-data:
  blog-assets:
  certbot-certs:
```

## 6. Security Architecture

### 6.1 API Security
- **Rate Limiting**: Express rate limiter with Redis backend
- **CORS Configuration**: Strict origin policies
- **Input Validation**: Schema-based validation for all inputs
- **Content Sanitization**: XSS protection for markdown content
- **Security Headers**: Helmet.js for security headers

### 6.2 File System Security
- **Path Traversal Protection**: Whitelist allowed paths
- **File Type Validation**: Only allow markdown and approved assets
- **Content Scanning**: Malware scanning for uploaded assets
- **Access Controls**: Read-only access for content files

### 6.3 Container Security
- **Non-root User**: Run containers as non-privileged user
- **Minimal Base Image**: Alpine Linux for smaller attack surface
- **Secret Management**: Environment variables for sensitive data
- **Network Isolation**: Docker networks with minimal exposed ports

## 7. Performance & Scalability Considerations

### 7.1 Performance Optimizations
- **Static Site Generation**: Pre-generate static pages
- **Content Caching**: Redis for frequently accessed content
- **CDN Integration**: Cloudflare or AWS CloudFront
- **Image Optimization**: WebP format with fallbacks
- **Lazy Loading**: Progressive loading of images and content

### 7.2 Scalability Strategy
- **Horizontal Scaling**: Multiple container instances behind load balancer
- **Database Scaling**: Read replicas for metadata database
- **Content Delivery**: CDN for global content distribution
- **Caching Layers**: Multi-level caching (browser, CDN, application, database)

### 7.3 Monitoring & Observability
- **Application Metrics**: Prometheus + Grafana
- **Log Aggregation**: ELK stack or similar
- **Health Checks**: Kubernetes-style health endpoints
- **Error Tracking**: Sentry or similar service

## 8. Data Strategy Rationale

### File-based vs Database Approach
**Decision**: Hybrid approach with file-based content and database metadata

**Rationale**:
- **Content Storage**: Markdown files for version control and portability
- **Metadata Index**: SQLite for fast queries and search
- **Best of Both**: Git-friendly content with performant queries

### Benefits:
- Version control friendly
- Easy backup and migration
- Fast search and filtering
- Minimal database overhead
- Content portability

## 9. Technology Stack Summary

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite + Redis
- **Content**: Markdown with frontmatter

### Frontend
- **Framework**: React with Next.js
- **Styling**: CSS Modules or Tailwind CSS
- **State Management**: React Context + Hooks

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (reverse proxy)
- **Cache**: Redis
- **Deployment**: Container orchestration (Docker Swarm/Kubernetes)

This architecture provides a robust, scalable, and maintainable foundation for the minimalist blog while keeping complexity manageable.