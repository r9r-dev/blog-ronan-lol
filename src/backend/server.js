const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { marked } = require('marked');
const hljs = require('highlight.js');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const POSTS_DIR = path.join(__dirname, '../shared/posts');

// Trust proxy - only enable if explicitly needed
// For Pangolin/tunnel scenarios, this is typically not required
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', process.env.TRUST_PROXY);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Other middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Configure marked with syntax highlighting
// Override the code renderer to add highlighting
const renderer = new marked.Renderer();

renderer.code = function(code, language) {
  let highlightedCode;
  if (language && hljs.getLanguage(language)) {
    try {
      highlightedCode = hljs.highlight(code, { language: language }).value;
    } catch (err) {
      console.error('Highlighting error:', err);
      highlightedCode = hljs.highlightAuto(code).value;
    }
  } else {
    const autoHighlight = hljs.highlightAuto(code);
    highlightedCode = autoHighlight.value;
  }
  
  return `<pre><code class="hljs language-${language || 'text'}">${highlightedCode}</code></pre>`;
};

marked.setOptions({
  renderer: renderer,
  breaks: true,
  gfm: true
});

// Blog post cache with file watching and polling fallback
let postsCache = null;
let postsWatcher = null;
let lastDirectoryCheck = 0;
let directoryStats = new Map();

