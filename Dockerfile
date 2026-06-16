# Stage 1: install production deps + app
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src/index.js ./src/index.js

# Stage 2: minimal runtime — no shell/npm, runs as nonroot (uid 65532)
FROM gcr.io/distroless/nodejs24-debian12:nonroot
WORKDIR /app
COPY --from=builder /app /app

# Defaults; override at runtime. Secrets (API_TOKEN) must be injected, not baked in.
ENV CRON_EXPRESSION="*/5 * * * *"
ENV ZONE_ID=REPLACE_ME
ENV API_TOKEN=REPLACE_ME
ENV RECORD_ID=REPLACE_ME

# Image entrypoint is already `node`, so CMD is just the script path.
CMD ["src/index.js"]