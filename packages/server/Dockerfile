# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY packages/server/package*.json ./
RUN npm ci

FROM deps AS build
COPY packages/server/tsconfig.json ./
COPY packages/server/src ./src
RUN npm run build

FROM base AS prod-deps
COPY packages/server/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copie uniquement les deps prod et le build
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY packages/server/package*.json ./

EXPOSE 3001
CMD ["node", "dist/index.js"]

