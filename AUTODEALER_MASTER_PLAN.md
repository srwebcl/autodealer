# AutoDealer.cl --- Documento maestro para Antigravity + Claude

**Versión:** 1.0 · **Fecha:** 29-10-2026 · **Idioma:** español de Chile\
**Objetivo:** desarrollar desde cero una nueva web para AutoDealer.cl
con Next.js y catálogo sincronizado con Instagram.

## 1. Cómo usar este documento

1.  Guarda este archivo como `AUTODEALER_MASTER_PLAN.md` en la raíz del
    proyecto.
2.  Abre la carpeta del proyecto en Antigravity y selecciona Claude como
    agente.
3.  Copia el prompt maestro de la sección 17 y pégalo en el chat del
    agente.
4.  Exige que empiece por inspeccionar y planificar, no por modificar
    todo de una vez.
5.  Trabaja fase por fase y revisa los resultados antes de avanzar.

Este documento es la especificación principal. Si el agente detecta una
contradicción técnica o una limitación de la API, debe explicarla y
proponer una solución antes de cambiar el alcance.

## 2. Decisiones confirmadas

  -----------------------------------------------------------------------
  Área                                Decisión
  ----------------------------------- -----------------------------------
  Proyecto                            Nuevo, desde cero

  Framework                           Next.js App Router + TypeScript

  Diseño                              Deportivo, dinámico y comercial

  Panel                               Propio, integrado en Next.js

  Base de datos                       Neon PostgreSQL

  ORM                                 Prisma, con configuración
                                      compatible con las versiones
                                      instaladas

  Almacenamiento de imágenes          Cloudflare R2

  Hosting                             Vercel

  Fuente de publicaciones             Cuenta profesional Instagram
                                      `@autodealer.cl`

  Importación                         API oficial de Instagram; no
                                      scraping

  Publicación                         Automática, con validaciones para
                                      evitar información falsa

  Dominio final                       `autodealer.cl`

  Lanzamiento                         Reemplazar el sitio actual solo
                                      después de QA y aprobación

  Idioma y moneda                     Español de Chile y CLP
  -----------------------------------------------------------------------

## 3. Objetivo del producto

Construir una plataforma automotriz rápida, responsive, visualmente
atractiva y optimizada para buscadores. El cliente debe seguir
publicando vehículos en Instagram como lo hace actualmente. La
aplicación debe detectar/consultar publicaciones, recuperar el caption y
todas las imágenes del carrusel, extraer datos del vehículo, almacenar
las imágenes permanentemente, guardar los datos en PostgreSQL y publicar
una ficha web.

El panel administrativo debe permitir editar datos, cambiar
disponibilidad y revisar errores. Instagram no informa por sí solo que
un vehículo se vendió: la disponibilidad comercial se administrará desde
el panel o mediante una señal explícita del negocio.

**Regla crítica:** la automatización no debe inventar información. Si
faltan datos esenciales, la extracción falla o no se pueden almacenar
las imágenes, el sistema debe registrar el problema y no publicar una
ficha incompleta o engañosa. La intención es automatizar todas las
publicaciones válidas, no sacrificar precisión.

## 4. Páginas y funciones

### Sitio público

-   `/` --- inicio con hero automotriz, buscador, vehículos
    recientes/destacados, beneficios comerciales confirmados, WhatsApp,
    ubicación y footer.
-   `/vehiculos` --- catálogo con filtros, ordenamiento, paginación y
    estados vacíos.
-   `/vehiculos/[slug]` --- ficha individual con galería, precio, datos
    técnicos, descripción, equipamiento, CTA a WhatsApp, enlace original
    de Instagram y vehículos relacionados.
-   `/financiamiento` --- contenido y formulario comercial, una vez
    aprobados los textos.
-   `/vende-tu-auto` --- información de parte de pago/consignación,
    según condiciones confirmadas.
-   `/contacto` --- dirección, horarios, teléfono/WhatsApp y mapa si se
    confirma la ubicación.
-   Páginas legales pertinentes: privacidad, términos y tratamiento de
    datos de formularios.

