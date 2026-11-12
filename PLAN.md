# Plan

El agente trabaja una fase cada vez y marca las casillas al cerrarla.

## Fase 0 · Esqueleto

**Objetivo:** una versión mínima que se abre y funciona.

**Tareas:**
- [x] `git init` (el directorio aún no es un repo), `.gitignore` y `.env.example` sin valores.
- [x] `frontend/`: Vite + React + TypeScript + Tailwind, con linter y Vitest.
- [x] `backend/`: FastAPI con `GET /api/health`, con linter y pytest.
- [x] `docker-compose.yml` con PostgreSQL 16.
- [x] Primera pantalla con el nombre «Earthquake Tracker».
- [x] Playwright en `e2e/`.
- [x] Documentar en `docs/project-info.md` los comandos exactos de arranque.

**Pruebas:**
- pytest: `/api/health` responde 200.
- Vitest: la pantalla muestra el nombre.
- Playwright: la app se abre y muestra su nombre.

**Hecho cuando:** la app se abre sin errores, se ve su nombre y las tres pruebas pasan sin avisos del linter.

## Fase 1 · Base de datos y modelo de sismos

**Objetivo:** guardar sismos en PostgreSQL con migraciones.

**Tareas:**
- [x] SQLAlchemy + Alembic conectados a `DATABASE_URL`.
- [x] Modelo y migración de `earthquakes` (índice único en `usgs_id`).
- [x] Base de datos de pruebas separada de la de desarrollo.

**Pruebas:**
- La migración se aplica y se revierte sobre una base vacía.
- Insertar dos veces el mismo `usgs_id` no crea duplicados.

**Hecho cuando:** `alembic upgrade head` crea la tabla y las pruebas de integración pasan.

## Fase 2 · Ingesta de USGS y API de sismos

**Objetivo:** el backend obtiene los sismos de USGS, los guarda y los sirve filtrados y ordenados.

**Tareas:**
- [x] Cliente de los feeds GeoJSON (hora, día, semana) con caché corta de ~1-2 min.
- [x] Parser del GeoJSON a nuestro modelo, separado del cliente HTTP.
- [x] Upsert por `usgs_id` al consultar.
- [x] `GET /api/earthquakes?window=hour|day|week&sort=recent|magnitude|depth|significance&limit=500` (columna `significance` con migración nueva).
- [x] Manejo de errores cuando USGS no responde: se sirve lo ya guardado y se avisa.

**Pruebas:**
- Parser con un GeoJSON de ejemplo: campos, magnitud nula, profundidad.
- Filtros y órdenes con datos fijos.
- Ingesta con USGS simulado: guarda, no duplica y respeta la caché.
- USGS caído: el endpoint devuelve el histórico.

**Hecho cuando:** el endpoint devuelve sismos correctos y las pruebas pasan sin red. Además compruebo una vez contra USGS real y te enseño el resultado.

## Fase 3 · Estadísticas y feed en la interfaz

**Objetivo:** ver la lista de sismos con filtros, orden y estadísticas.

**Tareas:**
- [x] `GET /api/stats`: total en 24 h, magnitud máxima y zona más activa (definición abajo).
- [x] Cliente de API en el frontend.
- [x] Selector de ventana temporal y de orden.
- [x] Lista/tarjetas de sismos y barra de estadísticas.
- [x] Estados de carga y error.

**Pruebas:**
- pytest: cálculo de estadísticas con datos fijos.
- Vitest: la lista cambia al filtrar y ordenar; se ven los estados de carga y error.
- Playwright: cambiar ventana y orden actualiza la lista.

**Hecho cuando:** el dashboard muestra la lista y las estadísticas, y todo pasa.

## Fase 3b · Rediseño visual

**Objetivo:** dar a la interfaz un diseño propio y coherente antes de añadir el mapa.

**Tareas:**
- [x] Tokens de color, tipografía y radio en `index.css` (`@theme`): paleta «mint-pink-accounts», Manrope + JetBrains Mono y radio «soft», repartidos con la skill `design-taste-frontend`.
- [x] Fuentes por enlace de Google Fonts en `index.html`; `lang="es"`, título y descripción corregidos.
- [x] Rediseño de cabecera, estadísticas, controles, tarjetas y mensajes de estado, sin cambiar comportamiento ni textos.
- [x] Interacción: foco visible, pulsación, objetivos táctiles de 44 px y `prefers-reduced-motion`.
- [x] Revisión a 390, 768 y 1440 px.

