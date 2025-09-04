# Deployment Guide

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and run
git clone <repository>
cd blog
docker-compose up -d

# Access at http://localhost:3000
```

### Option 2: Manual Setup

```bash
# Setup
./scripts/setup.sh

# Development
./scripts/dev.sh

# Production
./scripts/start.sh
```

### Option 3: One-Command Setup

```bash
# Install dependencies and start
cd src && npm install && npm start
```

## File Structure

```
blog/
├── src/
│   ├── backend/server.js     # Express server
│   ├── frontend/             # HTML, CSS, JS
│   └── shared/posts/         # Markdown blog posts
├── Dockerfile                # Container configuration
├── docker-compose.yml        # Multi-service setup
└── scripts/setup.sh          # Automated setup
```

## Adding Content

Create markdown files in `src/shared/posts/`:

```markdown
---
title: Your Post Title
author: Your Name
date: 2024-01-01
tags: tag1, tag2
---

# Your Content Here

Write your post in markdown...
```

## Features Implemented

✅ **Backend**: Express.js with markdown processing  
✅ **Frontend**: Vanilla JS with infinite scroll  
✅ **API**: RESTful endpoints with pagination  
✅ **Responsive**: Mobile-first design  
✅ **Docker**: One-command deployment  
✅ **Tests**: Comprehensive test suite  
✅ **Security**: Helmet, rate limiting, CORS  
✅ **Performance**: Compression, caching, optimization  

## Production Deployment

1. **Environment**: Set `NODE_ENV=production`
2. **SSL**: Configure nginx with certificates
3. **Database**: Consider external storage for posts
4. **Monitoring**: Add logging and monitoring
5. **CDN**: Use CDN for static assets

## Architecture

- **Server**: Node.js/Express
- **Frontend**: Vanilla JavaScript 
- **Styles**: Modern CSS with variables
- **Deployment**: Docker + nginx
- **Storage**: File-based markdown posts
- **API**: RESTful with pagination