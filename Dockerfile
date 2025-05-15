# Build stage
FROM node:20.11.1-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ libc6-compat git

WORKDIR /app

# Copy package files
COPY package*.json .nvmrc ./

# Install dependencies with Husky
RUN npm ci && \
    npm install @astrojs/node

# Copy source files
COPY . .

# Build the application using Docker config
RUN npm run build

# Production stage
FROM node:20.11.1-alpine AS runner

WORKDIR /app

# Install production dependencies only, skipping prepare script
COPY --from=builder /app/package*.json ./
RUN npm pkg delete scripts.prepare && \
    npm ci --omit=dev && \
    npm install @astrojs/node server-destroy send

# Copy built application
COPY --from=builder /app/dist ./dist

# Create and use non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

USER nodejs

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=8080
ENV NODE_ENV=production
ENV ENV_NAME=prod

# Expose port
EXPOSE 8080

# Start the application in production mode
CMD ["node", "./dist/server/entry.mjs"] 