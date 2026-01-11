# Vector Service Dockerfile
FROM node:20-alpine AS builder

# Install build dependencies for better-sqlite3 and sqlite-vec
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Copy and install shared module dependencies
COPY shared/package*.json ../shared/
COPY shared/*.js ../shared/
COPY shared/*.d.ts ../shared/
RUN cd ../shared && npm ci --only=production

# Copy service files
COPY vector-service/package*.json ./

# Install dependencies
RUN npm ci

COPY vector-service/tsconfig.json ./
COPY vector-service/src ./src

# Build
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy shared module (pre-built)
COPY shared/package*.json ../shared/
COPY shared/*.js ../shared/
COPY shared/*.d.ts ../shared/
RUN cd ../shared && npm ci --only=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Create data directory
RUN mkdir -p /app/data

EXPOSE 6000

CMD ["node", "dist/index.js"]
