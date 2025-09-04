# Project Structure Template

This document provides the recommended project structure for the minimalist blog application following clean architecture principles.

## Directory Structure

```
blog/
├── README.md                     # Project documentation
├── package.json                  # Node.js dependencies and scripts
├── package-lock.json            # Locked dependency versions
├── .gitignore                    # Git ignore patterns
├── .env.example                  # Environment variables template
├── .env                          # Environment variables (local only)
├── docker-compose.yml            # Local development environment
├── Dockerfile                    # Production container image
├── Dockerfile.dev                # Development container image
├── 
├── src/                          # 🔥 SOURCE CODE
│   ├── backend/                  # Backend API application
│   │   ├── api/                  # API layer (controllers)
│   │   │   ├── v1/              # API version 1
│   │   │   │   ├── index.js     # Route definitions
│   │   │   │   ├── posts.js     # Posts endpoints
│   │   │   │   ├── search.js    # Search endpoints
│   │   │   │   ├── metadata.js  # Tags/categories endpoints
│   │   │   │   └── health.js    # Health check endpoints
│   │   │   └── middleware/       # Express middleware
│   │   │       ├── auth.js      # Authentication middleware
│   │   │       ├── rate-limit.js # Rate limiting
│   │   │       ├── cors.js      # CORS configuration
│   │   │       ├── security.js  # Security headers
│   │   │       ├── validation.js # Input validation
│   │   │       ├── cache.js     # Response caching
│   │   │       └── error-handler.js # Global error handling
│   │   ├── services/             # Business logic layer
│   │   │   ├── content-service.js # Content management
│   │   │   ├── search-service.js # Search functionality
│   │   │   ├── cache-service.js  # Caching logic
│   │   │   ├── metadata-service.js # Tags/categories logic
│   │   │   ├── rss-service.js   # RSS feed generation
│   │   │   └── sitemap-service.js # Sitemap generation
│   │   ├── repositories/         # Data access layer
│   │   │   ├── file-repository.js # File system operations
│   │   │   ├── metadata-repository.js # SQLite operations
│   │   │   ├── cache-repository.js # Redis operations
│   │   │   └── search-repository.js # Search index operations
│   │   ├── utils/                # Utility functions
│   │   │   ├── markdown-parser.js # Markdown processing
│   │   │   ├── slug-generator.js # URL slug generation
│   │   │   ├── logger.js        # Logging configuration
│   │   │   ├── validators.js    # Input validation schemas
│   │   │   ├── sanitizer.js     # Content sanitization
│   │   │   ├── date-utils.js    # Date formatting
│   │   │   └── pagination.js    # Pagination helpers
│   │   ├── config/               # Configuration files
│   │   │   ├── database.js      # Database configuration
│   │   │   ├── redis.js         # Redis configuration
│   │   │   ├── server.js        # Server configuration
│   │   │   └── environment.js   # Environment variables
│   │   └── server.js             # Express application entry point
│   ├── frontend/                 # Frontend React/Next.js application
│   │   ├── components/           # React components
│   │   │   ├── Layout/          # Layout components
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Navigation.jsx
│   │   │   │   └── Layout.jsx
│   │   │   ├── PostList/        # Post listing components
│   │   │   │   ├── PostCard.jsx
│   │   │   │   ├── PostGrid.jsx
│   │   │   │   └── Pagination.jsx
│   │   │   ├── PostDetail/      # Single post components
│   │   │   │   ├── PostContent.jsx
│   │   │   │   ├── PostMeta.jsx
│   │   │   │   └── RelatedPosts.jsx
│   │   │   ├── Search/          # Search components
│   │   │   │   ├── SearchBox.jsx
│   │   │   │   ├── SearchResults.jsx
│   │   │   │   └── SearchFilters.jsx
│   │   │   ├── Navigation/      # Navigation components
│   │   │   │   ├── MainNav.jsx
│   │   │   │   ├── TagCloud.jsx
│   │   │   │   └── CategoryList.jsx
│   │   │   ├── Common/          # Reusable components
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Loading.jsx
│   │   │   │   ├── ErrorBoundary.jsx
│   │   │   │   └── SEO.jsx
│   │   │   └── UI/              # UI components
│   │   │       ├── Card.jsx
│   │   │       ├── Modal.jsx
│   │   │       ├── Tooltip.jsx
│   │   │       └── Badge.jsx
│   │   ├── pages/                # Next.js pages (file-based routing)
│   │   │   ├── index.js         # Homepage
│   │   │   ├── posts/           # Post pages
│   │   │   │   ├── index.js     # Posts listing
│   │   │   │   └── [slug].js    # Individual post
│   │   │   ├── search/          # Search pages
│   │   │   │   └── index.js     # Search results
│   │   │   ├── tags/            # Tag pages
│   │   │   │   ├── index.js     # All tags
│   │   │   │   └── [tag].js     # Posts by tag
│   │   │   ├── categories/      # Category pages
│   │   │   │   ├── index.js     # All categories
│   │   │   │   └── [category].js # Posts by category
│   │   │   ├── 404.js           # Not found page
│   │   │   ├── 500.js           # Server error page
│   │   │   └── _app.js          # App configuration
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useApi.js        # API calling hook
│   │   │   ├── useSearch.js     # Search functionality hook
│   │   │   ├── usePagination.js # Pagination hook
│   │   │   └── useLocalStorage.js # Local storage hook
│   │   ├── utils/                # Frontend utilities
│   │   │   ├── api-client.js    # API client configuration
│   │   │   ├── date-format.js   # Date formatting
│   │   │   ├── url-helpers.js   # URL manipulation
│   │   │   ├── seo-helpers.js   # SEO utilities
│   │   │   └── constants.js     # Frontend constants
│   │   ├── styles/               # CSS/SCSS files
│   │   │   ├── globals.css      # Global styles
│   │   │   ├── components/      # Component styles
│   │   │   ├── pages/           # Page-specific styles
│   │   │   └── variables.css    # CSS custom properties
│   │   ├── public/               # Static assets
│   │   │   ├── favicon.ico      # Site favicon
│   │   │   ├── robots.txt       # SEO robots file
│   │   │   ├── manifest.json    # PWA manifest
│   │   │   └── images/          # Static images
│   │   └── next.config.js        # Next.js configuration
│   └── shared/                   # Shared utilities between frontend/backend
│       ├── types/                # TypeScript type definitions
│       │   ├── post.ts          # Post-related types
│       │   ├── api.ts           # API response types
│       │   ├── search.ts        # Search-related types
│       │   └── index.ts         # Type exports
│       ├── constants/            # Application constants
│       │   ├── api.js           # API endpoints
│       │   ├── pagination.js    # Pagination constants
│       │   └── validation.js    # Validation constants
│       └── validators/           # Shared validation schemas
│           ├── post-schema.js   # Post validation
│           ├── search-schema.js # Search validation
│           └── common-schema.js # Common validations
├── 
├── content/                      # 📝 BLOG CONTENT
│   ├── posts/                    # Markdown blog posts
│   │   ├── 2024/                # Posts organized by year
│   │   │   ├── 01-january/      # Monthly organization
│   │   │   ├── 02-february/
│   │   │   └── ...
│   │   ├── 2023/
│   │   └── drafts/              # Draft posts
│   ├── assets/                   # Media files
│   │   ├── images/              # Post images
│   │   │   ├── 2024/            # Organized by year
│   │   │   └── thumbnails/      # Generated thumbnails
│   │   ├── videos/              # Video files
│   │   └── uploads/             # User uploads
│   └── meta/                     # Metadata files
│       ├── authors.json         # Author information
│       ├── categories.json      # Category definitions
│       ├── tags.json           # Tag definitions
│       └── site-config.json    # Site configuration
├── 
├── tests/                        # 🧪 TEST FILES
│   ├── unit/                     # Unit tests
│   │   ├── backend/             # Backend unit tests
│   │   │   ├── services/        # Service layer tests
│   │   │   ├── repositories/    # Repository layer tests
│   │   │   └── utils/           # Utility tests
│   │   └── frontend/            # Frontend unit tests
│   │       ├── components/      # Component tests
│   │       ├── hooks/           # Hook tests
│   │       └── utils/           # Frontend utility tests
│   ├── integration/              # Integration tests
│   │   ├── api/                 # API integration tests
│   │   ├── database/            # Database integration tests
│   │   └── services/            # Service integration tests
│   ├── e2e/                      # End-to-end tests
│   │   ├── specs/               # Test specifications
│   │   ├── fixtures/            # Test data
│   │   └── support/             # Test helpers
│   ├── performance/              # Performance tests
│   │   ├── load/                # Load testing
│   │   └── benchmarks/          # Benchmark tests
│   └── fixtures/                 # Test data and mocks
│       ├── posts/               # Sample posts
│       ├── api-responses/       # Mock API responses
│       └── database/            # Test database seeds
├── 
├── docs/                         # 📚 DOCUMENTATION
│   ├── api/                      # API documentation
│   │   ├── v1/                  # API version 1 docs
│   │   └── postman/             # Postman collections
│   ├── deployment/               # Deployment guides
│   │   ├── docker.md            # Docker deployment
│   │   ├── kubernetes.md        # Kubernetes deployment
│   │   └── aws.md               # AWS deployment
│   ├── architecture/             # Architecture documentation
│   │   ├── system-design.md     # System architecture
│   │   ├── database-design.md   # Database schema
│   │   └── api-design.md        # API design decisions
│   ├── development/              # Development guides
│   │   ├── setup.md             # Development setup
│   │   ├── contributing.md      # Contribution guidelines
│   │   └── coding-standards.md  # Code style guide
│   └── user/                     # User documentation
│       ├── content-guide.md     # Content creation guide
│       └── admin-guide.md       # Administration guide
├── 
├── config/                       # ⚙️ CONFIGURATION FILES
│   ├── database/                 # Database configurations
│   │   ├── sqlite.js            # SQLite configuration
│   │   └── migrations/          # Database migrations
│   ├── docker/                   # Docker configurations
│   │   ├── nginx.conf           # Nginx configuration
│   │   ├── redis.conf           # Redis configuration
│   │   └── docker-compose/      # Environment-specific compose files
│   │       ├── development.yml
│   │       ├── staging.yml
│   │       └── production.yml
│   ├── nginx/                    # Web server configurations
│   │   ├── default.conf         # Default nginx config
│   │   ├── ssl.conf             # SSL configuration
│   │   └── gzip.conf            # Compression config
│   └── env/                      # Environment configurations
│       ├── development.env      # Development variables
│       ├── staging.env          # Staging variables
│       └── production.env       # Production variables
├── 
├── scripts/                      # 🔧 UTILITY SCRIPTS
│   ├── build/                    # Build scripts
│   │   ├── build.js             # Production build
│   │   ├── clean.js             # Clean build artifacts
│   │   └── optimize.js          # Asset optimization
│   ├── deploy/                   # Deployment scripts
│   │   ├── deploy.js            # Main deployment script
│   │   ├── rollback.js          # Rollback script
│   │   └── health-check.js      # Post-deploy health check
│   ├── database/                 # Database scripts
│   │   ├── migrate.js           # Run migrations
│   │   ├── seed.js              # Seed test data
│   │   └── backup.js            # Database backup
│   ├── content/                  # Content management scripts
│   │   ├── import.js            # Import content from external sources
│   │   ├── export.js            # Export content
│   │   ├── optimize-images.js   # Image optimization
│   │   └── generate-sitemap.js  # Generate sitemap
│   ├── maintenance/              # Maintenance scripts
│   │   ├── cache-clear.js       # Clear caches
│   │   ├── log-rotate.js        # Log rotation
│   │   └── health-check.js      # System health check
│   └── development/              # Development helper scripts
│       ├── dev-server.js        # Development server
│       ├── mock-data.js         # Generate mock data
│       └── test-setup.js        # Test environment setup
└── 
└── monitoring/                   # 📊 MONITORING & OBSERVABILITY
    ├── logs/                     # Application logs
    ├── metrics/                  # Performance metrics
    ├── alerts/                   # Alert configurations
    └── dashboards/               # Monitoring dashboards
```

