FROM node:24-bookworm-slim AS base
WORKDIR /app
# Node 24 ships Corepack Yarn shims; replace them with the repository's verified Yarn 1.x toolchain.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg \
  && npm install --global yarn@1.22.22 --registry=https://registry.npmjs.org \
  && yarn --version

FROM base AS deps
ARG DATABASE_URL=postgresql://roost:roost@localhost:5432/roost
ENV DATABASE_URL=${DATABASE_URL}
COPY package.json yarn.lock ./
COPY prisma ./prisma
COPY prisma7.config.ts ./
RUN yarn install --frozen-lockfile --network-timeout 600000

FROM base AS builder
ARG DATABASE_URL=postgresql://roost:roost@localhost:5432/roost
ENV DATABASE_URL=${DATABASE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn prisma:generate
RUN yarn build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma7.config.ts ./prisma7.config.ts
EXPOSE 3000
CMD ["sh", "-c", "yarn db:deploy && yarn start"]
