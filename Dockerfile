# Production-ready Dockerfile optimized for Google Cloud Run
FROM node:22-alpine AS base

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \
  && npm cache clean --force

# Copy application source
COPY server.js ./
COPY routes ./routes
COPY data ./data
COPY public ./public

# Ensure non-root ownership and drop privileges for Cloud Run security
RUN chown -R node:node /app
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1

CMD ["node", "server.js"]
