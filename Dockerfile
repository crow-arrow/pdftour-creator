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
ENV NEXT_TELEMETRY_DISABLED 1

# Собираем приложение
RUN npm run build

# Stage 3: Runner с Playwright
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Устанавливаем системные зависимости для Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Устанавливаем Playwright и браузеры
RUN npm install -g playwright@^1.49.1
RUN playwright install chromium

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

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Устанавливаем переменные для Playwright
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

CMD ["node", "server.js"]