No inventar dirección, horario, teléfono, logotipo, condiciones de
financiamiento ni afirmaciones comerciales. Deben configurarse mediante
datos aprobados.

### Catálogo y ficha

-   Filtros por marca, modelo, año, precio, kilometraje, combustible,
    transmisión y tracción cuando exista información.
-   Orden por recientes, precio y año.
-   Precio en CLP formateado localmente.
-   Galería con todas las imágenes del carrusel y orden estable.
-   WhatsApp con mensaje precompletado que identifique el vehículo.
-   SEO metadata, Open Graph, URL canónica, sitemap y datos
    estructurados solo cuando sean aplicables y los datos sean reales.
-   No mostrar como disponibles vehículos vendidos o retirados.
-   Los campos ausentes deben omitirse o mostrarse como "Consultar"; no
    completar por suposición.

### Panel administrativo

Rutas sugeridas:

-   `/admin/login`
-   `/admin`
-   `/admin/vehiculos`
-   `/admin/vehiculos/[id]`
-   `/admin/publicaciones`
-   `/admin/sincronizacion`
-   `/admin/configuracion`

Funciones:

-   Autenticación y autorización verificadas en servidor.
-   Listar, buscar y filtrar vehículos.
-   Editar precio, descripción y especificaciones.
-   Gestionar imágenes y su orden.
-   Cambiar estado: disponible, reservado, vendido o retirado.
-   Consultar caption, enlace original y estado de importación.
-   Consultar errores y reintentar sincronizaciones.
-   Configurar datos comerciales.
-   Registrar operaciones administrativas importantes.

Ocultar un botón no es una medida de seguridad suficiente: todos los
endpoints y mutaciones deben verificar permisos en servidor.

## 5. Diseño visual

Dirección creativa: **deportivo y dinámico**, con fotografías grandes y
vehículos protagonistas.

-   Paleta inicial: negro/grafito, blanco y rojo como acento; validar
    con el branding oficial.
-   Tipografía moderna, fuerte y legible.
-   Títulos contundentes, jerarquía clara y CTA visibles.
-   Tarjetas de vehículos con foto, precio, año, kilometraje y
    transmisión.
-   Animaciones discretas y sin penalizar rendimiento.
-   Diseño mobile-first para móvil, tablet y escritorio.
-   Contraste accesible, foco visible, navegación por teclado,
    formularios etiquetados y respeto por `prefers-reduced-motion`.
-   No inventar ni recrear el logotipo oficial. Usar el archivo original
    o un placeholder claramente identificado.

La portada debe verse como una automotora moderna, no como una plantilla
genérica. No sacrificar velocidad, accesibilidad ni conversión por
efectos visuales.

## 6. Stack y criterios de dependencias

Stack objetivo:

-   Next.js App Router + TypeScript.
-   Tailwind CSS.
-   Neon PostgreSQL.
-   Prisma ORM, con el driver y configuración que correspondan a las
    versiones instaladas.
-   Cloudflare R2 mediante API compatible con S3.
-   Vercel.
-   Zod para validar variables de entorno, inputs y datos extraídos.
-   `fetch` para la API oficial de Instagram.
-   Auth.js/NextAuth u otra solución justificada, seleccionando una sola
    estrategia compatible con las versiones instaladas.
-   Herramientas de pruebas compatibles con el repositorio.

No copiar configuraciones obsoletas ni instalar versiones a ciegas.
Verificar compatibilidad con la versión actual del proyecto y consultar
documentación oficial disponible. Si no hay acceso a documentación,
dejarlo señalado.

## 7. Estructura de carpetas objetivo

