# Rate limiting en /api/auth/login — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Frenar ataques de fuerza bruta contra `POST /api/auth/login` limitando los intentos por IP, sin afectar el flujo normal de un usuario real.

**Architecture:** Middleware `loginLimiter` construido con la librería `express-rate-limit` (store en memoria, un solo proceso backend), aplicado únicamente a la ruta de login. Se configura `trust proxy` en Express para que el conteo por IP funcione correctamente detrás del proxy de Railway.

**Tech Stack:** Node.js + Express 5, `express-rate-limit` v8.

## Global Constraints

- Solo se protege `POST /api/auth/login`. NO tocar `register` ni `accept-invite` — está fuera de alcance según la spec.
- Límite: `limit: 5`, `windowMs: 15 * 60 * 1000` (15 minutos), agrupado por IP (comportamiento default de la librería).
- `standardHeaders: true`, `legacyHeaders: false`.
- Mensaje exacto al exceder el límite: `{ message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' }` (mismo shape `{ message }` que el resto de la API).
- `app.set('trust proxy', 1)` en `backend/src/app.js` — necesario porque Railway corre la app detrás de un proxy inverso; sin esto el rate limiter vería la IP del proxy en vez de la del cliente real.
- No se toca el frontend — `Login.jsx` ya renderiza cualquier `message` de error de la API.
- No hay framework de tests automatizados en `backend/` — la verificación es manual (curl) contra el servidor corriendo.

---

### Task 1: Instalar la librería y crear el middleware `loginLimiter`

**Files:**
- Modify: `backend/package.json` (vía `npm install`)
- Create: `backend/src/middlewares/rateLimitMiddleware.js`

**Interfaces:**
- Produces: `loginLimiter` — named export, una función middleware de Express (firma estándar `(req, res, next)`), lista para usarse como `router.post('/login', loginLimiter, login)` en la Task 2.

- [ ] **Step 1: Instalar `express-rate-limit`**

Run (desde `backend/`):
```bash
cd backend && npm install express-rate-limit
```
Expected: el comando termina sin errores y `backend/package.json` gana la entrada `"express-rate-limit": "^8.x.x"` en `dependencies`.

- [ ] **Step 2: Crear el middleware**

Crear `backend/src/middlewares/rateLimitMiddleware.js`:

```js
import { rateLimit } from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 5,                 // máximo 5 intentos por IP en la ventana
  standardHeaders: true,    // headers RateLimit-*
  legacyHeaders: false,     // sin headers X-RateLimit-*
  message: { message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
});
```

- [ ] **Step 3: Verificar sintaxis del archivo**

Run:
```bash
node --check backend/src/middlewares/rateLimitMiddleware.js
```
Expected: sin salida (exit code 0) — confirma que el archivo tiene sintaxis JS válida antes de integrarlo.

- [ ] **Step 4: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/middlewares/rateLimitMiddleware.js
git commit -m "feat: add express-rate-limit login middleware"
```

---

### Task 2: Aplicar el limiter a la ruta de login y configurar `trust proxy`

**Files:**
- Modify: `backend/src/routes/authRoutes.js`
- Modify: `backend/src/app.js`

**Interfaces:**
- Consumes: `loginLimiter` desde `../middlewares/rateLimitMiddleware.js` (Task 1).

- [ ] **Step 1: Importar y aplicar `loginLimiter` en la ruta de login**

En `backend/src/routes/authRoutes.js`, el archivo completo queda así:

```js
import { Router } from 'express';
import { register, login, getMe, updateMe, changePassword, getInvite, acceptInvite } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { loginLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login',    loginLimiter, login);

router.get('/me',              authenticate, getMe);
router.patch('/me',            authenticate, updateMe);
router.patch('/me/password',   authenticate, changePassword);

router.get('/invite/:token',  getInvite);
router.post('/invite/:token', acceptInvite);

export default router;
```

- [ ] **Step 2: Configurar `trust proxy` en `app.js`**

En `backend/src/app.js`, agregar la línea inmediatamente después de crear la app (justo antes de los middlewares globales existentes):

```js
const app = express();

app.set('trust proxy', 1); // Railway corre la app detrás de un proxy inverso

// Middlewares globales
app.use(cors());                  // Permite peticiones desde el frontend
app.use(express.json());          // Permite leer JSON en el body de las peticiones
```

- [ ] **Step 3: Arrancar el backend y confirmar que bootea sin errores**

Run (desde `backend/`, requiere que la base de datos ya esté corriendo — ver precondición de la Task 3):
```bash
cd backend && npm run dev
```
Expected: log de arranque normal (conexión a DB + `Servidor corriendo en el puerto 4000` o equivalente), sin stack traces. Dejar el proceso corriendo para la Task 3 (o detenerlo con Ctrl+C y confirmar que no hay errores de sintaxis/import).

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/authRoutes.js backend/src/app.js
git commit -m "feat: rate limit login endpoint, trust proxy for Railway"
```

---

### Task 3: Verificación manual end-to-end

**Precondición:** backend corriendo con su base de datos accesible (`docker compose up --build` desde la raíz del proyecto, o `cd backend && npm run dev` con `DB_HOST=localhost` si MySQL corre local). El login se prueba con un email que NO existe en la base — el limiter cuenta el request en la ruta sin importar si el email es válido, y así no dependemos de credenciales reales.

- [ ] **Step 1: Disparar 6 intentos de login seguidos con credenciales incorrectas**

Run:
```bash
for i in 1 2 3 4 5 6; do
  echo "Intento $i:"
  curl -s -o /tmp/resp.json -w "  status=%{http_code}\n" \
    -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"no-existe@ejemplo.com","password":"cualquier-cosa"}'
  cat /tmp/resp.json; echo
done
```

Expected:
- Intentos 1–5: `status=401` con body `{"message":"Credenciales inválidas."}`
- Intento 6: `status=429` con body `{"message":"Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos."}`

- [ ] **Step 2: Confirmar los headers `RateLimit-*`**

Run:
```bash
curl -s -D - -o /dev/null \
  -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"no-existe@ejemplo.com","password":"cualquier-cosa"}' | grep -i ratelimit
```
Expected: se ven headers como `RateLimit-Limit: 5`, `RateLimit-Remaining: 0` (ya que el límite sigue consumido del Step 1 dentro de la ventana de 15 min), y `Retry-After`.

- [ ] **Step 3: Confirmar que un login válido sigue funcionando fuera del límite**

Esperar a que expire la ventana de 15 minutos (o reiniciar el proceso del backend, ya que el store es en memoria y se resetea al reiniciar), y luego hacer un login con credenciales válidas de un usuario real existente en la base:
```bash
curl -s -w "\nstatus=%{http_code}\n" \
  -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<email-de-un-usuario-real>","password":"<su-password>"}'
```
Expected: `status=200` con el JWT y datos del usuario — confirma que el rate limiting no rompe el flujo normal de login.

- [ ] **Step 4: No requiere commit** (paso de verificación manual, no produce cambios de código).
