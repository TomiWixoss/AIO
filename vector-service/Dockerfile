# Vector Service Dockerfile - Using Debian for sqlite-vec compatibility
FROM node:20-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y python3 make g++ git && rm -rf /var/lib/apt/lists/*

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
FROM node:20-slim AS runner

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