``` text
autodealer/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── (store)/
│   │   │   ├── page.tsx
│   │   │   ├── vehiculos/page.tsx
│   │   │   ├── vehiculos/[slug]/page.tsx
│   │   │   ├── financiamiento/page.tsx
│   │   │   ├── vende-tu-auto/page.tsx
│   │   │   ├── contacto/page.tsx
│   │   │   └── layout.tsx
│   │   ├── admin/
│   │   │   ├── login/page.tsx
│   │   │   ├── page.tsx
│   │   │   ├── vehiculos/page.tsx
│   │   │   ├── vehiculos/[id]/page.tsx
│   │   │   ├── publicaciones/page.tsx
│   │   │   ├── sincronizacion/page.tsx
│   │   │   └── configuracion/page.tsx
│   │   ├── api/
│   │   │   ├── vehicles/route.ts
│   │   │   ├── admin/vehicles/[id]/route.ts
│   │   │   ├── instagram/sync/route.ts
│   │   │   └── webhooks/instagram/route.ts
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── layout/
│   │   ├── vehicles/
│   │   ├── search/
│   │   ├── forms/
│   │   └── admin/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── env.ts
│   │   ├── instagram/
│   │   │   ├── client.ts
│   │   │   ├── sync.ts
│   │   │   ├── parse-caption.ts
│   │   │   └── types.ts
│   │   ├── storage/r2.ts
│   │   ├── auth/
│   │   ├── validation/
│   │   ├── seo/
│   │   └── utils/
│   ├── server/
│   │   ├── services/
│   │   └── repositories/
│   └── types/
├── tests/
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── prisma.config.ts
└── README.md
```

Es una guía, no una obligación de crear archivos vacíos. Adaptar la
estructura a las convenciones reales de Next.js/Prisma y mantener los
módulos cohesivos.

## 8. Modelo de datos

Implementar el esquema definitivo en Prisma y migraciones versionadas.

### `Vehicle`

-   `id` UUID.
-   `slug` único.
-   `make`, `model`, `version`.
-   `year`, `mileageKm`.
-   `engine`, `fuelType`, `transmission`, `drivetrain`.
-   `priceClp` entero.
-   `description`.
-   `features` JSON validado o entidad relacionada.
-   `status`: `AVAILABLE`, `RESERVED`, `SOLD`, `WITHDRAWN`.
-   `published` boolean.
-   `publishedAt`, `createdAt`, `updatedAt`.
-   Relación con publicación original e imágenes.

### `InstagramPost`

-   `id` interno.
-   `instagramMediaId` único.
-   `permalink`, `caption` original, `mediaType`, `publishedAt`.
-   `syncStatus`: `PENDING`, `PROCESSING`, `SUCCESS`, `ERROR`.
-   `lastError`, `processedAt`, `createdAt`, `updatedAt`.

### `VehicleImage`

-   `id`, `vehicleId`.
-   `instagramMediaId` cuando exista.
-   `storageKey` de R2, no URL firmada ni secreto.
-   `altText`, `position`, `createdAt`.

### `SyncLog`

-   `id`, referencia opcional a publicación.
-   `eventType`, `status`, `message`, `details` JSON y `createdAt`.
-   Nunca guardar tokens ni secretos en `details`.

### Usuarios y configuración

Añadir modelo de usuarios administrativos compatible con la
autenticación elegida y una configuración comercial editable. No
almacenar contraseñas en texto plano.

### Integridad

-   IDs externos y slugs únicos.
-   Índices por estado, publicación, marca, año y precio.
-   Transacciones al guardar publicación, vehículo e imágenes.
-   Sincronización idempotente: los reintentos no duplican registros.
-   Política explícita para publicaciones editadas o imágenes cambiadas.
-   No borrar vehículos editados manualmente sin regla de
    reconciliación.

## 9. Instagram API y sincronización

### Estado de la prueba manual

La consulta realizada en el Explorador de Meta funcionó para
`@autodealer.cl`. Se recuperaron publicaciones con caption, ID, tipo,
fecha, enlace y medios; la consulta de `children` devolvió imágenes
individuales de carruseles.

Esto demuestra que las consultas de prueba funcionaron, pero no
garantiza que el token sea permanente ni que la aplicación esté
habilitada para producción. Verificar permisos, caducidad, renovación y
límites antes de automatizar.

### Reglas técnicas

-   Usar solo la API oficial; prohibido scraping o automatización del
    login web.