// Helper function to parse tags from frontmatter
function parseTags(tagsString) {
  if (!tagsString) return [];
  
  // Remove any quotes and brackets
  const cleanString = tagsString.replace(/^[\[\"]|[\]\"]$/g, '').trim();
  
  // Try parsing as JSON first
  try {
    if (tagsString.startsWith('[') || tagsString.includes('"')) {
      const parsed = JSON.parse(tagsString);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch (e) {
    // Fall back to comma separation
  }
  
  // Handle comma-separated values
  return cleanString.split(',').map(tag => 
    tag.trim().replace(/^["']|["']$/g, '')
  ).filter(tag => tag.length > 0);
}

// Initialize file watcher for posts directory with cross-platform compatibility
function initializePostsWatcher() {
  if (postsWatcher) {
    postsWatcher.close();
  }
  
  try {
    // First try recursive watching (macOS/Windows)
    postsWatcher = fsSync.watch(POSTS_DIR, { recursive: true }, (eventType, filename) => {
      if (filename && (filename.endsWith('.md') || filename.endsWith('index.md'))) {
        console.log(`📝 Post ${eventType}: ${filename} - refreshing cache`);
        postsCache = null; // Invalidate cache immediately
      }
    });
    console.log(`👀 Watching posts directory recursively: ${POSTS_DIR}`);
  } catch (error) {
    if (error.message.includes('recursively') || error.message.includes('recursive')) {
      console.log('📁 Recursive watching not supported, using non-recursive mode');
      try {
        // Fallback to non-recursive watching and watch subdirectories manually
        postsWatcher = fsSync.watch(POSTS_DIR, (eventType, filename) => {
          if (filename && (filename.endsWith('.md') || filename.endsWith('index.md'))) {
            console.log(`📝 Post ${eventType}: ${filename} - refreshing cache`);
            postsCache = null; // Invalidate cache immediately
          }
        });
        
        // Also watch each subdirectory (for folder-based posts)
        watchPostSubdirectories();
        console.log(`👀 Watching posts directory (non-recursive): ${POSTS_DIR}`);
      } catch (fallbackError) {
        console.warn('⚠️  Could not watch posts directory:', fallbackError.message);
        console.log('📊 Using polling fallback only');
      }
    } else {
      console.warn('⚠️  Could not watch posts directory:', error.message);
    }
  }
  
  // Polling fallback for volume mounts (checks every 2 seconds)
  setInterval(async () => {
    await checkForDirectoryChanges();
  }, 2000);
}

// Watch subdirectories for folder-based posts (Linux compatibility)
function watchPostSubdirectories() {
  try {
    const entries = fsSync.readdirSync(POSTS_DIR, { withFileTypes: true });
    const directories = entries.filter(entry => entry.isDirectory());
    
    directories.forEach(dir => {
      const dirPath = path.join(POSTS_DIR, dir.name);
      try {
        fsSync.watch(dirPath, (eventType, filename) => {
          if (filename && (filename.endsWith('.md') || filename.endsWith('index.md'))) {
            console.log(`📝 Post ${eventType}: ${dir.name}/${filename} - refreshing cache`);
            postsCache = null; // Invalidate cache immediately
          }
        });
      } catch (error) {
        console.warn(`⚠️  Could not watch subdirectory ${dir.name}:`, error.message);
      }
    });
    
    if (directories.length > 0) {
      console.log(`👀 Watching ${directories.length} post subdirectories`);
    }
  } catch (error) {
    console.warn('⚠️  Could not read posts directory for subdirectory watching:', error.message);
  }
}

// Check for directory changes (polling fallback)
async function checkForDirectoryChanges() {
  const now = Date.now();
  if (now - lastDirectoryCheck < 1500) return; // Throttle checks
  
  lastDirectoryCheck = now;
  
  try {
    const entries = await fs.readdir(POSTS_DIR, { withFileTypes: true });
    const postDirs = entries.filter(entry => entry.isDirectory());
    const markdownFiles = entries.filter(entry => entry.isFile() && entry.name.endsWith('.md'));
    
    let hasChanges = false;
    const currentStats = new Map();
    
    // Check standalone markdown files
    for (const file of markdownFiles) {
      const filePath = path.join(POSTS_DIR, file.name);
      const stats = await fs.stat(filePath);
      const lastModified = stats.mtime.getTime();
      
      currentStats.set(file.name, lastModified);
      
      if (!directoryStats.has(file.name) || directoryStats.get(file.name) !== lastModified) {
        hasChanges = true;
        console.log(`📝 Post change detected: ${file.name}`);
      }
    }
    
    // Check directory-based posts with index.md
    for (const dir of postDirs) {
      const indexPath = path.join(POSTS_DIR, dir.name, 'index.md');
      try {
        const stats = await fs.stat(indexPath);
        const lastModified = stats.mtime.getTime();
        const key = `${dir.name}/index.md`;
        
        currentStats.set(key, lastModified);
        
        if (!directoryStats.has(key) || directoryStats.get(key) !== lastModified) {
          hasChanges = true;
          console.log(`📝 Post change detected: ${key}`);
        }
      } catch (error) {
        // index.md doesn't exist in this directory
      }
    }
    
    // Check for deleted files
    for (const [file] of directoryStats) {
      if (!currentStats.has(file)) {
        hasChanges = true;
        console.log(`🗑️ Post deleted: ${file}`);
      }
    }
    
    if (hasChanges) {
      directoryStats = currentStats;
      postsCache = null; // Invalidate cache
    }
  } catch (error) {
    console.warn('Error checking directory changes:', error.message);
  }
}

// Load and parse blog posts
async function loadPosts() {
  if (postsCache) {
    return postsCache;
  }

  try {
    await fs.access(POSTS_DIR);
  } catch {
    // Create posts directory and sample posts if they don't exist
    await fs.mkdir(POSTS_DIR, { recursive: true });
    await createSamplePosts();
  }

  const entries = await fs.readdir(POSTS_DIR, { withFileTypes: true });
  const posts = [];
  
  // Process standalone markdown files
  const markdownFiles = entries.filter(entry => entry.isFile() && entry.name.endsWith('.md'));
  for (const file of markdownFiles) {
    const filePath = path.join(POSTS_DIR, file.name);
    const post = await parsePost(filePath, file.name);
    if (post) posts.push(post);
  }
  
  // Process directory-based posts with index.md
  const directories = entries.filter(entry => entry.isDirectory());
  for (const dir of directories) {
    const indexPath = path.join(POSTS_DIR, dir.name, 'index.md');
    try {
      await fs.access(indexPath);
      const post = await parsePost(indexPath, dir.name);
      if (post) posts.push(post);
    } catch {
      // No index.md in this directory, skip
    }
  }
  
  // Sort by date (newest first)
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  postsCache = posts;
  
  return posts;
}

// Parse a single post file
async function parsePost(filePath, identifier) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    
    // Extract the post directory for relative image paths
    const postDir = path.dirname(filePath);
    const postDirName = path.basename(postDir);
    const isDirectoryPost = path.basename(filePath) === 'index.md';
    
    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    let metadata = {};
    let markdownContent = content;
    
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      markdownContent = frontmatterMatch[2];
      
      // Parse YAML-like frontmatter
      frontmatter.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
          const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
          if (key.trim() === 'tags' && value.includes(',')) {
            metadata[key.trim()] = value;
          } else {
            metadata[key.trim()] = value;
          }
        }
      });
    }
    
    // Process markdown with relative image support
    let processedMarkdown = markdownContent;
    if (isDirectoryPost) {
      // Replace relative image paths with absolute paths
      processedMarkdown = markdownContent.replace(
        /!\[([^\]]*)\]\((?!http)([^)]+)\)/g,
        (match, alt, src) => {
          // Convert relative path to absolute path
          const imagePath = `/api/posts/${postDirName}/assets/${src}`;
          return `![${alt}](${imagePath})`;
        }
      );
    }
    
    const htmlContent = marked(processedMarkdown);
    const excerpt = markdownContent.substring(0, 200) + '...';
    
    // Use directory name or filename as ID
    const postId = isDirectoryPost ? postDirName : path.basename(identifier, '.md');
    
    return {
      id: postId,
      title: metadata.title || postId.replace(/-/g, ' '),
      author: metadata.author || 'Anonymous',
      date: metadata.date || stats.birthtime.toISOString().split('T')[0],
      tags: metadata.tags ? parseTags(metadata.tags) : [],
      excerpt: metadata.excerpt || excerpt,
      content: htmlContent,
      readTime: Math.ceil(markdownContent.split(' ').length / 200),
      isDirectoryPost
    };
  } catch (error) {
    console.error(`Error parsing post ${filePath}:`, error);
    return null;
  }
}

