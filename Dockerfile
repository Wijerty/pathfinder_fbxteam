# Multi-stage Dockerfile для PathFinder
FROM node:18-alpine AS base

# Устанавливаем зависимости для сборки
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем package files
COPY package.json package-lock.json* ./

# Устанавливаем зависимости
FROM base AS deps
RUN npm ci --only=production

# Сборка приложения
FROM base AS builder
# Копируем все зависимости
COPY package.json package-lock.json* ./
RUN npm ci

# Копируем исходный код
COPY . .

# Переменные окружения для сборки
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Собираем приложение
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Создаем пользователя nextjs
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем необходимые файлы
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Устанавливаем правильные права доступа
USER nextjs

# Открываем порт
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Запускаем приложение
CMD ["node", "server.js"]
