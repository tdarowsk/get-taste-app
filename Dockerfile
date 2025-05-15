# Build stage
FROM node:22.14.0-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ libc6-compat git

WORKDIR /app

# Set production environment
ENV NODE_ENV=prod \
    ENV_NAME=prod

# Copy package files
COPY package*.json ./
COPY .nvmrc ./

# Install dependencies with Husky
RUN npm ci
RUN npm install @astrojs/node

# Copy source files
COPY . .

# Build the application using Docker config
RUN npm run build -- --config astro.config.docker.mjs

# Production stage
FROM node:22.14.0-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=prod \
    ENV_NAME=prod

# Install production dependencies only, skipping prepare script
COPY --from=builder /app/package*.json ./
RUN npm pkg delete scripts.prepare && \
    npm ci --omit=dev && \
    npm install @astrojs/node

# Copy built application
COPY --from=builder /app/dist ./dist

# Create and use non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001 \
    && chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=prod \
    ENV_NAME=prod \
    HOST=0.0.0.0 \
    PORT=3000

# Start the application
CMD ["node", "./dist/server/entry.mjs"]