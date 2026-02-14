# Multi-stage build для оптимизации размера образа

# Stage 1: Dependencies
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN npm i -g npm@11.8.0
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:24-alpine AS builder
RUN npm i -g npm@11.8.0
WORKDIR /app

# Копируем зависимости из предыдущего stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/public

# Устанавливаем переменные окружения для сборки
ENV NEXT_TELEMETRY_DISABLED=1

# Собираем приложение
RUN npm run build

# Stage 3: Runner с Playwright
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Системный Chromium (Alpine) — без загрузки браузеров Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Создаем непривилегированного пользователя
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем необходимые файлы
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/assets ./assets

# Устанавливаем права доступа
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Использовать системный Chromium (Alpine)
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

CMD ["node", "server.js"]