**Pruebas:**
- Playwright (`e2e/diseno.spec.ts`): sin scroll horizontal a 390/768/1440 px, controles de al menos 44 px, anillo de foco de 2 px, transiciones que se apagan con movimiento reducido y tipografía aplicada.
- Las pruebas de las fases anteriores pasan sin modificarse. Fixture compartida que aborta las peticiones a Google Fonts.

**Hecho cuando:** todo pasa, las capturas reales a 390, 768 y 1440 px se ven bien y `perf.mjs` pasa sobre el build.

## Fase 4 · Mapa interactivo

**Objetivo:** ver los sismos en un mapa mundial.

**Tareas:**
- [x] React-Leaflet con teselas OpenStreetMap.
- [x] Marcadores: tamaño por magnitud y color por profundidad, con función pura y leyenda.
- [x] Popup del marcador y selección sincronizada con la lista.
- [x] Dashboard con mapa, estadísticas y lista.

**Pruebas:**
- Vitest: la función de color y tamaño por rangos y casos límite.
- Playwright: el mapa se carga, hay marcadores y al hacer clic se selecciona el sismo.

**Hecho cuando:** mapa y lista muestran los mismos sismos y se sincronizan.

**Decisiones tomadas:** 4 clases de profundidad (`<30`, `30–70`, `70–300`, `≥300` km), radio `4 + 2,2·M` px, y layout en dos columnas en escritorio (mapa fijo a la derecha) y apilado en móvil. Es la última fase de la interfaz de sismos; las siguientes (5 a 8) añaden pantallas de cuenta, favoritos e informes.

## Fase 5 · Siglas, filtros y resaltado cruzado

**Objetivo:** hacer el dashboard más interactivo con lo que ya tenemos.

**Tareas:**
- [x] Siglas de estados de EE. UU. («CA» → «California») en la zona más activa (`app/stats/us_states.py`).
- [x] Filtros en vivo: magnitud mínima, clases de profundidad y búsqueda por lugar sin acentos ni mayúsculas (`src/filters.ts`, `FilterPanel`), plegables en móvil.
- [x] Contador «Mostrando X de Y» y estado vacío con «Quitar filtros»; las estadísticas siguen siendo globales de 24 h y lo dicen.
- [x] Resaltado cruzado lista ↔ mapa al pasar el ratón o con el foco.
- [x] El mapa se reencuadra al filtrar o cambiar de ventana (no al ordenar).

**Pruebas:** pytest (cada sigla y casos que no deben cambiar), Vitest (`applyFilters` y sus fronteras, panel, resaltado, `App`) y Playwright (filtros, reencuadre, resaltado en ambos sentidos, plegable en móvil).

**Hecho cuando:** todo pasa y, con datos reales, lista y mapa muestran lo mismo bajo cualquier filtro.

## Fase 6 · Histórico

**Objetivo:** consultar terremotos históricos y tenerlos como referencia.

**Tareas:**
- [ ] Cliente del catálogo histórico de USGS (FDSN `query`) con filtros de fecha y magnitud, reutilizando el parser; los sismos se guardan en `earthquakes`.
- [ ] Lista curada de ~30 sismos famosos (archivo propio, con contexto en español), revisada contigo.
- [ ] `GET /api/historical` y `GET /api/historical/featured`.
- [ ] Pestañas «Actualidad / Histórico / Comparar»; la de Histórico con filtros de fechas y magnitud y acceso rápido a los famosos.

**Pruebas:** parser y cliente con USGS simulado, filtros y límites, la lista curada (ids válidos, sin duplicados), pestañas en Vitest y Playwright. Una comprobación real contra USGS.

## Fase 7 · Línea de tiempo y zona dibujada

**Objetivo:** explorar los sismos en el tiempo y en el espacio.

**Tareas:**
- [ ] Línea de tiempo con reproducción, pausa, velocidad y deslizador.
- [ ] Dibujar un círculo en el mapa y filtrar lo que cae dentro (sin dependencias nuevas).

**Pruebas:** funciones puras (orden temporal, distancia al centro, casos límite) y Playwright.

## Fase 8 · Comparar

**Objetivo:** comparar hasta 6 terremotos, actuales o históricos.