-   Mantener el token en variables de entorno del servidor.
-   Nunca imprimirlo en logs, respuestas, HTML o capturas.
-   Verificar caducidad, renovación, permisos y versión de API con
    documentación oficial de Meta.
-   Manejar paginación, rate limits, fallos de red, backoff y
    reintentos.
-   Usar `instagramMediaId` como clave de deduplicación.
-   Recuperar todos los hijos de carruseles, respetando paginación si
    corresponde.
-   Soportar imagen, video y carrusel. No tratar videos como imágenes
    sin una estrategia explícita.
-   Descargar medios a R2 desde el servidor y validar protocolo, host,
    MIME, tamaño y respuesta.
-   Tratar las URL de medios como potencialmente temporales.
-   Verificar la firma de webhooks cuando la documentación de Meta lo
    requiera.

### Flujo de sincronización

1.  Consultar publicaciones recientes y paginar cuando sea necesario.
2.  Comparar por ID externo.
3.  Crear/actualizar el registro de publicación.
4.  Recuperar los hijos del carrusel.
5.  Descargar medios válidos y subirlos a R2.
6.  Extraer los datos del caption.
7.  Validar los campos con Zod y reglas de negocio.
8.  Crear/actualizar el vehículo mediante transacción.
9.  Marcar la publicación como exitosa o registrar el error.
10. Permitir reintentos seguros.

### Nuevas publicaciones

Diseñar un módulo desacoplado que admita:

-   Webhooks si el producto, permisos y configuración de Meta los
    permiten.
-   Sincronización programada como alternativa o respaldo.

En Vercel, verificar límites de duración, cuotas y configuración de
Cron. La ruta de sincronización debe requerir un secreto fuerte y no
estar abierta al público.

## 10. Extracción de captions

Detectar, cuando estén presentes:

-   Marca, modelo, versión, año.
-   Kilometraje.
-   Precio en CLP.
-   Motor, combustible, transmisión y tracción.
-   Equipamiento y descripción.
-   Fecha y permalink de Instagram.

Estrategia:

1.  Preservar el caption original.
2.  Extraer etiquetas conocidas como `Año:`, `Kilometraje:`, `Precio:`,
    `Modelo:`.
3.  Añadir reglas de respaldo para formatos libres.
4.  Si se incorpora IA, exigir JSON estructurado y validar la salida con
    Zod.
5.  Normalizar formatos chilenos: `113.118 km` → `113118`; `$14.590.000`
    → `14590000`.
6.  No confundir cualquier cifra con precio, año o kilometraje.
7.  Guardar procedencia y confianza por campo si es posible.
8.  No inventar valores ausentes.
9.  Generar un slug único y estable.
10. Publicar automáticamente solo si se cumplen las reglas configuradas.

Definir explícitamente los campos mínimos requeridos para publicación.
Como base, exigir identificador válido, caption útil, al menos una
imagen almacenada, marca/modelo identificables y ausencia de duplicados.
Decidir si precio y año son obligatorios; no asumirlo. Si falla un
requisito, marcar error o pendiente y mostrarlo en el panel.

Instagram no confirma ventas. No retirar vehículos por antigüedad ni por
no aparecer en las últimas publicaciones. Los estados comerciales se
gestionan desde el panel o por una señal explícita.

## 11. API interna

Endpoints sugeridos, sujetos a la arquitectura final:

-   `GET /api/vehicles` --- catálogo paginado y filtros permitidos.
-   `GET /api/vehicles/[id]` --- detalle según necesidad.
-   `PATCH /api/admin/vehicles/[id]` --- mutación autenticada.
-   `POST /api/instagram/sync` --- sincronización manual protegida.
-   `GET /api/webhooks/instagram` --- verificación si se configura el
    webhook.
-   `POST /api/webhooks/instagram` --- eventos validados.
-   `GET /api/health` --- estado básico sin información sensible.

Validar entradas, autenticar y autorizar cada mutación, aplicar rate
limiting donde corresponda y devolver errores uniformes sin stack traces
en producción.

## 12. Variables de entorno

