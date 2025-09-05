/**
 * Modern Dark Blog Application
 * Vanilla JavaScript with infinite scroll and modern dark theme
 */

class BlogApp {
  constructor() {
    this.currentPage = 1;
    this.isLoading = false;
    this.hasMorePosts = true;
    this.posts = [];
    this.observer = null;
    this.currentTag = null; // Track current tag filter
    this.currentSearch = null; // Track current search query
    this.searchTimeout = null; // Debounce search requests
    this.allTags = []; // Store all available tags
    // Modern dark theme is default - no theme switching needed
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupIntersectionObserver();
    this.loadTags(); // Load available tags
    this.loadInitialPosts();
  }

  // Modern dark theme implementation - no switching required

  // Event Listeners
  setupEventListeners() {
    // Modern dark theme - no toggle required

    // Scroll to top
    const scrollTopBtn = document.getElementById('scroll-top');
    scrollTopBtn?.addEventListener('click', () => this.scrollToTop());

    // Window scroll for scroll-to-top button
    window.addEventListener('scroll', this.throttle(() => {
      const scrollY = window.scrollY;
      const scrollTopBtn = document.getElementById('scroll-top');
      
      if (scrollY > 300) {
        scrollTopBtn?.classList.add('visible');
      } else {
        scrollTopBtn?.classList.remove('visible');
      }
    }, 100));

    // Error modal close
    const modalClose = document.getElementById('modal-close');
    modalClose?.addEventListener('click', () => this.hideErrorModal());

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideErrorModal();
      }
    });

    // Handle online/offline status
    window.addEventListener('online', () => {
      this.showNotification('Connexion rétablie', 'success');
    });

    window.addEventListener('offline', () => {
      this.showNotification('Vous êtes hors ligne', 'warning');
    });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    
    searchInput?.addEventListener('input', (e) => this.handleSearchInput(e.target.value));
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.performSearch(e.target.value);
      }
    });
    
    searchClear?.addEventListener('click', () => this.clearSearch());
  }

  // Intersection Observer for Infinite Scroll
  setupIntersectionObserver() {
    const sentinel = document.getElementById('loading-sentinel');
    
    if (!sentinel) {
      console.error('Loading sentinel not found');
      return;
    }

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isLoading && this.hasMorePosts) {
          this.loadMorePosts();
        }
      });
    }, options);

    this.observer.observe(sentinel);
  }

  // API Calls
  async loadInitialPosts() {
    this.currentPage = 1;
    this.posts = [];
    document.getElementById('blog-posts').innerHTML = '';
    this.updatePageHeader();
    await this.loadMorePosts();
  }

  async loadTags() {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        this.allTags = data.tags;
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  }

  async loadMorePosts() {
    if (this.isLoading || !this.hasMorePosts) return;

    this.setLoading(true);

    try {
      // Build URL based on current filter (search takes priority over tag)
      let url;
      if (this.currentSearch) {
        url = `/api/search?q=${encodeURIComponent(this.currentSearch)}&page=${this.currentPage}&limit=6`;
      } else if (this.currentTag) {
        url = `/api/posts/tag/${encodeURIComponent(this.currentTag)}?page=${this.currentPage}&limit=6`;
      } else {
        url = `/api/posts?page=${this.currentPage}&limit=6`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.posts && data.posts.length > 0) {
        this.posts.push(...data.posts);
        this.renderPosts(data.posts);
        this.currentPage++;
        this.hasMorePosts = data.pagination.hasNext;
        
        if (!this.hasMorePosts) {
          this.showEndIndicator();
        }
      } else {
        this.hasMorePosts = false;
        this.showEndIndicator();
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      this.showError(`Échec du chargement des articles : ${error.message}`);
      this.hasMorePosts = false;
    } finally {
      this.setLoading(false);
    }
  }

  // UI Rendering
  renderPosts(posts) {
    const container = document.getElementById('blog-posts');
    
    posts.forEach((post, index) => {
      const postElement = this.createPostElement(post);
      postElement.style.animationDelay = `${index * 0.1}s`;
      container.appendChild(postElement);
    });
  }

  createPostElement(post) {
    const article = document.createElement('article');
    article.className = 'post-card';
    article.setAttribute('data-post-id', post.id);

    const tagsHtml = post.tags?.length ? 
      post.tags.map(tag => `<span class="post-tag" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>`).join('') : '';

    const excerpt = post.content ? 
      this.truncateHtml(post.content, 300) : post.excerpt || '';

    article.innerHTML = `
      <header class="post-header">
        <h2 class="post-title">
          <a href="#post-${post.id}" data-post-id="${post.id}">
            ${this.escapeHtml(post.title)}
          </a>
        </h2>
        <div class="post-meta">
          <span class="post-author">${this.escapeHtml(post.author)}</span>
          <span class="post-date">${this.formatDate(post.date)}</span>
          <span class="post-read-time">${post.readTime} min de lecture</span>
        </div>
        ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}
      </header>
      <div class="post-excerpt">
        ${excerpt}
      </div>
      <a href="#post-${post.id}" class="read-more" data-post-id="${post.id}">
        Lire plus →
      </a>
    `;

    // Add click handlers for post links
    const postLinks = article.querySelectorAll('[data-post-id]');
    postLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.showFullPost(post.id);
      });
    });

    // Add click handlers for tags
    const tagElements = article.querySelectorAll('[data-tag]');
    tagElements.forEach(tagElement => {
      tagElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent post click
        const tag = tagElement.getAttribute('data-tag');
        this.filterByTag(tag);
      });
    });

    return article;
  }

  async showFullPost(postId) {
    const existingPost = this.posts.find(p => p.id === postId);
    
    if (existingPost && existingPost.content) {
      this.renderFullPost(existingPost);
      return;
    }

    // Fetch full post content
    try {
      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const post = await response.json();
      this.renderFullPost(post);
      
      // Update posts cache
      const index = this.posts.findIndex(p => p.id === postId);
      if (index !== -1) {
        this.posts[index] = post;
      }
    } catch (error) {
      this.showError(`Échec du chargement de l'article : ${error.message}`);
    }
  }

  renderFullPost(post) {
    const container = document.getElementById('blog-posts');
    container.innerHTML = '';

    const article = document.createElement('article');
    article.className = 'post-card post-full';
    
    const tagsHtml = post.tags?.length ? 
      post.tags.map(tag => `<span class="post-tag" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>`).join('') : '';

    article.innerHTML = `
      <header class="post-header">
        <button class="back-button" id="back-to-posts">← Retour à tous les articles</button>
        <h1 class="post-title">${this.escapeHtml(post.title)}</h1>
        <div class="post-meta">
          <span class="post-author">${this.escapeHtml(post.author)}</span>
          <span class="post-date">${this.formatDate(post.date)}</span>
          <span class="post-read-time">${post.readTime} min de lecture</span>
        </div>
        ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}
      </header>
      <div class="post-content">
        ${post.content}
      </div>
    `;

    // Add event listener for back button
    const backButton = article.querySelector('#back-to-posts');
    backButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.goBack();
    });

    container.appendChild(article);
    this.scrollToTop();
    
    // Update URL without page reload
    window.history.pushState({ postId: post.id }, post.title, `#post-${post.id}`);
  }

  goBack() {
    // Reset pagination state
    this.currentPage = 1;
    this.hasMorePosts = true;
    this.posts = [];
    this.currentTag = null; // Clear tag filter
    
    // Clear the container
    const container = document.getElementById('blog-posts');
    if (container) {
      container.innerHTML = '';
    } else {
      console.error('Blog posts container not found');
      return;
    }
    
    // Hide end indicator if visible
    const endIndicator = document.getElementById('end-indicator');
    if (endIndicator) {
      endIndicator.style.display = 'none';
    }
    
    // Load initial posts
    this.loadInitialPosts()
      .catch(error => {
        console.error('Error reloading posts:', error);
        this.showError('Échec du rechargement des articles');
      });
    
    // Update browser history
    window.history.pushState({}, 'Blog', '/');
  }

  // Tag filtering functionality
  async filterByTag(tag) {
    this.currentTag = tag;
    this.currentPage = 1;
    this.hasMorePosts = true;
    this.posts = [];
    
    // Clear the container
    const container = document.getElementById('blog-posts');
    if (container) {
      container.innerHTML = '';
    }
    
    // Hide end indicator
    const endIndicator = document.getElementById('end-indicator');
    if (endIndicator) {
      endIndicator.style.display = 'none';
    }
    
    // Update page header and load filtered posts
    this.updatePageHeader();
    await this.loadMorePosts();
    
    // Update browser history
    window.history.pushState({ tag }, `Articles avec le tag "${tag}"`, `#tag-${encodeURIComponent(tag)}`);
  }

  clearTagFilter() {
    // Reset all pagination state
    this.currentTag = null;
    this.currentPage = 1;
    this.hasMorePosts = true;
    this.posts = [];
    
    // Clear the container
    const container = document.getElementById('blog-posts');
    if (container) {
      container.innerHTML = '';
    }
    
    // Hide end indicator if visible
    const endIndicator = document.getElementById('end-indicator');
    if (endIndicator) {
      endIndicator.style.display = 'none';
    }
    
    // Load initial posts
    this.loadInitialPosts()
      .catch(error => {
        console.error('Error reloading posts:', error);
        this.showError('Échec du rechargement des articles');
      });
    
    // Update browser history
    window.history.pushState({}, 'Blog', '/');
  }

  // Search functionality
  handleSearchInput(query) {
    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Update search clear button visibility
    const searchClear = document.getElementById('search-clear');
    if (searchClear) {
      searchClear.style.display = query.length > 0 ? 'block' : 'none';
    }
    
    // Debounce search (300ms delay)
    this.searchTimeout = setTimeout(() => {
      this.performSearch(query);
    }, 300);
  }
  
  async performSearch(query) {
    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length === 0) {
      this.clearSearch();
      return;
    }
    
    if (trimmedQuery.length < 2) {
      // Don't search for single characters
      return;
    }
    
    this.currentSearch = trimmedQuery;
    this.currentTag = null; // Clear tag filter when searching
    this.currentPage = 1;
    this.hasMorePosts = true;
    this.posts = [];
    
    // Clear the container
    const container = document.getElementById('blog-posts');
    if (container) {
      container.innerHTML = '';
    }
    
    // Hide end indicator
    const endIndicator = document.getElementById('end-indicator');
    if (endIndicator) {
      endIndicator.style.display = 'none';
    }
    
    // Update page header and load search results
    this.updatePageHeader();
    await this.loadMorePosts();
  }
  
  clearSearch() {
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    
    if (searchInput) {
      searchInput.value = '';
    }
    if (searchClear) {
      searchClear.style.display = 'none';
    }
    
    // Reset search state
    this.currentSearch = null;
    this.currentPage = 1;
    this.hasMorePosts = true;
    this.posts = [];
    
    // Clear the container
    const container = document.getElementById('blog-posts');
    if (container) {
      container.innerHTML = '';
    }
    
    // Hide end indicator if visible
    const endIndicator = document.getElementById('end-indicator');
    if (endIndicator) {
      endIndicator.style.display = 'none';
    }
    
    // Update page header and load initial posts
    this.updatePageHeader();
    this.loadInitialPosts()
      .catch(error => {
        console.error('Error reloading posts:', error);
        this.showError('Échec du rechargement des articles');
      });
  }

  updatePageHeader() {
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    
    if (this.currentSearch) {
      heroTitle.textContent = `Résultats de recherche`;
      heroSubtitle.innerHTML = `
        <div class="search-results-info">
          Recherche pour "<span class="search-query">${this.currentSearch}</span>"
          <button class="clear-filter-btn" id="clear-search-button">
            ← Retour à tous les articles
          </button>
        </div>
      `;
      
      // Add event listener to the clear search button
      const clearBtn = document.getElementById('clear-search-button');
      if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.clearSearch();
        });
      }
    } else if (this.currentTag) {
      heroTitle.textContent = `Articles avec le tag "${this.currentTag}"`;
      heroSubtitle.innerHTML = `
        <button class="clear-filter-btn" id="clear-filter-button">
          ← Retour à tous les articles
        </button>
      `;
      
      // Add event listener to the clear filter button
      const clearBtn = document.getElementById('clear-filter-button');
      if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.clearTagFilter();
        });
      }
    } else {
      heroTitle.textContent = 'Blue Archer';
      heroSubtitle.textContent = 'Mon univers : technologie, jeux-vidéo, idées et pensées';
    }
  }

  // Loading States
  setLoading(loading) {
    this.isLoading = loading;
    const indicator = document.getElementById('loading-indicator');
    
    if (loading) {
      indicator?.classList.add('visible');
    } else {
      indicator?.classList.remove('visible');
    }
  }

  showEndIndicator() {
    const indicator = document.getElementById('end-indicator');
    indicator.style.display = 'block';
    
    // Hide loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.style.display = 'none';
  }

  // Error Handling
  showError(message) {
    const modal = document.getElementById('error-modal');
    const messageEl = document.getElementById('error-message');
    
    messageEl.textContent = message;
    modal.style.display = 'flex';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideErrorModal();
    }, 5000);
  }

  hideErrorModal() {
    const modal = document.getElementById('error-modal');
    modal.style.display = 'none';
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Utility Functions
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  debounce(func, wait, immediate) {
    let timeout;
    return function() {
      const context = this, args = arguments;
      const later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  truncateHtml(html, maxLength) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    
    if (text.length <= maxLength) return html;
    
    return text.substring(0, maxLength) + '...';
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('fr-FR', options);
  }

  // Performance monitoring
  measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name}: ${end - start} milliseconds`);
    return result;
  }
}

// Service Worker Registration removed for simplicity
// If needed in the future, create /sw.js file first

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  window.blogApp = new BlogApp();
});

// Handle browser back/forward
window.addEventListener('popstate', (event) => {
  if (event.state && event.state.postId) {
    window.blogApp.showFullPost(event.state.postId);
  } else if (event.state && event.state.tag) {
    window.blogApp.filterByTag(event.state.tag);
  } else {
    window.blogApp.goBack();
  }
});

// Handle initial page load with hash
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash;
  if (hash.startsWith('#tag-')) {
    const tag = decodeURIComponent(hash.replace('#tag-', ''));
    setTimeout(() => {
      window.blogApp.filterByTag(tag);
    }, 100); // Wait for app to initialize
  } else if (hash.startsWith('#post-')) {
    const postId = hash.replace('#post-', '');
    setTimeout(() => {
      window.blogApp.showFullPost(postId);
    }, 100);
  }
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .back-button {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 0.75rem 1.5rem;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: var(--transition);
    margin-bottom: 1.5rem;
    color: var(--text-primary);
    font-weight: 600;
    backdrop-filter: blur(10px);
  }

  .back-button:hover {
    background: var(--gradient-primary);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .post-full .post-title {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  /* Tag styling */
  .post-tag {
    cursor: pointer;
    transition: var(--transition);
    position: relative;
  }

  .post-tag:hover {
    background: linear-gradient(135deg, #c084fc, #f472b6);
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(196, 132, 252, 0.4);
  }

  .post-tag:active {
    transform: translateY(0);
  }

  /* Clear filter button */
  .clear-filter-btn {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: var(--transition);
    color: var(--text-primary);
    font-weight: 500;
    backdrop-filter: blur(10px);
  }

  .clear-filter-btn:hover {
    background: var(--gradient-primary);
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }

  @media (max-width: 768px) {
    .post-full .post-title {
      font-size: 2rem;
    }
  }
`;
document.head.appendChild(style);