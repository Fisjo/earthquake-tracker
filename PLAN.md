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

## Fase 4 · Mapa interactivo

**Objetivo:** ver los sismos en un mapa mundial.

**Tareas:**
- [ ] React-Leaflet con teselas OpenStreetMap.
- [ ] Marcadores: tamaño por magnitud y color por profundidad, con función pura y leyenda.
- [ ] Popup del marcador y selección sincronizada con la lista.
- [ ] Dashboard con mapa, estadísticas y lista.

**Pruebas:**
- Vitest: la función de color y tamaño por rangos y casos límite.
- Playwright: el mapa se carga, hay marcadores y al hacer clic se selecciona el sismo.

**Hecho cuando:** mapa y lista muestran los mismos sismos y se sincronizan.

## Fase 5 · Cuentas de usuario

**Objetivo:** registrarse, iniciar y cerrar sesión.

**Tareas:**
- [ ] Tabla `users` y migración.
- [ ] Hash de contraseña (argon2/bcrypt) y JWT en cookie httpOnly.
- [ ] Endpoints de registro, login, logout y `me`; `JWT_SECRET` en `.env.example`.
- [ ] Pantallas de registro e inicio de sesión y estado de sesión en la interfaz.

**Pruebas:**
- pytest: la contraseña no se guarda en claro, email duplicado, credenciales erróneas, token inválido o caducado.
- Playwright: registro → logout → login.

**Hecho cuando:** un usuario de prueba entra y sale, y las rutas protegidas devuelven 401 sin sesión.

## Fase 6 · Favoritos

**Objetivo:** guardar zonas y sismos favoritos por usuario.

**Tareas:**
- [ ] Tablas `saved_zones` y `saved_earthquakes`, con migración.
- [ ] CRUD de ambas, siempre filtrado por usuario.
- [ ] Interfaz: estrella en el sismo, guardar una zona (centro y radio) y listado de favoritos.

**Pruebas:**
- pytest: un usuario no ve ni borra los favoritos de otro; radio y coordenadas inválidos.
- Playwright: guardar un sismo y una zona y verlos tras recargar.

**Hecho cuando:** los favoritos persisten y están aislados entre usuarios.

## Fase 7 · Informe de Evento con Gemini

**Objetivo:** generar y cachear el informe de un sismo.

**Tareas:**
- [ ] Cliente Gemini (`google-genai`, `gemini-2.5-flash`) detrás de una interfaz fácil de simular.
- [ ] Prompt en español con el aviso obligatorio de que no se puede predecir.
- [ ] Tabla `ai_reports` y migración; antes de llamar a Gemini se busca en caché.
- [ ] Endpoint de generación (requiere sesión) y panel de detalle con el botón.
- [ ] Errores de la API (cuota, clave ausente, timeout) con mensaje claro.

**Pruebas:**
- pytest con Gemini simulado: la segunda petición no vuelve a llamar; el aviso está en el prompt; los errores se gestionan.
- Vitest: estados del botón (cargando, resultado, error).
- Playwright con Gemini simulado: generar el informe y verlo.

**Hecho cuando:** el informe se genera una vez y se reutiliza. Compruebo una llamada real con `GEMINI_API_KEY` y te enseño el resultado.

## Fase 8 · Análisis de Zona con Gemini

**Objetivo:** analizar la actividad de la región a partir de nuestro histórico.

**Tareas:**
- [ ] Consulta de sismos cercanos (radio) en `earthquakes` y resumen estadístico previo.
- [ ] Prompt que recibe ese resumen y las limitaciones del histórico propio (que no cubre toda la historia).
- [ ] Caché por zona y tipo en `ai_reports`, con caducidad.
- [ ] Botón «Análisis de Zona» en el panel de detalle y en las zonas guardadas.

**Pruebas:**
- pytest: la consulta por radio con casos límite y el resumen con datos fijos.
- pytest: caché, caducidad y aviso de no predicción.
- Playwright con Gemini simulado: pedir el análisis de una zona.

**Hecho cuando:** el análisis usa solo datos de nuestra base y las pruebas pasan.

## Fase 9 · Cierre

**Objetivo:** dejar el proyecto listo para usar y entregar.

**Tareas:**
- [ ] Recorrido E2E completo del flujo principal.
- [ ] Revisar estados vacíos, errores y diseño en móvil.
- [ ] `README` con arranque y `.env.example` completo.
- [ ] Revisar que no hay claves ni datos reales en git.

**Pruebas:**
- Toda la batería (pytest, Vitest, Playwright, linters) en limpio.

**Hecho cuando:** desde un clon limpio, siguiendo el README, la app arranca y todo pasa. El despliegue queda fuera y requiere tu permiso.

## Decisiones pendientes

- ~~Zona más activa~~ (resuelto en la Fase 3): región = lo que va tras la última coma del `place` de USGS, sin el prefijo «N km DIR of» («Chile», «Papua New Guinea»); sin coma, el lugar tal cual («Mid-Indian Ridge»). Gana la de más sismos en 24 h; en empate, la primera alfabéticamente. Pendiente de mejora: USGS abrevia los estados de EE. UU. («CA»).
- **Quién puede generar informes:** propongo exigir sesión, para proteger la cuota de Gemini. Ver los sismos y el mapa sería público.
- **Caducidad del Análisis de Zona:** propongo 24 h. El Informe de Evento no caduca.
