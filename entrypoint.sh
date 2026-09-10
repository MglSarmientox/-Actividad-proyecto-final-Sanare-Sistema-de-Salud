#!/bin/sh
set -e

echo "Iniciando Redis en segundo plano..."
redis-server --daemonize yes
until redis-cli ping >/dev/null 2>&1; do
  echo "Esperando a Redis..."
  sleep 1
done
echo "Redis listo."

echo "Aplicando migraciones de Prisma..."
npx prisma migrate deploy

echo "Cargando datos de ejemplo (seed)..."
npx ts-node prisma/seed.ts

echo "Arrancando la API..."
exec node dist/main.js