**Tareas:**
- [ ] Selección múltiple (máximo 6) desde lista y mapa.
- [ ] Energía liberada (Gutenberg–Richter, `log10 E = 1,5·M + 4,8`) como función pura.
- [ ] Tabla lado a lado, gráfico de barras, dispersión magnitud–profundidad y serie temporal (`GET /api/timeseries`).
- [ ] Dependencia nueva: `recharts` 3.10.1.

**Pruebas:** energía y agregaciones temporales con datos fijos; componentes y Playwright.

## Fase 9 · IA con Gemini

**Objetivo:** informes de IA de sismos seleccionados e históricos, cacheados.

**Tareas:**
- [ ] Cliente Gemini (`google-genai`, modelo `gemini-3.8-flash` configurable con `GEMINI_MODEL`) detrás de una interfaz fácil de simular.
- [ ] Tres informes: de un sismo, comparativo de los seleccionados y contexto histórico de una zona (con las limitaciones de nuestro histórico). Prompt en español con el aviso obligatorio de que no se puede predecir; los textos de USGS van como datos delimitados.
- [ ] Tabla `ai_reports` y migración; se busca en caché antes de llamar. El contexto de zona caduca a las 24 h.
- [ ] Límite de 5 generaciones por IP y hora (las lecturas de caché no cuentan); errores de cuota, clave ausente y timeout con mensaje claro.

**Pruebas:** Gemini simulado (caché, límite, aviso, errores), Vitest y Playwright. Una única llamada real con `GEMINI_API_KEY`, que te enseño.

## Fase 10 · Cuentas de usuario

**Objetivo:** registrarse, iniciar y cerrar sesión.

**Tareas:**
- [ ] Tabla `users` y migración.
- [ ] Hash de contraseña (argon2/bcrypt) y JWT en cookie httpOnly.
- [ ] Endpoints de registro, login, logout y `me`; `JWT_SECRET` en `.env.example`.
- [ ] Pantallas de registro e inicio de sesión y estado de sesión en la interfaz.
- [ ] Exigir sesión para generar informes de IA (sustituye al límite por IP de la Fase 9).

**Pruebas:**
- pytest: la contraseña no se guarda en claro, email duplicado, credenciales erróneas, token inválido o caducado.
- Playwright: registro → logout → login.

**Hecho cuando:** un usuario de prueba entra y sale, y las rutas protegidas devuelven 401 sin sesión.

## Fase 11 · Favoritos

**Objetivo:** guardar zonas y sismos favoritos por usuario.

**Tareas:**
- [ ] Tablas `saved_zones` y `saved_earthquakes`, con migración.
- [ ] CRUD de ambas, siempre filtrado por usuario.
- [ ] Interfaz: estrella en el sismo, guardar una zona (centro y radio) y listado de favoritos.

**Pruebas:**
- pytest: un usuario no ve ni borra los favoritos de otro; radio y coordenadas inválidos.
- Playwright: guardar un sismo y una zona y verlos tras recargar.

**Hecho cuando:** los favoritos persisten y están aislados entre usuarios.

## Fase 12 · Cierre

**Objetivo:** dejar el proyecto listo para usar y entregar.

**Tareas:**
- [ ] Recorrido E2E completo del flujo principal.
- [ ] Revisar estados vacíos, errores y diseño en móvil.
- [ ] `README` con arranque y `.env.example` completo.
- [ ] Revisar que no hay claves ni datos reales en git.

**Pruebas:**
- Toda la batería (pytest, Vitest, Playwright, linters) en limpio.

**Hecho cuando:** desde un clon limpio, siguiendo el README, la app arranca y todo pasa. El despliegue queda fuera y requiere tu permiso.

## Decisiones

- ~~Zona más activa~~ (resuelto): región = lo que va tras la última coma del `place` de USGS, sin el prefijo «N km DIR of»; las siglas de EE. UU. se traducen a su nombre (Fase 5). En empate gana la primera alfabéticamente.
- **Quién puede generar informes:** hasta la Fase 10, límite por IP y caché; desde entonces, exigir sesión. Ver los sismos y el mapa es público.
- **Caducidad del contexto histórico de zona:** 24 h. El informe de un sismo no caduca.
- **Modelo de Gemini:** `gemini-2.5-flash` está deprecado y se apaga el 1 de diciembre de 2026; se usa `gemini-3.8-flash`.
