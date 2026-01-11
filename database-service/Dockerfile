# Database Service Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared module
COPY shared /app/shared

# Copy service files
COPY database-service/package*.json ./
RUN npm ci

COPY database-service/tsconfig.json ./
COPY database-service/src ./src

# Build
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy shared module for runtime
COPY shared /app/shared

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

RUN npm ci --only=production

EXPOSE 5000

CMD ["node", "dist/index.js"]
