# SaludPública Sanare

Sistema de Gestión de Turnos para Centros de Salud Públicos. Fullstack: React + NestJS + PostgreSQL + Redis + Bull.

## Funcionalidades

- Triaje inteligente con IA (Google Gemini) que recomienda especialidad y urgencia.
- Reservas de turnos por especialidad/médico con horarios de 20 minutos.
- Autenticación JWT con roles `PATIENT`, `DOCTOR` y `ADMIN`.
- Prevención de race conditions: transacciones atómicas (`SELECT ... FOR UPDATE`) en Prisma.
- Notificaciones asíncronas con Bull + Redis y emails automáticos (Nodemailer + Gmail).
- Lista de espera: avisa por email cuando se libera un turno.
- Panel de administración con estadísticas, gráficos y tabla de turnos.
- Swagger auto-generado y colección Postman.

## Estructura

```
SaludPublicaConnect/
├── backend/        # NestJS + Prisma + Redis + Bull
├── frontend/       # React + TypeScript + Vite + TailwindCSS
├── docker-compose.yml   # dev local (PostgreSQL + Redis)
├── Dockerfile      # imagen para producción (backend + frontend + Redis)
├── render.yaml     # blueprint de despliegue en Render
└── README.md
```

## Requisitos

- Docker (posterior si Docker Desktop no está instalado: instálalo de https://www.docker.com)
- Node.js 20+ (probado con Node 26)

## Puesta en marcha

### 1. Levantar PostgreSQL + Redis

```bash
docker-compose up -d
```

- PostgreSQL → `localhost:5432` (postgres/postgres, DB `saludpublica`)
- Redis → `localhost:6379`
- Redis Commander → http://localhost:8081

### 2. Backend (puerto 3001)

```bash
cd backend
npm install
npm run prisma:generate   # genera el cliente Prisma
npm run prisma:migrate    # crea la base de datos (nombre: dev)
npm run prisma:seed       # 5 especialidades + 4 médicos + ~168 slots
npm run start:dev
```

- API: http://localhost:3001/api
- Swagger: http://localhost:3001/api (docs)

### 3. Frontend (puerto 3000)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # (opcional) agrega VITE_GEMINI_API_KEY
npm run dev
```

Frontend: http://localhost:3000

Cuentas de prueba (creadas por el seed):

| Rol | Email | Contraseña |
| --- | --- | --- |
| Admin | `admin@saludpublica.com` | `Admin123!` |
| Doctor | `dr.carlos@saludpublica.com` | `Doctor123!` |

## Variables de entorno

Backend `backend/.env` (ver `.env.example`):

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `REDIS_HOST` / `REDIS_PORT` | Conexión Redis |
| `JWT_SECRET` | Secreto para firmar tokens |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail para envío de emails (App Password). Si se deja vacío, los emails se loguean por consola (modo dev) |
| `FRONTEND_URL` | URL del frontend usada en los enlaces de los emails |

Frontend `frontend/.env.local` (ver `.env.local.example`):

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL de la API (default `http://localhost:3001/api`) |
| `VITE_GEMINI_API_KEY` | Opcional. Si falta, el triaje usa el modo heurístico |

## Endpoints principales

Autenticación: `POST /auth/register`, `POST /auth/login`, `GET /auth/profile`.
Especialidades: `GET /specialties`, `GET /specialties/:id`, `POST/PUT/DELETE` (ADMIN).
Médicos: `GET /doctors`, `GET /doctors?specialtyId=`, `GET /doctors/:id`, `GET /doctors/:id/available-slots?date=YYYY-MM-DD` + gestión de slots (ADMIN).
Turnos: `GET /appointments`, `POST /appointments` (PATIENT), `DELETE /appointments/:id`, `GET /appointments/stats` (ADMIN), `POST /appointments/waitlist/:doctorId`.
Públicos: `GET /appointments-public/token/:token`, `POST /appointments-public/cancel/:token`.
Notificaciones: `GET /notifications/queue-stats` (ADMIN).

## Notas

- Si no hay Docker instalado, instala PostgreSQL 16 y Redis 7 localmente y ajusta `.env`.
- El cron de recordatorios (Bull) revisa cada hora los turnos de las próximas 24h.
- La cancelación de un turno libera el slot e informa a la lista de espera.
- El proyecto es educativo/prototipo. Autor: Carlos Chaparro · Ficha 3139687.

## Scripts útiles

Backend: `npm run start:dev`, `npm run build`, `npm run prisma:studio` (UI en localhost:5555), `npm run prisma:seed`, `npm run lint`.
Frontend: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`.

## Despliegue en Render (un solo enlace público)

El proyecto se empaqueta en **un solo contenedor** (`Dockerfile`) que contiene la API NestJS, el frontend React compilado (servido por el propio backend) y Redis. Render crea además una base de datos PostgreSQL gratuita y conecta todo automáticamente.

Resultado: `https://tu-app.onrender.com` abre la aplicación completa y `https://tu-app.onrender.com/api` el Swagger/API.

### Pasos

1. Sube el proyecto a un repositorio (GitHub).
2. Crea tu cuenta en https://render.com (gratis).
3. En el dashboard pulsa **New → Blueprint** y conecta tu repositorio.
4. Render detecta `render.yaml` y crea automáticamente:
   - Un Web Service (`saludpublica-connect`, Docker) con tu repositorio.
   - Una base de datos PostgreSQL (`saludpublica-db`, plan free).
5. La primera vez Render te pedirá las variables marcadas como `sync: false`:
   - `JWT_SECRET`: pon un texto largo y aleatorio.
   - `FRONTEND_URL`: pon la URL definitiva del servicio, ej. `https://tu-app.onrender.com`.
   - `EMAIL_USER` / `EMAIL_PASS`: opcionales (para emails reales con Gmail App Password; si quedan vacíos los emails se loguean por consola).
6. Pulsa **Apply** y espera el build (5-10 min la primera vez).

### Notas del plan gratuito

- El servicio **se duerme tras ~15 min sin uso**; al abrir el enlace puede tardar hasta 50 s en la primera carga. Para la presentación, ábrelo un par de minutos antes o en una pestaña siempre encendida.
- La **base de datos PostgreSQL gratuita expira a los 30 días** (suficiente para una entrega puntual) y admite hasta 3 bases en el plan free.
- Si quieres datos persistentes sin expiración a futuro, cambia `saludpublica-db` por una instancia en **Neon** o **Supabase** actualizando `DATABASE_URL`.