# AutoDealer.cl

Nuevo sitio web de AutoDealer (La Serena): catálogo de vehículos sincronizado con Instagram, panel administrativo propio y fichas indexables.

La especificación completa está en [`AUTODEALER_MASTER_PLAN.md`](AUTODEALER_MASTER_PLAN.md).

## Estado

| Fase | Estado |
| --- | --- |
| 0. Inspección y plan | ✅ |
| 1. Diseño base (layout, portada, tarjetas, datos demo) | ✅ |
| 2. Datos (Neon + Prisma) | ✅ |
| 3. Catálogo real, filtros, fichas, SEO | ✅ |
| 4. Panel administrativo | Pendiente |
| 5. Instagram + R2 | En curso (motor listo; falta validar con credenciales reales) |
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
npm run db:seed         # configuración comercial (idempotente)
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

## Catálogo

- **Visibilidad:** el catálogo muestra solo `published = true` con estado `AVAILABLE` o `RESERVED`. Las fichas `SOLD` siguen accesibles por URL (aviso "vendido", `noindex`, sin oferta en JSON-LD); `WITHDRAWN` y no publicadas no existen públicamente.
- **Filtros en la URL** (`/vehiculos?marca=Toyota&anioMin=2020&orden=precio-asc&pagina=2`): `q`, `marca`, `anioMin`, `anioMax`, `precioMin`, `precioMax`, `kmMax`, `combustible`, `transmision`, `traccion`, `orden`, `pagina`. Valores inválidos se ignoran. Las opciones solo muestran valores existentes en el inventario. Funciona sin JavaScript.
- **Caché:** las consultas usan `"use cache"` con la etiqueta `vehicles` (`src/server/vehicles/queries.ts`, revalidación de seguridad cada hora). El panel y la sincronización deben invalidarla al cambiar datos.
- **SEO:** metadata y canonical por ficha, Open Graph con la primera foto, JSON-LD `Car` solo con datos presentes (oferta solo si hay precio), `sitemap.xml` con fichas indexables. Hasta el lanzamiento (`NEXT_PUBLIC_SITE_INDEXABLE` distinto de `true`) todo lleva `noindex` y `robots.txt` bloquea.
- **404 de fichas:** un slug inexistente muestra la página "no encontrada" con `noindex`. Por el streaming de Next 16 (Partial Prerendering) el código HTTP es 200 para slugs no prerenderizados; es el comportamiento documentado por Next y Google respeta el `noindex`.
- **Imágenes:** `VehicleImage.storageKey` → `/media/<clave>` (ruta propia que lee R2). Sin fotos se muestra un placeholder.

Código: filtros puros en `src/lib/vehicles/filters.ts`, consultas en `src/server/vehicles/repository.ts` (probadas contra la base) y envoltorios cacheados en `queries.ts`.

## Instagram → Neon + R2

Flujo seguro de puesta en marcha (en este orden):

```bash
npm run ig:verify    # solo lectura: host, tipo de token, vencimiento, permisos, publicaciones/carruseles
npm run r2:verify    # alcance de la clave (solo el bucket), escritura/lectura/borrado de prueba, URL pública
npm run ig:preview   # solo lectura: qué se publicaría y por qué (últimos 60 días por defecto)
npm run ig:sync -- --only=<id>   # prueba controlada con UNA publicación real
npm run vehicle:confirm -- --instagram-id=<id> [--dry-run]   # confirmar disponibilidad y publicar (registra AuditLog)
npm run ig:sync -- --all         # importación completa (sin flag no hace nada)
npm run ig:token [-- --refresh]  # estado del token (fechas) / renovación manual
```