// Create sample posts
async function createSamplePosts() {
  const samplePosts = [
    {
      filename: '2024-01-01-welcome-to-my-blog.md',
      content: `---
title: Welcome to My Minimalist Blog
author: Blog Author
date: 2024-01-01
tags: welcome, introduction
excerpt: A warm welcome to my new minimalist blog platform
---

# Welcome to My Minimalist Blog

Welcome to my new blog! This is a minimalist blogging platform built with simplicity and performance in mind.

## Features

- **Fast Loading**: Built with vanilla JavaScript for optimal performance
- **Infinite Scroll**: Seamlessly browse through all posts
- **Markdown Support**: Write posts in markdown with syntax highlighting
- **Responsive Design**: Looks great on all devices
- **Clean UI**: Minimalist design that focuses on content

## Code Example

Here's a simple JavaScript function:

\`\`\`javascript
function greetReader(name) {
  console.log(\`Hello, \${name}! Welcome to the blog.\`);
}

greetReader('Reader');
\`\`\`

Enjoy browsing through the content!`
    },
    {
      filename: '2024-01-02-building-with-vanilla-js.md',
      content: `---
title: Building Modern Apps with Vanilla JavaScript
author: Blog Author
date: 2024-01-02
tags: javascript, web-development, performance
excerpt: Why vanilla JavaScript is still a powerful choice for modern web applications
---

# Building Modern Apps with Vanilla JavaScript

In an era of complex frameworks, vanilla JavaScript remains a powerful and efficient choice for building web applications.

## Why Vanilla JavaScript?

1. **Performance**: No framework overhead
2. **Simplicity**: Direct control over functionality
3. **Learning**: Better understanding of core concepts
4. **Compatibility**: Works everywhere

## Modern JavaScript Features

ES6+ gives us amazing tools:

\`\`\`javascript
// Async/await for clean asynchronous code
async function fetchPosts() {
  try {
    const response = await fetch('/api/posts');
    const posts = await response.json();
    return posts;
  } catch (error) {
    console.error('Failed to fetch posts:', error);
  }
}

// Destructuring for clean code
const { title, author, date } = post;

// Template literals for dynamic content
const html = \`
  <article>
    <h2>\${title}</h2>
    <p>By \${author} on \${date}</p>
  </article>
\`;
\`\`\`

The key is leveraging modern JavaScript features while keeping things simple and maintainable.`
    },
    {
      filename: '2024-01-03-infinite-scroll-implementation.md',
      content: `---
title: Implementing Smooth Infinite Scroll
author: Blog Author
date: 2024-01-03
tags: javascript, ux, performance, infinite-scroll
excerpt: Learn how to implement efficient infinite scroll using Intersection Observer API
---

# Implementing Smooth Infinite Scroll

Infinite scroll provides a seamless browsing experience. Here's how to implement it efficiently using modern web APIs.

## The Intersection Observer Approach

The Intersection Observer API is perfect for infinite scroll:

\`\`\`javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !isLoading) {
      loadMorePosts();
    }
  });
}, {
  root: null,
  rootMargin: '100px',
  threshold: 0.1
});

// Observe the sentinel element
observer.observe(sentinel);
\`\`\`

## Benefits

- **Performance**: Only triggers when needed
- **Battery Friendly**: No constant scroll event listening
- **Smooth**: Built-in browser optimization
- **Flexible**: Easy to configure thresholds

## Implementation Tips

1. Use a sentinel element at the bottom
2. Add loading states for better UX
3. Implement error handling
4. Consider pagination limits

This approach ensures smooth scrolling performance across all devices while maintaining a great user experience.`
    }
  ];

  for (const post of samplePosts) {
    await fs.writeFile(path.join(POSTS_DIR, post.filename), post.content);
  }
}

