# ===== Etapa 1: construir el frontend (Vite/React) =====
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_URL=/api
RUN VITE_API_URL=$VITE_API_URL npm run build

# ===== Etapa 2: construir el backend (NestJS) =====
FROM node:22-bookworm-slim AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate && npm run build

# ===== Etapa 3: imagen final (API + frontend + Redis) =====
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    redis-server \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/prisma ./prisma
COPY --from=backend-build /app/backend/package.json ./package.json
COPY --from=backend-build /app/backend/tsconfig.json ./tsconfig.json
COPY --from=frontend-build /app/frontend/dist ./public

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["./entrypoint.sh"]