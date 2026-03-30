FROM public.ecr.aws/docker/library/golang:1.25 AS go-builder

WORKDIR /src/services/media-processing-service

COPY services/media-processing-service/go.mod ./go.mod
COPY services/media-processing-service/go.sum ./go.sum
COPY services/media-processing-service/cmd ./cmd
COPY services/media-processing-service/internal ./internal

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/media-api ./cmd/api \
  && CGO_ENABLED=0 GOOS=linux go build -o /out/media-worker ./cmd/worker

FROM public.ecr.aws/docker/library/node:22-bookworm-slim AS renderer-deps

WORKDIR /app

COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY apps/api-gateway/package.json ./apps/api-gateway/package.json
COPY apps/web-ui/package.json ./apps/web-ui/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/event-contracts/package.json ./packages/event-contracts/package.json
COPY packages/logger/package.json ./packages/logger/package.json
COPY packages/template-video-renderer/package.json ./packages/template-video-renderer/package.json

RUN npm ci

FROM public.ecr.aws/docker/library/node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    wget \
  && rm -rf /var/lib/apt/lists/*

COPY --from=go-builder /out/media-api /usr/local/bin/media-api
COPY --from=go-builder /out/media-worker /usr/local/bin/media-worker
COPY --from=renderer-deps /app/node_modules ./node_modules
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY packages/template-video-renderer ./packages/template-video-renderer

CMD ["media-api"]