Crear `.env.example` con valores vacíos; nunca guardar credenciales
reales en el repositorio.

``` dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000

DATABASE_URL=
DIRECT_URL=

AUTH_SECRET=
AUTH_URL=http://localhost:3000

INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_VERIFY_TOKEN=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=

CRON_SECRET=

NEXT_PUBLIC_WHATSAPP_NUMBER=
```

Adaptar los nombres a las versiones y configuración elegidas. Documentar
cuáles son obligatorias y cómo obtenerlas sin pedir que se peguen
secretos en el chat.

No usar `NEXT_PUBLIC_*` para tokens. No subir `.env` a Git. No imprimir
secretos. No utilizar credenciales de producción en pruebas si se puede
evitar.

## 13. SEO, rendimiento y accesibilidad

-   Metadata dinámica, canonical y Open Graph.
-   `sitemap.xml` y `robots.txt`.
-   Datos estructurados únicamente para información visible, real y
    aplicable.
-   No indexar vehículos retirados como disponibles.
-   Imágenes optimizadas, tamaños responsive y configuración de
    `next/image` para R2.
-   Lazy loading donde corresponda.
-   Buenas métricas Core Web Vitals.
-   Formularios con validación y estados claros.
-   Evitar JavaScript y dependencias innecesarias.
-   Probar en móvil, tablet y escritorio.
-   Contraste, navegación por teclado, labels y foco visible.

## 14. Seguridad

-   Proteger rutas administrativas y mutaciones en servidor.
-   Validar todas las entradas.
-   Utilizar ORM y consultas parametrizadas.
-   Proteger cron y sincronización manual con secreto.
-   Verificar firmas de webhook cuando corresponda.
-   Limitar tipo y tamaño de archivos descargados.
-   Prevenir SSRF: solo descargar URLs provenientes de respuestas
    confiables de la API, validar hosts/protocolo y rechazar URLs
    arbitrarias.
-   Añadir rate limiting a login y formularios.
-   Usar cookies seguras en producción.
-   Logs sin secretos ni datos personales innecesarios.
-   Dependencias actualizadas y auditoría.
-   No permitir acciones destructivas automáticas sobre el inventario.

## 15. Pruebas y criterios de aceptación

### Sitio

-   Inicio, catálogo y fichas funcionan en móvil/escritorio.
-   Filtros combinados funcionan.
-   WhatsApp abre con el vehículo correcto.
-   Vendidos/retirados no aparecen como disponibles.
-   No hay enlaces rotos ni errores críticos.

### Instagram

-   Importar una imagen y un carrusel.
-   Conservar todas las fotos en el orden correcto.
-   Extraer captions etiquetados y libres.
-   Caption incompleto no produce datos inventados.
-   Repetir sincronización no duplica datos.
-   Manejar token inválido, límites, timeout y errores de red.
-   Reintentar fallos.
-   Token nunca visible en navegador/logs.

### Base de datos y R2

-   Migración desde base vacía funciona.
-   Restricciones únicas se cumplen.
-   Imágenes almacenadas en R2 se visualizan.
-   Fallos parciales quedan recuperables.
-   Importación idempotente.

### Panel

-   No autenticados no acceden.
-   Usuarios no autorizados no modifican vehículos.
-   Inputs inválidos se rechazan.
-   Acciones importantes quedan registradas.

### Producción

-   Variables documentadas.
-   HTTPS y dominio configurados.
-   Sitemap y redirects comprobados.
-   Backup y reversión documentados.
-   No se modifica DNS sin autorización expresa.

## 16. Fases de desarrollo

**Fase 0 --- Inspección:** revisar entorno, versiones, Git y archivos;
detectar riesgos; proponer plan. No ejecutar cambios destructivos.

**Fase 1 --- Scaffold y diseño:** crear Next.js, tokens visuales,
layout, header/footer, portada responsive y tarjetas con datos ficticios
claramente identificados.

**Fase 2 --- Datos:** configurar Neon/Prisma, esquema, migración y seed
de desarrollo.

**Fase 3 --- Catálogo:** listado, filtros, paginación, fichas, galería,
WhatsApp y SEO.

