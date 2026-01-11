# LLM Gateway Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy and install shared module dependencies
COPY shared/package*.json ../shared/
COPY shared/*.js ../shared/
COPY shared/*.d.ts ../shared/
RUN cd ../shared && npm ci --only=production

# Copy service files
COPY llm-gateway/package*.json ./

# Install dependencies (this will link shared module)
RUN npm ci

COPY llm-gateway/tsconfig.json ./
COPY llm-gateway/src ./src

# Build
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy shared module (pre-built)
COPY shared/package*.json ../shared/
COPY shared/*.js ../shared/
COPY shared/*.d.ts ../shared/
RUN cd ../shared && npm ci --only=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

RUN npm ci --only=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
