# Using Apple Container with Blog App

## Build the Container Image

```bash
# Navigate to your blog directory
cd /Users/rlamour/Developer/code/tests/blog

# Build the container image
container build -t blog-app .
```

## Run the Container

```bash
# Run the container with port mapping
container run -p 3000:3000 blog-app

# Or run in detached mode (background)
container run -d -p 3000:3000 --name blog-container blog-app
```

## Container Management Commands

```bash
# List running containers
container ps

# Stop the container
container stop blog-container

# Remove the container
container rm blog-container

# View container logs
container logs blog-container

# Execute commands inside running container
container exec -it blog-container sh
```

## Access Your Blog

Once running, access your blog at:
- http://localhost:3000

## Alternative: Manual Setup (No Container)

If you prefer to run without containers:

```bash
# Navigate to source directory
cd src

# Install dependencies
npm install

# Start the server
npm start
```

## Troubleshooting

If you encounter issues with the container build:

1. **Check container version**: `container --version`
2. **Verify Dockerfile syntax**: The Dockerfile follows standard Docker syntax which should be compatible
3. **Build with verbose output**: `container build -t blog-app . --verbose`
4. **Check system requirements**: Ensure Apple Container supports Node.js base images

## Notes

- The container exposes port 3000 internally
- Uses Node.js 18 Alpine Linux base image
- Runs as non-root user for security
- Includes health check endpoint at `/api/health`