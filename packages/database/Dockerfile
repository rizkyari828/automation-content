FROM public.ecr.aws/docker/library/node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/package.json

RUN npm ci

COPY packages/database ./packages/database

CMD ["npm", "run", "migrate:up", "--workspace", "@creatorflow/database"]
