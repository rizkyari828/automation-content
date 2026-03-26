FROM public.ecr.aws/docker/library/node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/logger/package.json ./packages/logger/package.json
RUN npm ci

FROM deps AS builder
COPY apps/api-gateway/tsconfig.json ./apps/api-gateway/tsconfig.json
COPY apps/api-gateway/src ./apps/api-gateway/src
COPY packages/auth/index.js ./packages/auth/index.js
COPY packages/auth/index.d.ts ./packages/auth/index.d.ts
COPY packages/logger/index.js ./packages/logger/index.js
COPY packages/logger/index.d.ts ./packages/logger/index.d.ts
RUN npm run build --workspace @creatorflow/api-gateway

FROM public.ecr.aws/docker/library/node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/auth ./packages/auth
COPY --from=builder /app/packages/logger ./packages/logger
COPY --from=builder /app/apps/api-gateway/package.json ./apps/api-gateway/package.json
COPY --from=builder /app/apps/api-gateway/dist ./apps/api-gateway/dist

EXPOSE 4000

CMD ["node", "apps/api-gateway/dist/index.js"]
