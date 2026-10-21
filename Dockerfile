# Stage 1: Base image
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 3: Build application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

# Stage 4: Production runner (Node.js)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy runtime dependencies and build artifacts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db ./src/db

EXPOSE 3000

# Container healthcheck using Node's native fetch
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node --eval 'fetch("http://localhost:3000/").then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))'

CMD ["npx", "tsx", "server.ts"]
