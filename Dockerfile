FROM node:26-alpine AS base

RUN apk add --no-cache libc6-compat \
  && npm install --global corepack@latest \
  && corepack enable

FROM base AS dependances

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS construction

WORKDIR /app

# Next.js évalue certains modules serveur pendant le build. Ces valeurs ne sont
# présentes que dans cette étape ; Compose injecte les vraies valeurs au runtime.
ENV BETTER_AUTH_SECRET=build-only-secret-not-used-at-runtime-1234567890 \
    BETTER_AUTH_URL=http://localhost:3000 \
    GOOGLE_CLIENT_ID=build-only-google-client-id \
    GOOGLE_CLIENT_SECRET=build-only-google-client-secret \
    DATABASE_URL=postgresql://scouticket:scouticket@localhost:5432/scouticket

COPY --from=dependances /app/node_modules ./node_modules
COPY . .
# Pour la génération de sourcemap
# ARG CI_COMMIT_SHA
RUN pnpm build

FROM base AS execution

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts
COPY --from=construction /app/.next ./.next
COPY --from=construction /app/public ./public
COPY --from=construction /app/scripts/migrate-base-de-donnees.mjs ./scripts/migrate-base-de-donnees.mjs
COPY --from=construction /app/sql ./sql

EXPOSE 3000

CMD ["pnpm", "start"]
