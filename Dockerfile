# Use official Node.js runtime as the base image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Copy package files first for better caching
COPY src/package*.json ./

# Install dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy application code
COPY src/ .

# Create necessary directories and set permissions
RUN mkdir -p shared/posts && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "backend/server.js"]