// API Routes

// Get application version
app.get('/api/version', (req, res) => {
  const packageJson = require('../package.json');
  res.json({ 
    version: packageJson.version,
    name: packageJson.name 
  });
});

// Get paginated posts
app.get('/api/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const allPosts = await loadPosts();
    const totalPosts = allPosts.length;
    const posts = allPosts.slice(offset, offset + limit);
    
    res.json({
      posts: posts.map(post => ({
        ...post,
        content: undefined, // Don't include full content in list view
      })),
      pagination: {
        page,
        limit,
        total: totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        hasNext: offset + limit < totalPosts,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get posts by tag
app.get('/api/posts/tag/:tag', async (req, res) => {
  try {
    const tag = req.params.tag.toLowerCase();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const allPosts = await loadPosts();
    
    // Filter posts by tag (case-insensitive)
    const filteredPosts = allPosts.filter(post => 
      post.tags && post.tags.some(postTag => 
        postTag.toLowerCase() === tag
      )
    );
    
    const totalPosts = filteredPosts.length;
    const posts = filteredPosts.slice(offset, offset + limit);
    
    res.json({
      posts: posts.map(post => ({
        ...post,
        content: undefined, // Don't include full content in list view
      })),
      pagination: {
        page,
        limit,
        total: totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        hasNext: offset + limit < totalPosts,
        hasPrev: page > 1
      },
      tag: req.params.tag
    });
  } catch (error) {
    console.error('Error fetching posts by tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tags with post counts
app.get('/api/tags', async (req, res) => {
  try {
    const allPosts = await loadPosts();
    const tagCounts = {};
    
    // Count posts for each tag
    allPosts.forEach(post => {
      if (post.tags && post.tags.length > 0) {
        post.tags.forEach(tag => {
          const normalizedTag = tag.toLowerCase();
          tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
        });
      }
    });
    
    // Convert to array and sort by count (descending)
    const tags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
    
    res.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search posts
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const allPosts = await loadPosts();
    const searchTerm = query.toLowerCase().trim();
    
    // Search in title, content (markdown), tags, author, and excerpt
    const filteredPosts = allPosts.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(searchTerm);
      const contentMatch = post.content.toLowerCase().includes(searchTerm);
      const excerptMatch = post.excerpt.toLowerCase().includes(searchTerm);
      const authorMatch = post.author.toLowerCase().includes(searchTerm);
      const tagMatch = post.tags && post.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm)
      );
      
      return titleMatch || contentMatch || excerptMatch || authorMatch || tagMatch;
    });
    
    const totalResults = filteredPosts.length;
    const posts = filteredPosts.slice(offset, offset + limit);
    
    res.json({
      posts: posts.map(post => ({
        ...post,
        content: undefined, // Don't include full content in search results
      })),
      pagination: {
        page,
        limit,
        total: totalResults,
        totalPages: Math.ceil(totalResults / limit),
        hasNext: offset + limit < totalResults,
        hasPrev: page > 1
      },
      query: req.query.q,
      resultsCount: totalResults
    });
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve assets (images) from post directories
app.get('/api/posts/:postId/assets/*', async (req, res) => {
  try {
    const postId = req.params.postId;
    const assetPath = req.params[0]; // Get the rest of the path after /assets/
    
    // Construct the full path to the asset
    const fullPath = path.join(POSTS_DIR, postId, assetPath);
    
    // Security: Ensure the path doesn't escape the post directory
    const resolvedPath = path.resolve(fullPath);
    const postDir = path.resolve(path.join(POSTS_DIR, postId));
    
    if (!resolvedPath.startsWith(postDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if file exists
    try {
      await fs.access(resolvedPath);
      res.sendFile(resolvedPath);
    } catch {
      res.status(404).json({ error: 'Asset not found' });
    }
  } catch (error) {
    console.error('Error serving asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single post
app.get('/api/posts/:id', async (req, res) => {
  try {
    const posts = await loadPosts();
    const post = posts.find(p => p.id === req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Blog server running on http://localhost:${PORT}`);
  console.log(`📁 Posts directory: ${POSTS_DIR}`);
  
  // Initialize file watcher after server starts
  initializePostsWatcher();
});

module.exports = app;