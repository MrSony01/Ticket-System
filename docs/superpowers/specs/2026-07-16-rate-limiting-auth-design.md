# Rate limiting en /api/auth/login

## Contexto

AgentX no tiene ninguna protección contra intentos repetidos de login. Un atacante (o un script) puede probar contraseñas indefinidamente contra `POST /api/auth/login` sin ninguna fricción. Esto es parte de los pendientes para cerrar la demo del portafolio.

## Objetivo

Limitar los intentos de login por IP para frenar ataques de fuerza bruta, sin afectar el uso normal de la app (un usuario real equivocándose de contraseña un par de veces no debería verse bloqueado).

## Alcance

Solo se protege `POST /api/auth/login`. Se decidió explícitamente dejar fuera `register` y `accept-invite` por ahora: se usan con mucha menor frecuencia y no exponen credenciales de cuentas existentes de la misma forma que login.

## Enfoque elegido

Usar la librería `express-rate-limit` (estándar de facto en el ecosistema Express, store en memoria).

Alternativas consideradas:
- Middleware manual con un `Map` propio — descartado, no aporta nada sobre la librería para este caso y es más código a mantener.
- Store distribuido (`rate-limit-redis`) — descartado por sobre-ingeniería; la app corre en una sola instancia y no hay infraestructura de Redis en el proyecto.

## Diseño

**Dependencia nueva:** `express-rate-limit` en `backend/package.json`.

**Nuevo archivo:** `backend/src/middlewares/rateLimitMiddleware.js`
- Exporta `loginLimiter`: máximo 5 intentos cada 15 minutos, agrupado por IP.
- `standardHeaders: true`, `legacyHeaders: false` (headers `RateLimit-*` estándar).
- Al exceder el límite, responde `429` con el mismo shape de error que ya usa el resto de la API: `{ message: '...' }`, con el mensaje: *"Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos."*

**`backend/src/routes/authRoutes.js`:** se aplica `loginLimiter` únicamente a la ruta `POST /login`, antes del controller.

**`backend/src/app.js`:** se agrega `app.set('trust proxy', 1)`.
- Necesario porque el target de deploy (Railway) corre la app detrás de un proxy inverso. Sin esto, `express-rate-limit` ve la IP del proxy en vez de la del cliente real — todos los requests contarían como una sola IP (o la librería puede lanzar un error de configuración al detectar `X-Forwarded-For` sin `trust proxy` configurado).

**Frontend:** sin cambios. `Login.jsx` ya muestra cualquier `message` de error devuelto por la API en su `role="alert"`, así que el mensaje de 429 se despliega igual que cualquier otro error de login.

## Testing

Verificación manual (no hay suite de tests automatizados en el backend):
1. Levantar el backend (`npm run dev` en `backend/`).
2. Hacer 6 intentos seguidos de `POST /api/auth/login` con credenciales incorrectas contra el mismo email/IP.
3. Confirmar que los primeros 5 devuelven `401` (credenciales inválidas, comportamiento normal).
4. Confirmar que el 6º devuelve `429` con el mensaje esperado.
5. Confirmar que un login válido sigue funcionando antes de alcanzar el límite (no rompe el flujo normal).

## Fuera de alcance

- Rate limiting en `register` y `accept-invite` (evaluar en el futuro si se detecta abuso).
- Persistencia del contador entre reinicios del servidor (store en memoria se resetea al reiniciar — aceptable para este proyecto).
