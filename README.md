# AutoDealer.cl

Nuevo sitio web de AutoDealer (La Serena): catálogo de vehículos sincronizado con Instagram, panel administrativo propio y fichas indexables.

La especificación completa está en [`AUTODEALER_MASTER_PLAN.md`](AUTODEALER_MASTER_PLAN.md).

## Estado

| Fase | Estado |
| --- | --- |
| 0. Inspección y plan | ✅ |
| 1. Diseño base (layout, portada, tarjetas, datos demo) | ✅ |
| 2. Datos (Neon + Prisma) | ✅ |
| 3. Catálogo real, filtros, fichas, SEO | Pendiente |
| 4. Panel administrativo | Pendiente |
| 5. Instagram + R2 | Pendiente |
| 6. QA | Pendiente |
| 7. Preview y lanzamiento | Pendiente |

## Stack

- Next.js 16.4 (App Router, Turbopack, Cache Components) + React 19 + TypeScript estricto
- Tailwind CSS 4 (tokens en `src/app/globals.css`)
- Fuentes: Barlow Condensed (títulos) e Inter (texto) vía `next/font`, servidas localmente
- Vitest 4 para pruebas unitarias
- Neon PostgreSQL 18 + Prisma 7.10 (driver adapter `@prisma/adapter-neon`) + Zod 4
- Próximas fases: Better Auth, Cloudflare R2

## Requisitos

- Node.js ≥ 20.19 (recomendado: 24 LTS)
- npm

## Comandos

```bash
npm install          # instalar dependencias
npm run dev          # desarrollo en http://localhost:3000
npm run build        # build de producción
npm run start        # servir el build
npm run lint         # ESLint
npm run typecheck    # TypeScript sin emitir
npm test             # pruebas unitarias (Vitest)
npm run test:integration  # pruebas contra la base de .env.local (revierten sus cambios)
```

### Base de datos

```bash
npm run db:migrate      # crear/aplicar migraciones en desarrollo (prisma migrate dev)
npm run db:deploy       # aplicar migraciones pendientes (CI / Vercel)
npm run db:status       # estado de migraciones
npm run db:generate     # regenerar el cliente (también corre en postinstall)
npm run db:seed         # datos demo + configuración comercial (idempotente; bloqueado en producción)
npm run db:demo:clear   # borra solo los vehículos con isDemo = true
npm run db:studio       # explorador visual
```

- Esquema: `prisma/schema.prisma`. Configuración del CLI: `prisma.config.ts` (carga `.env.local`).
- Las migraciones usan `DATABASE_URL_UNPOOLED` (directa); la app usa `DATABASE_URL` (pooler).
- Restricciones CHECK (precio > 0, año 1900–2100, km ≥ 0, formato de slug, `features` como arreglo, publicado ⇒ fecha) están en la migración SQL inicial.
- Cliente generado en `src/generated/prisma` (no se versiona).
- En la app, importar `db` desde `@/lib/db` (solo servidor). En scripts, usar `createPrismaClient` de `@/lib/db/create-client`.
- `GET /api/health` responde `{ status, database }` sin detalles internos.

#### Modelo

| Tabla | Propósito |
| --- | --- |
| `Vehicle` | Ficha: datos, estado comercial, publicación, `lockedFields` (campos editados a mano que la sync no pisa), `extraction` (procedencia por campo) |
| `VehicleImage` | Imágenes en R2 (`storageKey`), orden, único por `(vehicleId, instagramMediaId)` |
| `InstagramPost` | Publicación original, único por `instagramMediaId`, estado de sync, intentos, `contentHash` para detectar ediciones |
| `SyncLog` | Eventos de sincronización (sin secretos) |
| `AuditLog` | Acciones administrativas |
| `SiteSettings` | Datos comerciales editables (fila única) |

Usuarios/sesiones: los genera Better Auth en la Fase 4.

## Variables de entorno

Copia `.env.example` a `.env.local`. **Nunca** subas `.env.local` a Git ni compartas secretos por chat.

| Variable | Fase | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 1 | URL base para metadata y enlaces canónicos |
| `DATABASE_URL` | 2 | Neon con pooling (runtime) |
| `DATABASE_URL_UNPOOLED` | 2 | Neon directa (migraciones) |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | 4 | Sesiones del panel |
| `INSTAGRAM_*` | 5 | API oficial de Instagram (solo servidor) |
| `R2_*` | 5 | Almacenamiento de imágenes |
| `CRON_SECRET` | 5 | Protege la ruta de sincronización programada |

## Estructura

```text
src/
├── app/
│   ├── (store)/            # sitio público: inicio, vehículos, contacto, etc.
│   ├── layout.tsx          # fuentes, metadata base
│   ├── globals.css         # tokens de marca
│   └── not-found.tsx
├── components/
│   ├── brand/              # logo oficial
│   ├── home/               # secciones de la portada
│   ├── layout/             # header, footer, menú móvil, contenedores
│   ├── ui/                 # botones, íconos, badges
│   └── vehicles/           # tarjeta, grilla, estados
├── config/site.ts          # datos comerciales (confirmados y provisionales)
├── lib/
│   ├── demo/vehicles.ts    # ⚠️ datos ficticios de maqueta
│   ├── utils/format.ts     # CLP y kilometraje
│   └── whatsapp.ts         # enlaces wa.me
└── types/
tests/unit/                 # Vitest
```

## Contenido provisional (revisar antes del lanzamiento)

Busca `DraftBadge`, `draft` y `BORRADOR` en el código. Hoy incluye:

- Horario de atención (`src/config/site.ts`).
- Beneficios de la portada (`src/components/home/benefits.tsx`).
- Textos de "Vende tu auto" y "Financiamiento".
- Banda "¿Quieres vender o cambiar tu auto?".
- Nota del footer "Precios … sujetos a confirmación".
- Ícono del sitio (`src/app/icon.svg`), placeholder basado en las franjas del logo.
- Los 6 vehículos de `src/lib/demo/vehicles.ts` son **ficticios** y se muestran con la etiqueta "Demo".

Confirmados (tomados del sitio anterior): dirección, teléfono/WhatsApp, email, Instagram, logo y colores.

## Recursos

- `public/brand/logo-autodealer.png`: logo oficial. `logo-autodealer-trim.png` es el mismo archivo con el margen transparente recortado.
- `public/images/hero-tunel.jpg`: imagen de portada (convertida desde `autodealer-car-poster.png` del sitio anterior). **Confirmar la licencia/origen.**
- `autodealer-web-final/`: sitio estático anterior, conservado como respaldo local y excluido de Git.
