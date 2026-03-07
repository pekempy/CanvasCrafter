FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Explicitly copy .env to ensures it's available during build
COPY .env* ./

# No build-time API keys needed anymore (handled via server-side proxy)
# The .env* files are copied, so Next.js will pick up NEXT_PUBLIC_ variables from there.
# ARGs and ENV lines for NEXT_PUBLIC_ variables are removed as they are now redundant for the build process.
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown node:node .next

RUN mkdir /data && chown node:node /data
RUN mkdir /images && chown node:node /images

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/.env* ./

USER node
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