- **Token:** se guarda cifrado (AES-256-GCM, `TOKEN_ENCRYPTION_KEY`) en `IntegrationCredential`. Se renueva con el endpoint oficial de Instagram Login (`refresh_access_token`): primera vez 24 h después de guardarlo (edad desconocida del token del panel) y luego cada 50 días. El token renovado se valida con `GET /me` (mismo `user_id`) antes de reemplazar el vigente; si falla, se conserva el vigente, se registra `token.refresh_failed` (ERROR) en `SyncLog` y en los logs de Vercel. Con menos de 7 días para vencer se registra `token.expiring`. Si cambias `INSTAGRAM_ACCESS_TOKEN` a mano, se adopta solo si es válido.
- **"Caption bien interpretado":** además de los datos obligatorios, se bloquea la publicación automática si hay advertencias sobre campos obligatorios (varios precios, precio/año no interpretables, marca no reconocida) o confianza < 0,7.

- **Sincronización:** `GET|POST /api/instagram/sync` con `Authorization: Bearer $CRON_SECRET`. Vercel Cron la ejecuta cada hora (minuto 5).
- **Sin webhooks:** Meta no ofrece un webhook de publicaciones nuevas propias; se usa sondeo programado.
- **Fecha de corte:** `INSTAGRAM_SYNC_SINCE` (obligatoria) limita qué publicaciones se leen.
- **Publicación automática:** solo para publicaciones desde `INSTAGRAM_AUTO_PUBLISH_SINCE`. Si está vacía, **nada se publica solo**; lo histórico queda como borrador "disponibilidad no confirmada".
- **Reglas:** se publica solo con marca, modelo, año, precio y ≥1 foto en R2. Videos se omiten. Lo que no parece vehículo queda `SKIPPED`; lo incompleto, `PENDING` con el motivo.
- **Idempotencia:** `instagramMediaId` único, hash de caption + medios, claves de R2 estables, candado `SyncLock`, registro en `SyncRun`/`SyncLog`.
- **Ediciones:** un caption editado actualiza el mismo vehículo; los campos en `lockedFields` (editados en el panel) no se sobrescriben; la sync **nunca** cambia el estado comercial.
- **Costos:** tope interno de 8 GB en R2 (plan gratuito: 10 GB), máx. 15 publicaciones por ejecución, imágenes ≤ 10 MB.
- **Imágenes:** se sirven desde el propio sitio en `/media/instagram/<post>/<foto>.jpg`. La ruta lee el bucket R2 de forma privada (API S3) y responde con caché de un año (`immutable`), así la CDN de Vercel las entrega y R2 solo se lee en el primer acceso. No depende de `r2.dev` ni de DNS y funciona igual en vercel.app y en el dominio final. En Neon se guarda `storageKey` (fuente de verdad) y `publicUrl` (`/media/<clave>`).
- **Renovación del token:** `GET /api/instagram/token` (Vercel Cron diario 11:20 UTC, protegido con `CRON_SECRET`). Solo llama a Meta cuando corresponde. `/api/health` informa `instagramToken: ok | expiring | failing | missing` sin secretos.
- **Cron de sincronización:** cada hora (`5 * * * *` en `vercel.json`). Meta no avisa de publicaciones nuevas: un auto subido a Instagram aparece en la web en máximo ~1 hora.
- **Retiro automático:** Instagram no informa ventas. Si la publicación de un vehículo visible desaparece (borrada o archivada) en **2 sincronizaciones completas seguidas**, el vehículo pasa a `WITHDRAWN` (sale del catálogo; fotos y datos se conservan) y queda en `AuditLog` (`vehicle.auto_withdrawn`). Si la publicación vuelve, se restaura a `AVAILABLE`, salvo que alguien haya cambiado el estado después. Si faltan más de 5 a la vez o la API falla, no se retira nada (anomalía registrada en `SyncLog`).

## Variables de entorno

Copia `.env.example` a `.env.local`. **Nunca** subas `.env.local` a Git ni compartas secretos por chat.

