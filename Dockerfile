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
ENV NEXT_TELEMETRY_DISABLED 1

ARG NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
ARG NEXT_PUBLIC_PIXABAY_API_KEY
ARG NEXT_PUBLIC_PEXELS_API_KEY

ENV NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=$NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
ENV NEXT_PUBLIC_PIXABAY_API_KEY=$NEXT_PUBLIC_PIXABAY_API_KEY
ENV NEXT_PUBLIC_PEXELS_API_KEY=$NEXT_PUBLIC_PEXELS_API_KEY

RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown node:node .next

RUN mkdir /data && chown node:node /data
RUN mkdir /images && chown node:node /images

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