## Key Design Principles

### 1. Clean Architecture
- **Separation of Concerns**: Each layer has distinct responsibilities
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Single Responsibility**: Each file/module has one clear purpose

### 2. File Organization
- **Logical Grouping**: Files grouped by feature and layer
- **Consistent Naming**: Clear, descriptive file names
- **Scalable Structure**: Easy to add new features without restructuring

### 3. Environment Management
- **Configuration Separation**: Environment-specific configs isolated
- **Secret Management**: Sensitive data in environment variables
- **Development Parity**: Consistent environments across dev/staging/prod

### 4. Testing Strategy
- **Test Isolation**: Tests organized by type and scope
- **Test Data Management**: Fixtures and mocks properly organized
- **Performance Testing**: Dedicated performance testing structure

### 5. Documentation
- **Living Documentation**: Docs alongside code for better maintenance
- **API-First**: Comprehensive API documentation
- **Deployment Guides**: Clear deployment and operations documentation

## Usage Guidelines

### Adding New Features
1. Create feature branch: `feature/new-feature-name`
2. Add files in appropriate directories following existing patterns
3. Write tests first (TDD approach)
4. Update documentation as needed
5. Submit pull request with clear description

### File Naming Conventions
- **JavaScript Files**: kebab-case (e.g., `content-service.js`)
- **React Components**: PascalCase (e.g., `PostCard.jsx`)
- **Configuration Files**: kebab-case (e.g., `docker-compose.yml`)
- **Documentation**: kebab-case (e.g., `api-specification.md`)

### Import/Export Patterns
```javascript
// Barrel exports in index.js files
export { PostService } from './post-service.js';
export { SearchService } from './search-service.js';

// Absolute imports from src root
import { PostService } from '@/backend/services';
import { Button } from '@/frontend/components/UI';
```

This structure provides a solid foundation for a maintainable, scalable blog application while following industry best practices and clean architecture principles.