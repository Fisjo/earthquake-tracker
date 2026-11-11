# Información del proyecto

## Qué es

**Earthquake Tracker**: aplicación web interactiva para ver la actividad sísmica global casi en tiempo real. Consume los feeds GeoJSON públicos de USGS (sin API key), los muestra en un mapa y en listados ordenables, y genera informes de riesgo y análisis geológico con IA (Gemini). Guarda lo consultado en PostgreSQL para construir un histórico propio.

## Para quién

Curiosos de la geología, estudiantes e investigadores que quieren seguir los terremotos del mundo de forma visual y comprensible. Interfaz e informes en **español**.

## Funciones

1. **Dashboard con mapa mundial** (Leaflet): marcadores con color según profundidad y tamaño según magnitud. Estadísticas rápidas en vivo: total de sismos en 24 h, magnitud máxima y zona más activa.
2. **Feed de terremotos** en tabla/tarjetas:
   - Ventana temporal: última hora, últimas 24 h, últimos 7 días.
   - Orden: más recientes, mayor magnitud, mayor profundidad, más significativos (campo `sig` / nivel de alerta de USGS).
3. **Panel de detalle** de cada sismo con dos botones de IA (`gemini-2.5-flash`):
   - **Informe de Evento**: impacto explicado de forma sencilla, contexto tectónico y posibles réplicas.
   - **Análisis de Zona**: actividad reciente y patrones históricos de la región, a partir de los datos acumulados en nuestra base.
   - Todo informe indica que los terremotos **no se pueden predecir** con exactitud científica.
4. **Cuentas de usuario** (email + contraseña): registro, inicio y cierre de sesión.
5. **Favoritos por usuario**: zonas guardadas (nombre, centro, radio en km) y sismos favoritos.
6. **Persistencia y caché**:
   - Los sismos consultados se guardan automáticamente (upsert por `usgs_id`).
   - Los informes de Gemini se guardan y se reutilizan para no repetir llamadas a la API.

## Fuera de alcance

- Predicción de terremotos o alertas de emergencia: es una herramienta informativa, no oficial.
- Sincronización en segundo plano (cron/worker): los datos se ingieren al consultar, con caché corta de ~1-2 min.
- Notificaciones push o por email.
- Login con terceros (Google, etc.), recuperación de contraseña y verificación de email.
- Otros idiomas (solo español) y app móvil nativa.
- Despliegue a producción (requiere permiso explícito, ver `AGENTS.md`).

## Tecnología

- **Frontend:** React + TypeScript con Vite, Tailwind CSS y React-Leaflet (teselas OpenStreetMap, sin clave).
- **Backend:** Python + FastAPI. Cliente HTTP para USGS y SDK oficial `google-genai` para Gemini.
- **Base de datos:** PostgreSQL 16 en Docker (`docker-compose.yml`), con SQLAlchemy y migraciones con Alembic.
- **Autenticación:** contraseñas con hash (argon2 o bcrypt) y sesión por JWT en cookie httpOnly.
- **Tablas principales:**
  - `users` (id, email, password_hash, created_at)
  - `earthquakes` (usgs_id, title, place, magnitude, depth, latitude, longitude, occurred_at, alert_level, significance, tsunami, raw_data). `significance` es el `sig` de USGS, en columna propia para ordenar por él.
  - `ai_reports` (id, earthquake_id o region_name, report_type, content, created_at). Es caché compartida entre usuarios.
  - `saved_zones` (id, user_id, name, lat, lng, radius_km)
  - `saved_earthquakes` (user_id, earthquake_id). No estaba en el esquema inicial; hace falta para los sismos favoritos.
