ARG NODE_ALPINE_IMAGE=node:22-alpine
FROM ${NODE_ALPINE_IMAGE}

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/package.json

RUN npm ci

COPY packages/database ./packages/database

CMD ["npm", "run", "migrate:up", "--workspace", "@creatorflow/database"]
