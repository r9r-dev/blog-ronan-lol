#!/bin/bash

# Minimalist Blog Setup Script
# This script sets up the blog application for development or production

set -e  # Exit on any error

echo "🚀 Setting up Minimalist Blog Application"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="16.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_error "Node.js version $NODE_VERSION is too old. Please upgrade to version 16 or higher."
        exit 1
    fi
    
    print_status "Node.js version $NODE_VERSION is compatible"
}

# Check if Docker is installed (optional)
check_docker() {
    if command -v docker &> /dev/null; then
        print_status "Docker is available"
        DOCKER_AVAILABLE=true
    else
        print_warning "Docker is not installed. Docker deployment won't be available."
        DOCKER_AVAILABLE=false
    fi
}

# Create directory structure
setup_directories() {
    print_info "Creating directory structure..."
    
    mkdir -p src/shared/posts
    mkdir -p tests/fixtures
    mkdir -p config
    mkdir -p docs
    mkdir -p scripts
    mkdir -p logs
    mkdir -p posts  # For docker volume mount
    
    print_status "Directory structure created"
}

# Install dependencies
install_dependencies() {
    print_info "Installing Node.js dependencies..."
    
    cd src
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    cd ..
    
    print_status "Dependencies installed successfully"
}

# Create sample posts if they don't exist
create_sample_posts() {
    print_info "Checking for sample blog posts..."
    
    if [ ! -f "src/shared/posts/2024-01-01-welcome-to-my-blog.md" ]; then
        print_info "Creating sample blog posts..."
        # The server will create sample posts automatically on first run
        print_status "Sample posts will be created automatically on first run"
    else
        print_status "Sample posts already exist"
    fi
}

# Setup environment file
setup_environment() {
    print_info "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Blog Application Environment Configuration
NODE_ENV=development
PORT=3000

# Optional: Custom posts directory
# POSTS_DIR=./posts

# Optional: Cache settings
# CACHE_DURATION=300000

# Production settings (uncomment for production)
# NODE_ENV=production
# PORT=80
EOF
        print_status "Environment file created (.env)"
    else
        print_status "Environment file already exists"
    fi
}

# Create development scripts
create_dev_scripts() {
    print_info "Creating development scripts..."
    
    # Development start script
    cat > scripts/dev.sh << 'EOF'
#!/bin/bash
echo "🔧 Starting blog in development mode..."
cd src && npm run dev
EOF
    chmod +x scripts/dev.sh
    
    # Production start script
    cat > scripts/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting blog in production mode..."
cd src && npm start
EOF
    chmod +x scripts/start.sh
    
    # Test script
    cat > scripts/test.sh << 'EOF'
#!/bin/bash
echo "🧪 Running tests..."
cd src && npm test
EOF
    chmod +x scripts/test.sh
    
    print_status "Development scripts created"
}

# Setup Docker configuration
setup_docker() {
    if [ "$DOCKER_AVAILABLE" = true ]; then
        print_info "Docker is available - Docker setup complete"
        
        # Create docker-compose override for development
        if [ ! -f "docker-compose.override.yml" ]; then
            cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  blog-app:
    environment:
      - NODE_ENV=development
    volumes:
      # Mount source code for hot reloading in development
      - ./src:/app:delegated
      - /app/node_modules
    command: npm run dev
    profiles: []  # Always run in development

  # Disable nginx in development
  nginx:
    profiles:
      - production
EOF
            print_status "Docker development override created"
        fi
    fi
}

# Run tests
run_tests() {
    print_info "Running initial tests..."
    
    cd src
    
    if npm test 2>/dev/null; then
        print_status "All tests passed"
    else
        print_warning "Some tests failed, but setup will continue"
    fi
    
    cd ..
}

# Create README if it doesn't exist
create_readme() {
    if [ ! -f "README.md" ]; then
        print_info "Creating README.md..."
        
        cat > README.md << 'EOF'
# Minimalist Blog

A clean, fast, and minimalist blog application built with Node.js and vanilla JavaScript.

## Features

- ✨ Minimalist design focused on content
- 🚀 Fast infinite scroll with Intersection Observer
- 📝 Markdown support with syntax highlighting
- 🎨 Dark/light theme toggle
- 📱 Fully responsive design
- 🐳 Docker support for easy deployment
- ⚡ Vanilla JavaScript (no heavy frameworks)

## Quick Start

### Development

```bash
# Start development server
./scripts/dev.sh

# Or manually:
cd src && npm run dev
```

### Production

```bash
# Using Docker (recommended)
docker-compose up -d

# Or manually:
./scripts/start.sh
```

### Testing

```bash
./scripts/test.sh
```

## Directory Structure

```
├── src/
│   ├── backend/         # Express.js server
│   ├── frontend/        # HTML, CSS, JS
│   └── shared/          # Shared resources (posts)
├── tests/               # Test files
├── config/              # Configuration files
├── posts/               # Blog posts (Docker mount)
└── scripts/             # Utility scripts
```

## Writing Posts

Create markdown files in `src/shared/posts/` with frontmatter:

```markdown
---
title: Your Post Title
author: Your Name
date: 2024-01-01
tags: tag1, tag2
excerpt: Brief description
---

# Your Post Content

Write your content in markdown...
```

## Deployment

### Docker (Recommended)

```bash
docker-compose up -d
```

### Manual

```bash
cd src
npm install --production
npm start
```

## License

MIT
EOF
        print_status "README.md created"
    fi
}

# Main setup function
main() {
    echo
    print_info "Starting setup process..."
    echo
    
    check_node
    check_docker
    setup_directories
    install_dependencies
    create_sample_posts
    setup_environment
    create_dev_scripts
    setup_docker
    run_tests
    create_readme
    
    echo
    echo "========================================"
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo
    print_info "Next steps:"
    echo "  1. Start development: ./scripts/dev.sh"
    echo "  2. Open http://localhost:3000"
    echo "  3. Add your posts to src/shared/posts/"
    echo
    
    if [ "$DOCKER_AVAILABLE" = true ]; then
        print_info "Docker deployment:"
        echo "  docker-compose up -d"
        echo
    fi
    
    print_info "Documentation: Check README.md for more details"
    echo
}

# Run main function
main "$@"