| Variable | Fase | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 1 | URL base para metadata y enlaces canónicos |
| `DATABASE_URL` | 2 | Neon con pooling (runtime) |
| `DATABASE_URL_UNPOOLED` | 2 | Neon directa (migraciones) |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | 4 | Sesiones del panel |
| `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID` | 5 | API oficial de Instagram (solo servidor) |
| `INSTAGRAM_GRAPH_HOST`, `INSTAGRAM_GRAPH_VERSION` | 5 | Host y versión de la API Graph |
| `INSTAGRAM_SYNC_SINCE` | 5 | Fecha de corte de lectura (obligatoria) |
| `INSTAGRAM_AUTO_PUBLISH_SINCE` | 5 | Desde cuándo se publica automáticamente (vacía = nunca) |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | 5 | Almacenamiento de imágenes (clave limitada al bucket) |
| `NEXT_PUBLIC_SITE_INDEXABLE` | 7 | `true` solo en el dominio final |
| `TOKEN_ENCRYPTION_KEY` | 5 | Cifrado del token en Neon (idéntica en todos los entornos) |
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
│   ├── utils/format.ts     # CLP y kilometraje
│   └── whatsapp.ts         # enlaces wa.me
└── types/
tests/unit/                 # Vitest
```

## Formularios de contacto (financiamiento, seguros, vende tu auto y contacto)

- Páginas `/financiamiento` (Autofin, Global, Unidad Crédito, entre otras) y `/seguros` (convenio directo con BCI Seguros), según lo informado por el cliente. Logos en `public/brand/partners/`.
- Server Action `submitLead` (`src/server/leads/actions.ts`): validación con Zod en servidor (teléfono chileno normalizado a +56…, patente, año), campo trampa contra bots y máximo 5 envíos por hora por visitante (hash de IP, nunca la IP en claro).
- Cada solicitud se guarda en la tabla `Lead` y el visitante puede enviar el resumen por WhatsApp. **No se envía email**: requiere un servicio de correo (pendiente de autorización).
- Datos obligatorios en todos los formularios: nombre, teléfono y email. Cada página pide además lo propio de su intención (auto de interés y pie, auto a asegurar, modalidad y datos del auto, motivo y mensaje).
- Revisar solicitudes: `npm run leads:list -- --dias=7` (hasta que exista el panel de la Fase 4).
- La ficha de cada vehículo enlaza a `/financiamiento?vehiculo=…` con el auto prellenado.

## Contenido provisional (revisar antes del lanzamiento)

Ya no se marcan en pantalla (el cliente pidió quitar la etiqueta "Texto provisional"), pero siguen pendientes de aprobación:

- Beneficios de la portada (`src/components/home/benefits.tsx`).
- Texto de "Vende tu auto". Los pasos de "Financiamiento" y "Seguros" describen el proceso (sin tasas, plazos ni coberturas).
- Banda "¿Quieres vender o cambiar tu auto?".
- Nota del footer "Precios … sujetos a confirmación".
- Ícono del sitio (`src/app/icon.svg`), placeholder basado en las franjas del logo.

Confirmados: dirección, teléfono/WhatsApp, email, Instagram, logo y colores (sitio anterior) y horario oficial Lun–Vie 08:30–18:30 · Sáb 10:00–14:00 (publicaciones de Instagram, confirmado por el cliente).

## Recursos

- `public/brand/logo-autodealer.png`: logo oficial. `logo-autodealer-trim.png` es el mismo archivo con el margen transparente recortado.
- `public/images/hero/`: fotos del carrusel de la portada, de [Unsplash](https://unsplash.com/license) (uso comercial gratuito, sin atribución obligatoria). Se eligieron sin patentes legibles. Las marcas (BMW, Ferrari, Mercedes-Benz) aparecen solo como ambientación; AutoDealer no es concesionario oficial de ellas.
  - `bmw-m4-mate.jpg`: noir. — unsplash.com/photos/CXlzXn-2CVs
  - `ferrari-458.jpg`: Imil Salyakhutdinov — unsplash.com/photos/fc21uhf88KQ
  - `mercedes-coupe.jpg`: Willian Cittadin — unsplash.com/photos/V91lvel6Ojg
  - `bmw-m4-hangar.jpg`: Luca David — unsplash.com/photos/bQNlTbMcj64
  - `ferrari-488.jpg`: Matt Antonioli — unsplash.com/photos/3akA0XDg1_g
- `autodealer-web-final/`: sitio estático anterior, conservado como respaldo local y excluido de Git.
