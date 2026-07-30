# syntax=docker/dockerfile:1

# ───────────────────────── deps ─────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ───────────────────────── build ─────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time values baked into the client bundle. Override with
# --build-arg or a docker-compose `args:` block.
ARG NEXT_PUBLIC_SITE_URL=https://celaning.com
ARG NEXT_PUBLIC_ADSENSE_CLIENT=
ARG NEXT_PUBLIC_AD_HOME_MID=
ARG NEXT_PUBLIC_AD_HOME_BOTTOM=
ARG NEXT_PUBLIC_AD_TOOLS_GRID=
ARG NEXT_PUBLIC_AD_TOOL_BELOW=
ARG NEXT_PUBLIC_AD_TOOL_SIDEBAR=
ARG NEXT_PUBLIC_AD_CATEGORY_TOP=
ARG NEXT_PUBLIC_AD_BLOG_INARTICLE=
ARG NEXT_PUBLIC_AD_BLOG_LIST=
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_ADSENSE_CLIENT=$NEXT_PUBLIC_ADSENSE_CLIENT \
    NEXT_PUBLIC_AD_HOME_MID=$NEXT_PUBLIC_AD_HOME_MID \
    NEXT_PUBLIC_AD_HOME_BOTTOM=$NEXT_PUBLIC_AD_HOME_BOTTOM \
    NEXT_PUBLIC_AD_TOOLS_GRID=$NEXT_PUBLIC_AD_TOOLS_GRID \
    NEXT_PUBLIC_AD_TOOL_BELOW=$NEXT_PUBLIC_AD_TOOL_BELOW \
    NEXT_PUBLIC_AD_TOOL_SIDEBAR=$NEXT_PUBLIC_AD_TOOL_SIDEBAR \
    NEXT_PUBLIC_AD_CATEGORY_TOP=$NEXT_PUBLIC_AD_CATEGORY_TOP \
    NEXT_PUBLIC_AD_BLOG_INARTICLE=$NEXT_PUBLIC_AD_BLOG_INARTICLE \
    NEXT_PUBLIC_AD_BLOG_LIST=$NEXT_PUBLIC_AD_BLOG_LIST \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ───────────────────────── runtime ─────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