**Fase 4 --- Panel:** autenticación, CRUD, estados, imágenes,
publicaciones y logs.

**Fase 5 --- Instagram/R2:** API oficial, paginación, carruseles,
descarga, extracción, validación, deduplicación, reintentos y
cron/webhook si está disponible.

**Fase 6 --- QA:** pruebas, seguridad, móvil, SEO, rendimiento, fallos
de API y recuperación.

**Fase 7 --- Preview y lanzamiento:** Vercel preview, variables,
backups, redirecciones y plan de reversión. Lanzar al dominio final solo
con aprobación explícita.

## 17. PROMPT MAESTRO PARA ANTIGRAVITY + CLAUDE

Copia y pega el siguiente texto completo en el chat del agente de
desarrollo:

------------------------------------------------------------------------

Actúa como arquitecto de software senior, desarrollador full-stack
experto en Next.js/TypeScript/PostgreSQL y diseñador UI/UX especializado
en sitios automotrices.

Vamos a construir desde cero una nueva web para **AutoDealer.cl**. Lee
primero el archivo `AUTODEALER_MASTER_PLAN.md` completo y úsalo como
especificación principal.

### Objetivo

Crear una web automotriz deportiva, dinámica, responsive, accesible y
optimizada para SEO, con catálogo de vehículos, fichas individuales,
panel administrativo propio y sincronización con la cuenta profesional
de Instagram `@autodealer.cl`.

El cliente debe seguir publicando vehículos en Instagram como hasta
ahora. La aplicación debe obtener la publicación y su caption, recuperar
todas las imágenes de carruseles, extraer datos de vehículo, guardar
fotos en Cloudflare R2, persistir datos en Neon/PostgreSQL y publicar la
ficha web automáticamente cuando pase las validaciones.

### Stack objetivo

-   Next.js App Router + TypeScript.
-   Tailwind CSS.
-   Neon PostgreSQL.
-   Prisma compatible con las versiones instaladas.
-   Cloudflare R2 mediante API S3-compatible.
-   Vercel.
-   Zod.
-   API oficial de Instagram mediante `fetch`.
-   Autenticación segura para panel administrativo.
-   Pruebas automatizadas apropiadas.

### Diseño

Diseña una automotora moderna, no una plantilla genérica. Utiliza fotos
grandes, tipografía contundente, contraste alto, superficies
grafito/negro y rojo como acento provisional sujeto a validar con el
branding oficial. Prioriza conversión, rendimiento, accesibilidad y
experiencia móvil. No inventes el logo oficial: utiliza el archivo
suministrado o un placeholder claramente marcado.

### Reglas críticas

1.  Inspecciona el repositorio, las versiones y
    `AUTODEALER_MASTER_PLAN.md` antes de editar.
2.  Trabaja en fases pequeñas. En la primera respuesta presenta plan,
    estructura, riesgos, decisiones pendientes y comandos propuestos. No
    empieces con una implementación masiva.
3.  No sobrescribas archivos existentes sin leerlos.
4.  No inventes credenciales, precios, características, dirección,
    horarios, teléfono ni contenidos legales.
5.  No expongas tokens ni secretos en logs, terminal, HTML, respuestas,
    capturas ni Git.
6.  No hagas scraping de Instagram ni automatices su login web; utiliza
    la API oficial.
7.  No asumas que el token probado manualmente es permanente o que la
    app está lista para producción. Verifica permisos, caducidad,
    renovación, paginación, límites y requisitos de webhooks en
    documentación oficial.
8.  Descarga imágenes a R2; no dependas de URL temporales de Instagram.
9.  La sincronización debe ser idempotente: reintentar no debe duplicar
    publicaciones, vehículos ni imágenes.
10. No inventes datos ausentes. La publicación es automática solo cuando
    se cumplen reglas de validación; si falla algo esencial, registra el
    error y no publiques una ficha engañosa.
11. Instagram no informa automáticamente que un vehículo se vendió. La
    disponibilidad se gestiona desde el panel o mediante una señal
    explícita.