- **API de sismos:** `GET /api/earthquakes?window=hour|day|week&sort=recent|magnitude|depth|significance&limit=500` (por defecto `day`, `recent`, 500; máximo 2000). Responde `{earthquakes, stale, warning}`: si USGS no responde, sirve lo ya guardado con `stale: true` y un aviso. Al consultar se ingiere el feed de la ventana, salvo que se haya consultado en los últimos 90 s.
- **API de estadísticas:** `GET /api/stats` → `{total_24h, max_magnitude, most_active_region: {name, count} | null, stale, warning}`. Refresca la ventana de 24 h con la misma caché de 90 s. La zona activa es lo que va tras la última coma del `place` (sin el prefijo «N km DIR of»); sin coma, el lugar entero.
- **Frontend (`frontend/src/`):** `api/` (cliente y tipos), `hooks/` (`useAsync` con cancelación, `useEarthquakes`, `useStats`), `components/` (barra de estadísticas, controles, lista y tarjetas, mensajes de estado), `format.ts` (formato en español) y `labels.ts`. Sin librerías de datos: `fetch` y hooks propios.
- **Diseño (frontend):** todos los colores, fuentes y radios salen de los tokens `@theme` de `frontend/src/index.css` (paleta verde sobre fondo claro, Manrope para texto y JetBrains Mono para cifras, radios de 8/12/20 px). Las fuentes se cargan de Google Fonts con un `<link>` en `index.html`; sin red, se usa la tipografía del sistema. Reglas: foco visible de 2 px, controles de al menos 44 px, `prefers-reduced-motion` respetado y nada que aparezca al hacer scroll. La skill de diseño (`.claude/skills/design-taste-frontend/`, de terceros, fuera de git) se usó solo para repartir paleta y tipografía; su flujo de landing y su hook `Stop` no se usan.
- **Mapa (frontend):** React-Leaflet 5 sobre Leaflet 1.9 con teselas de OpenStreetMap (el servidor público es para uso ligero; si se despliega habrá que valorar otro proveedor, decisión del propietario). Un `CircleMarker` por sismo de la lista (máx. 500), con **radio `4 + 2,2·M` px** (M limitada a 0–9) y **color por profundidad** en 4 clases: `<30` naranja, `30–70` ámbar, `70–300` verde azulado, `≥300` azul (gris sin dato). Las reglas están en `src/map/markerStyle.ts`, como funciones puras. Seleccionar un sismo (marcador o tarjeta) lo resalta en ambos sitios, centra el mapa y abre su popup; cambiar de ventana limpia la selección. La vista inicial encaja el mundo entero en el panel. En escritorio (≥1024 px) el mapa es fijo a la derecha; en móvil va entre los controles y la lista, con la leyenda debajo.
- **Estructura prevista:** `frontend/` y `backend/` separados. La lógica de negocio (ingesta, clasificación, caché de informes) va fuera de los endpoints y de los componentes.
- **Cómo se arranca:**
  1. `cp .env.example .env` y rellenar los valores (`POSTGRES_*`; el puerto del host por defecto es 5433). `DATABASE_URL` tiene la forma `postgresql+psycopg://USUARIO:CLAVE@localhost:5433/BASE`; `TEST_DATABASE_URL` apunta a otra base (p. ej. `BASE_test`), que las pruebas crean solas. El backend lee `.env` de la raíz.
  2. `docker compose up -d` (PostgreSQL 16).
  3. Backend, la primera vez: `cd backend && python3.14 -m venv .venv && .venv/bin/pip install -r requirements.txt`.
  4. Backend: `cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000`.
  5. Frontend, la primera vez: `cd frontend && npm install`. Después: `npm run dev` (http://localhost:5173, con proxy de `/api` al backend).
  6. Migraciones: `cd backend && .venv/bin/alembic upgrade head`. Nueva migración: `.venv/bin/alembic revision --autogenerate -m "mensaje"` y revisarla a mano.
- **Cómo se ejecutan las pruebas:**
  - Backend: `cd backend && .venv/bin/pytest` y `.venv/bin/ruff check .` (requiere Postgres levantado; usa `TEST_DATABASE_URL` y se niega a correr si es igual a `DATABASE_URL`).
  - Frontend: `cd frontend && npm test` y `npm run lint`
  - E2E (la API se simula en el navegador y las fuentes de Google se abortan: sin USGS, base de datos ni red): `cd e2e && npm install && npx playwright install chromium` la primera vez; después `npm test` (arranca backend y frontend solos).

## Datos y claves

- **Fuente externa:** USGS Earthquake Hazards Program, feeds GeoJSON (`earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_{hour,day,week}.geojson`). Sin clave, de solo lectura.
- **Claves en `.env`** (nunca en git; `.env.example` sin valores):
  - `DATABASE_URL`
  - `GEMINI_API_KEY`
  - `JWT_SECRET`
- Datos personales: solo el email y el hash de contraseña de los usuarios. En desarrollo y pruebas, solo datos ficticios.
- La base de datos real y las claves de producción quedan bajo la regla 🔴 de `AGENTS.md`.

## Cómo se prueba

- **Backend (pytest):**
  - Unitarias de la lógica de negocio: parseo del GeoJSON, ordenación y filtros, estadísticas, caché de informes.
  - Integración contra un PostgreSQL de pruebas: ingesta con upsert, persistencia, favoritos, autenticación.
- **Frontend (Vitest + Testing Library):** componentes y lógica de presentación (color/tamaño del marcador, filtros, orden).
- **Extremo a extremo (Playwright, en `e2e/`):** registro e inicio de sesión → dashboard con mapa y lista → abrir un sismo → generar informe → guardar favorito.
- **Servicios externos:** en las pruebas, USGS y Gemini se simulan con datos fijos. Nunca se gasta cuota ni se depende de la red. Las llamadas reales se comprueban a mano, una vez, y se muestra el resultado.
- **Antes de dar algo por terminado:** pasan todas las pruebas, sin errores ni avisos del linter, según `AGENTS.md`.
