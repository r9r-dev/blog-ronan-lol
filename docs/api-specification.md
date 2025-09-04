# Blog API Specification v1.0

## Base URL
```
Development: http://localhost:3000/api/v1
Production: https://yourblog.com/api/v1
```

## Authentication
Currently public API. Future versions may implement API keys for write operations.

## Content-Type
All responses are `application/json` unless specified otherwise.

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error context (optional)"
  },
  "status": 400
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Endpoints

### 1. Get Posts List
Retrieve paginated list of blog posts.

**Endpoint**: `GET /posts`

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number (1-based) |
| limit | integer | 10 | Posts per page (max: 50) |
| search | string | - | Search in title/content |
| tag | string | - | Filter by tag |
| category | string | - | Filter by category |
| sort | string | date | Sort by: date, title, views |
| order | string | desc | Order: asc, desc |

**Response**:
```json
{
  "posts": [
    {
      "slug": "my-first-post",
      "title": "My First Blog Post",
      "excerpt": "This is a brief excerpt...",
      "published_date": "2024-01-15T10:30:00Z",
      "updated_date": "2024-01-16T14:20:00Z",
      "tags": ["technology", "javascript"],
      "category": "tutorials",
      "reading_time": 5,
      "image_url": "/assets/images/my-first-post.jpg"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_posts": 95,
    "has_next": true,
    "has_previous": false
  }
}
```

### 2. Get Single Post
Retrieve full details of a specific blog post.

**Endpoint**: `GET /posts/{slug}`

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| slug | string | URL-friendly post identifier |

**Response**:
```json
{
  "slug": "my-first-post",
  "title": "My First Blog Post",
  "excerpt": "This is a brief excerpt...",
  "content": "<h1>My First Post</h1><p>Full HTML content...</p>",
  "markdown": "# My First Post\n\nFull markdown content...",
  "published_date": "2024-01-15T10:30:00Z",
  "updated_date": "2024-01-16T14:20:00Z",
  "tags": ["technology", "javascript"],
  "category": "tutorials",
  "reading_time": 5,
  "image_url": "/assets/images/my-first-post.jpg",
  "author": {
    "name": "John Doe",
    "bio": "Software developer and blogger",
    "avatar": "/assets/avatars/john-doe.jpg",
    "social": {
      "twitter": "@johndoe",
      "github": "johndoe"
    }
  },
  "seo": {
    "meta_description": "Learn about building your first blog post...",
    "meta_keywords": ["blog", "tutorial", "javascript"],
    "canonical_url": "https://yourblog.com/posts/my-first-post"
  }
}
```

### 3. Get Related Posts
Retrieve posts related to a specific post.

**Endpoint**: `GET /posts/{slug}/related`

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| slug | string | - | Post slug |
| limit | integer | 5 | Number of related posts |

**Response**:
```json
{
  "posts": [
    {
      "slug": "related-post-1",
      "title": "Related Post Title",
      "excerpt": "Brief excerpt...",
      "published_date": "2024-01-10T10:30:00Z",
      "tags": ["javascript"],
      "category": "tutorials",
      "reading_time": 3
    }
  ]
}
```

### 4. Get Tags
Retrieve all available tags with post counts.

**Endpoint**: `GET /tags`

**Response**:
```json
{
  "tags": [
    {
      "name": "javascript",
      "count": 15,
      "description": "JavaScript programming posts"
    },
    {
      "name": "react",
      "count": 8,
      "description": "React framework posts"
    }
  ]
}
```

### 5. Get Categories
Retrieve all available categories with post counts.

**Endpoint**: `GET /categories`

**Response**:
```json
{
  "categories": [
    {
      "name": "tutorials",
      "count": 25,
      "description": "Step-by-step tutorials"
    },
    {
      "name": "reviews",
      "count": 12,
      "description": "Product and service reviews"
    }
  ]
}
```

### 6. Search Posts
Full-text search across blog posts.

**Endpoint**: `GET /search`

**Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| q | string | - | Search query (required) |
| page | integer | 1 | Page number |
| limit | integer | 10 | Results per page |

**Response**:
```json
{
  "query": "javascript tutorial",
  "results": [
    {
      "slug": "javascript-basics",
      "title": "JavaScript Basics Tutorial",
      "excerpt": "Learn JavaScript fundamentals...",
      "published_date": "2024-01-15T10:30:00Z",
      "tags": ["javascript", "tutorial"],
      "category": "tutorials",
      "reading_time": 8,
      "relevance_score": 0.95,
      "highlights": {
        "title": "<mark>JavaScript</mark> Basics <mark>Tutorial</mark>",
        "content": "Learn <mark>JavaScript</mark> fundamentals with this comprehensive <mark>tutorial</mark>..."
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_results": 23
  },
  "search_time": "0.045s"
}
```

### 7. RSS Feed
Generate RSS feed for blog posts.

**Endpoint**: `GET /rss`

**Response**: XML RSS 2.0 format
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Blog</title>
    <description>A minimalist blog</description>
    <link>https://yourblog.com</link>
    <lastBuildDate>Mon, 15 Jan 2024 10:30:00 GMT</lastBuildDate>
    <item>
      <title>My First Post</title>
      <description>This is my first blog post...</description>
      <link>https://yourblog.com/posts/my-first-post</link>
      <pubDate>Mon, 15 Jan 2024 10:30:00 GMT</pubDate>
      <guid>https://yourblog.com/posts/my-first-post</guid>
    </item>
  </channel>
</rss>
```

### 8. XML Sitemap
Generate XML sitemap for SEO.

**Endpoint**: `GET /sitemap.xml`

**Response**: XML sitemap format
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourblog.com/</loc>
    <lastmod>2024-01-16</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yourblog.com/posts/my-first-post</loc>
    <lastmod>2024-01-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

## Rate Limiting

### Default Limits
- **General API**: 100 requests per minute per IP
- **Search API**: 20 requests per minute per IP
- **RSS/Sitemap**: 10 requests per minute per IP

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Caching

### Cache Headers
- **Posts List**: `Cache-Control: public, max-age=300` (5 minutes)
- **Single Post**: `Cache-Control: public, max-age=3600` (1 hour)
- **RSS Feed**: `Cache-Control: public, max-age=1800` (30 minutes)
- **Search**: `Cache-Control: private, max-age=60` (1 minute)

### ETag Support
All endpoints support ETags for conditional requests.

## Security

### CORS
- **Allowed Origins**: Configure based on frontend domain
- **Allowed Methods**: GET, HEAD, OPTIONS
- **Allowed Headers**: Content-Type, Authorization

### Content Security
- Input validation on all query parameters
- HTML sanitization for markdown content
- Path traversal protection for file access

## Examples

### Get Latest 5 Posts
```bash
curl "https://yourblog.com/api/v1/posts?limit=5&sort=date&order=desc"
```

### Search for JavaScript Posts
```bash
curl "https://yourblog.com/api/v1/search?q=javascript&limit=10"
```

### Get Posts by Tag
```bash
curl "https://yourblog.com/api/v1/posts?tag=javascript&limit=20"
```

### Get Specific Post
```bash
curl "https://yourblog.com/api/v1/posts/my-first-post"
```

## Future Enhancements

### Version 2.0 Considerations
- Write endpoints for content management
- Authentication system for admin access
- Comment system API
- Analytics endpoint
- Content scheduling
- Multi-language support
- Advanced search with filters
- GraphQL endpoint option