12. Protege rutas y mutaciones administrativas en servidor.
13. No cambies DNS, borres el sitio actual, despliegues a producción ni
    ejecutes acciones destructivas sin autorización explícita.
14. No afirmes que algo funciona si no lo has probado.
15. Mantén TypeScript estricto, componentes reutilizables, manejo de
    errores, accesibilidad y README actualizado.

### Orden de trabajo

**Fase 0 --- Inspección:** inspecciona el entorno, versiones, Git,
estructura y herramientas disponibles. Determina si el directorio está
vacío o contiene trabajo. Presenta un plan y las decisiones pendientes.
No ejecutes cambios destructivos.

**Fase 1 --- Diseño base:** configura Next.js, Tailwind, tipografía y
tokens visuales. Construye layout, header, footer, portada responsive y
tarjetas de vehículos usando datos ficticios claramente identificados.
Entrega una interfaz visualmente pulida.

**Fase 2 --- Datos:** configura Neon, Prisma, esquema, migraciones y
seed de desarrollo. Documenta variables y comandos.

**Fase 3 --- Catálogo:** implementa listado, filtros, ordenamiento,
paginación, fichas, galería, WhatsApp y SEO usando datos de la base.

**Fase 4 --- Panel:** implementa login, autorización server-side, CRUD
de vehículos, estados comerciales, gestión de imágenes, publicaciones y
logs.

**Fase 5 --- Instagram/R2:** implementa cliente de API oficial,
paginación, importación de publicaciones y carruseles, descarga segura a
R2, extracción de caption, validación, deduplicación, logs, reintentos y
sincronización programada/webhooks solo si la configuración de Meta lo
permite.

**Fase 6 --- QA:** añade y ejecuta pruebas relevantes. Valida
responsive, accesibilidad, SEO, seguridad, token inválido, duplicados,
fallos de R2 y reintentos.

**Fase 7 --- Preview y lanzamiento:** documenta configuración de Vercel,
variables, backups, redirecciones y reversión. La migración del dominio
se hará solo con mi aprobación explícita.

### Entregable obligatorio al terminar cada fase

Informa:

-   Qué se implementó.
-   Archivos creados y modificados.
-   Dependencias instaladas y motivo.
-   Comandos ejecutados.
-   Pruebas ejecutadas y resultados reales.
-   Variables de entorno que debo configurar, sin pedirme que pegue
    secretos en el chat.
-   Errores y decisiones pendientes.
-   Próximo paso recomendado.

Empieza ahora por la **Fase 0: inspección y plan**. No pases a la
siguiente fase hasta explicar el resultado de la actual y dejar claro
cómo verificarlo.

------------------------------------------------------------------------

## 18. Checklist de arranque

No hace falta tener todos los servicios listos para empezar el diseño.
Antes de integrar cada servicio, prepara de forma segura:

-   [ ] Antigravity con Claude y carpeta del proyecto.
-   [ ] Cuenta/proyecto de Vercel.
-   [ ] Proyecto Neon y cadena de conexión.
-   [ ] Bucket Cloudflare R2 y claves de servidor.
-   [ ] App Meta, token guardado de forma segura y permisos verificados.
-   [ ] Logo oficial y recursos de marca, si existen.
-   [ ] Número oficial de WhatsApp.
-   [ ] Dirección y horarios confirmados.
-   [ ] Acceso al DNS de `autodealer.cl` para el lanzamiento final.
-   [ ] Backup del sitio actual y plan de reversión.

## 19. Resultado esperado

Al finalizar, AutoDealer.cl tendrá una web nueva y administrable.
Instagram será la fuente de nuevas publicaciones; el sistema normalizará
y almacenará datos e imágenes; el catálogo mostrará fichas indexables; y
el panel permitirá controlar disponibilidad y resolver fallos.

El éxito no se mide solo por una portada atractiva, sino por la
precisión de los datos, la fiabilidad de la sincronización, la seguridad
del panel, el SEO y la capacidad de evitar duplicados y vehículos
vendidos que sigan apareciendo como disponibles.
