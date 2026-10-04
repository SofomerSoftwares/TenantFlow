# syntax=docker/dockerfile:1
# Multi-stage Dockerfile for Tenant List Updater on Render or Docker-compatible PaaS

# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies needed for build
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Vite frontend and production server
RUN npm run build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

# Install dumb-init or bash for signal handling if needed
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -S nodejs -g 1001 && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy package.json and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built frontend assets and server from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 10000

# Health check to ensure service is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:10000/api/db/status || exit 1

CMD ["npm", "start"]
