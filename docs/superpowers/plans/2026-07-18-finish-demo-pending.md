# Finish Demo Pending Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close out the four remaining "finishing the demo" pending items from `CLAUDE.md`: email notifications, a ticket history timeline, README screenshots, and a landing page polish pass.

**Architecture:** Backend additions (`emailService.js`, an `activity_log`-backed ticket-history endpoint) reuse existing patterns (fire-and-forget side effects like `Activity.log`/`Notif.create`, existing DB tables — no schema changes). Frontend additions (timeline UI, landing fixes) follow the existing dark-violet design system already used throughout `frontend/src/pages/`.

**Tech Stack:** Node.js/Express 5 (ES modules), nodemailer + Ethereal (fake SMTP), MariaDB via `mysql2/promise`, React 19 + Tailwind CSS 3.

## Global Constraints

- Backend is ES modules (`"type": "module"` in `backend/package.json`) — use `import`/`export`, not `require`.
- Email uses Ethereal only (nodemailer's disposable test SMTP) — no real credentials, no new env vars for this pass.
- No database schema changes — the ticket history feature reuses the existing `activity_log` table as-is.
- This project has no automated test framework (no Jest/Vitest/etc. in either `backend/package.json` or `frontend/package.json`). Verification steps in this plan are manual (curl / node one-liners / browser checks), matching the project's existing testing approach. Do not introduce a test framework as a side effect of this plan.
- Follow existing per-file patterns: controllers import models as `import * as X from '../models/xModel.js'`; side-effect calls (logging, notifications) are fire-and-forget (not awaited, errors caught and logged inside the callee) so they never fail the main request.
- Role-based ticket visibility must stay consistent everywhere: `user` → only own tickets, `technician` → only assigned tickets, `admin` → everything (same rule already enforced in `getTicket` in `backend/src/controllers/ticketController.js:15-33`).

---

### Task 1: Email service (nodemailer + Ethereal)

**Files:**
- Modify: `backend/package.json` (adds `nodemailer` dependency via npm)
- Create: `backend/src/services/emailService.js`

**Interfaces:**
- Produces: `sendMail({ to, subject, html }) => Promise<void>` — exported async function, swallows its own errors (never throws), logs an Ethereal preview URL to the console on success. Task 2 imports this.

- [ ] **Step 1: Install nodemailer**

Run from the `backend/` directory:
```bash
cd backend
npm install nodemailer
```
Expected: `package.json` gains a `"nodemailer": "^..."` line under `dependencies`, and `package-lock.json` updates.

- [ ] **Step 2: Create the email service**

Create `backend/src/services/emailService.js`:

```js
import nodemailer from 'nodemailer';

let transporterPromise = null;

function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = nodemailer.createTestAccount().then(account =>
      nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      })
    );
  }
  return transporterPromise;
}

export async function sendMail({ to, subject, html }) {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: '"AgentX" <no-reply@agentx.test>',
      to,
      subject,
      html,
    });
    console.log(`[email] "${subject}" -> ${to}: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (e) {
    console.error('[email:send]', e.message);
  }
}
```

- [ ] **Step 3: Verify it sends via Ethereal**

Run from `backend/`:
```bash
node -e "import('./src/services/emailService.js').then(m => m.sendMail({ to: 'demo@example.com', subject: 'Test', html: '<p>hola</p>' }))"
```
Expected: after a couple seconds, a console line like:
```
[email] "Test" -> demo@example.com: https://ethereal.email/message/XXXXXXXXXXXXXXXX
```
Opening that URL in a browser should show the test email. If nothing prints, check for a `[email:send]` error line (usually a network/DNS issue reaching Ethereal).

- [ ] **Step 4: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/services/emailService.js
git commit -m "feat: add nodemailer email service backed by Ethereal"
```

---

### Task 2: Send emails on ticket assign / status change / comment

**Files:**
- Modify: `backend/src/controllers/ticketController.js:1-4` (imports), `:54-107` (`updateTicket`), `:109-157` (`commentTicket`)

**Interfaces:**
- Consumes: `sendMail({ to, subject, html })` from Task 1 (`backend/src/services/emailService.js`); `findById(id, companyId) => { id, name, email, role, company_id, created_at } | null` from `backend/src/models/userModel.js:24-30` (already exists).
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Add imports**

In `backend/src/controllers/ticketController.js`, replace:
```js
import * as Ticket from '../models/ticketModel.js';
import * as Activity from '../models/activityModel.js';
import * as Notif from '../models/notificationModel.js';
import pool from '../config/db.js';
```
with:
```js
import * as Ticket from '../models/ticketModel.js';
import * as Activity from '../models/activityModel.js';
import * as Notif from '../models/notificationModel.js';
import * as User from '../models/userModel.js';
import { sendMail } from '../services/emailService.js';
import pool from '../config/db.js';
```

- [ ] **Step 2: Email the assignee on ticket assignment**

In `updateTicket`, replace:
```js
  // Notify assignee when ticket is assigned
  if (fields.assigned_to) {
    Notif.create({
      userId: fields.assigned_to,
      companyId: company_id,
      type: 'ticket_assigned',
      title: 'Ticket asignado',
      message: `Se te ha asignado el ticket #${id}`,
      entityId: Number(id),
    });
  }
```
with:
```js
  // Notify assignee when ticket is assigned
  if (fields.assigned_to) {
    Notif.create({
      userId: fields.assigned_to,
      companyId: company_id,
      type: 'ticket_assigned',
      title: 'Ticket asignado',
      message: `Se te ha asignado el ticket #${id}`,
      entityId: Number(id),
    });
    User.findById(fields.assigned_to, company_id).then(assignee => {
      if (assignee?.email) {
        sendMail({
          to: assignee.email,
          subject: `Ticket asignado #${id}`,
          html: `<p>Se te ha asignado el ticket <strong>#${id}</strong>.</p>`,
        });
      }
    });
  }
```

- [ ] **Step 3: Email the creator on status change**

In the same function, replace:
```js
  // Notify when status changes
  if (fields.status) {
    const ticket = await Ticket.findById(id, company_id);
    if (ticket && ticket.creator_id !== userId) {
      Notif.create({
        userId: ticket.creator_id,
        companyId: company_id,
        type: 'ticket_updated',
        title: 'Estado de ticket actualizado',
        message: `Tu ticket #${id} cambió a "${fields.status}"`,
        entityId: Number(id),
      });
    }
  }
```
with:
```js
  // Notify when status changes
  if (fields.status) {
    const ticket = await Ticket.findById(id, company_id);
    if (ticket && ticket.creator_id !== userId) {
      Notif.create({
        userId: ticket.creator_id,
        companyId: company_id,
        type: 'ticket_updated',
        title: 'Estado de ticket actualizado',
        message: `Tu ticket #${id} cambió a "${fields.status}"`,
        entityId: Number(id),
      });
      User.findById(ticket.creator_id, company_id).then(creator => {
        if (creator?.email) {
          sendMail({
            to: creator.email,
            subject: `Actualización de ticket #${id}`,
            html: `<p>Tu ticket <strong>#${id}</strong> cambió a "${fields.status}".</p>`,
          });
        }
      });
    }
  }
```

- [ ] **Step 4: Email on new comment**

In `commentTicket`, replace:
```js
  // Notify ticket creator (if commenter is not the creator)
  if (ticket.creator_id !== userId && !isInternal) {
    Notif.create({
      userId: ticket.creator_id,
      companyId: company_id,
      type: 'comment_added',
      title: 'Nuevo comentario',
      message: `Hay un nuevo comentario en tu ticket #${ticketId}`,
      entityId: Number(ticketId),
    });
  }

  // Notify assignee (if exists and is not the commenter)
  if (ticket.assignee_id && ticket.assignee_id !== userId && ticket.assignee_id !== ticket.creator_id) {
    Notif.create({
      userId: ticket.assignee_id,
      companyId: company_id,
      type: 'comment_added',
      title: 'Nuevo comentario',
      message: `Hay un nuevo comentario en el ticket #${ticketId}`,
      entityId: Number(ticketId),
    });
  }
```
with:
```js
  // Notify ticket creator (if commenter is not the creator)
  if (ticket.creator_id !== userId && !isInternal) {
    Notif.create({
      userId: ticket.creator_id,
      companyId: company_id,
      type: 'comment_added',
      title: 'Nuevo comentario',
      message: `Hay un nuevo comentario en tu ticket #${ticketId}`,
      entityId: Number(ticketId),
    });
    User.findById(ticket.creator_id, company_id).then(creator => {
      if (creator?.email) {
        sendMail({
          to: creator.email,
          subject: `Nuevo comentario en ticket #${ticketId}`,
          html: `<p>Hay un nuevo comentario en tu ticket <strong>#${ticketId}</strong>.</p>`,
        });
      }
    });
  }

  // Notify assignee (if exists and is not the commenter)
  if (ticket.assignee_id && ticket.assignee_id !== userId && ticket.assignee_id !== ticket.creator_id) {
    Notif.create({
      userId: ticket.assignee_id,
      companyId: company_id,
      type: 'comment_added',
      title: 'Nuevo comentario',
      message: `Hay un nuevo comentario en el ticket #${ticketId}`,
      entityId: Number(ticketId),
    });
    User.findById(ticket.assignee_id, company_id).then(assignee => {
      if (assignee?.email) {
        sendMail({
          to: assignee.email,
          subject: `Nuevo comentario en ticket #${ticketId}`,
          html: `<p>Hay un nuevo comentario en el ticket <strong>#${ticketId}</strong>.</p>`,
        });
      }
    });
  }
```

- [ ] **Step 5: Verify end-to-end against a running backend**

Start the database and backend:
```bash
docker compose up -d db
cd backend
npm run dev
```
In another terminal, register a company + admin, then create and update a ticket to trigger all three email paths (adjust email/password to taste):
```bash
curl -s -X POST http://localhost:4000/api/auth/register -H "Content-Type: application/json" \
  -d '{"companyName":"Demo Co","name":"Admin Demo","email":"admin@demo.test","password":"demo1234"}'

TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.test","password":"demo1234"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).token))")

TICKET_ID=$(curl -s -X POST http://localhost:4000/api/tickets -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test ticket","description":"desc"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).id))")

curl -s -X PATCH http://localhost:4000/api/tickets/$TICKET_ID -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"in_progress"}'

curl -s -X POST http://localhost:4000/api/tickets/$TICKET_ID/comments -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"a comment"}'
```
Expected: the backend console prints one `[email] ...` line with an Ethereal preview URL for the status-change PATCH (the admin is both creator and actor here, so the assign-email path won't fire without a second user — that's fine, it was already exercised in Task 1 Step 3). Since the admin is the sole user, the comment-notify paths only fire when creator/assignee differ from the commenter; to see all three paths, repeat with an invited technician assigned to the ticket, or accept that Task 1's isolated test already proved `sendMail` works and this step is confirming it's wired into at least one real request path.

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/ticketController.js
git commit -m "feat: send Ethereal emails on ticket assign, status change, and comment"
```

---

### Task 3: Backend ticket-history endpoint

**Files:**
- Modify: `backend/src/models/activityModel.js` (add `findForEntity`)
- Modify: `backend/src/controllers/ticketController.js` (add `getTicketActivity`)
- Modify: `backend/src/routes/ticketRoutes.js` (add route)

**Interfaces:**
- Produces: `Activity.findForEntity(companyId, entityType, entityId) => Promise<Array<{ id, action, entity_type, entity_id, metadata, created_at, user_name, user_role }>>` — Task 4 (frontend) consumes the resulting JSON shape via `GET /api/tickets/:id/activity`.

- [ ] **Step 1: Add the model query**

In `backend/src/models/activityModel.js`, add this function after `log(...)` (before `findAll`):

```js
export async function findForEntity(companyId, entityType, entityId) {
  const [rows] = await pool.execute(
    `SELECT a.id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at,
            u.name AS user_name, u.role AS user_role
     FROM activity_log a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE a.company_id = ? AND a.entity_type = ? AND a.entity_id = ?
     ORDER BY a.created_at ASC`,
    [companyId, entityType, entityId]
  );
  return rows;
}
```

- [ ] **Step 2: Add the controller function**

In `backend/src/controllers/ticketController.js`, replace:
```js
  res.json(ticket);
}

export async function createTicket(req, res) {
```
with:
```js
  res.json(ticket);
}

export async function getTicketActivity(req, res) {
  const { id: userId, role, company_id } = req.user;
  const { id } = req.params;

  const ticket = await Ticket.findById(id, company_id);
  if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });

  if (role === 'user' && ticket.creator_id !== userId) {
    return res.status(403).json({ message: 'No tienes permiso para ver este ticket.' });
  }
  if (role === 'technician' && ticket.assignee_id !== userId) {
    return res.status(403).json({ message: 'No tienes permiso para ver este ticket.' });
  }

  const logs = await Activity.findForEntity(company_id, 'ticket', Number(id));
  res.json(logs);
}

export async function createTicket(req, res) {
```

- [ ] **Step 3: Wire the route**

In `backend/src/routes/ticketRoutes.js`, replace:
```js
import {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  commentTicket,
  exportTickets,
} from '../controllers/ticketController.js';

const router = Router();

router.use(authenticate);

router.get('/',        getTickets);
router.get('/export',  authorize('admin'), exportTickets);
router.get('/:id',     getTicket);
```
with:
```js
import {
  getTickets,
  getTicket,
  getTicketActivity,
  createTicket,
  updateTicket,
  commentTicket,
  exportTickets,
} from '../controllers/ticketController.js';

const router = Router();

router.use(authenticate);

router.get('/',            getTickets);
router.get('/export',      authorize('admin'), exportTickets);
router.get('/:id',         getTicket);
router.get('/:id/activity', getTicketActivity);
```

- [ ] **Step 4: Verify with curl**

With the backend running (from Task 2 Step 5, or restart `npm run dev` in `backend/`) and a valid `$TOKEN` + `$TICKET_ID` from a ticket that has at least a creation event and a status update:
```bash
curl -s http://localhost:4000/api/tickets/$TICKET_ID/activity -H "Authorization: Bearer $TOKEN"
```
Expected: a JSON array with at least two entries, e.g.:
```json
[
  {"id":1,"action":"ticket_created","entity_type":"ticket","entity_id":1,"metadata":{"title":"Test ticket","priority":"medium"},"created_at":"...","user_name":"Admin Demo","user_role":"admin"},
  {"id":2,"action":"ticket_updated","entity_type":"ticket","entity_id":1,"metadata":{"status":"in_progress"},"created_at":"...","user_name":"Admin Demo","user_role":"admin"}
]
```
Also verify the 403 path: log in as a plain `user` who does not own the ticket and confirm the same request returns `{"message":"No tienes permiso para ver este ticket."}` with status 403.

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/activityModel.js backend/src/controllers/ticketController.js backend/src/routes/ticketRoutes.js
git commit -m "feat: add GET /api/tickets/:id/activity endpoint"
```

---

### Task 4: Ticket history timeline UI

**Files:**
- Modify: `frontend/src/pages/TicketDetail.jsx`

**Interfaces:**
- Consumes: `GET /api/tickets/:id/activity` from Task 3, returning the array shape documented there.

- [ ] **Step 1: Add activity dot colors and a description helper**

In `frontend/src/pages/TicketDetail.jsx`, replace:
```js
const PRIORITY_DOT = {
  low: 'bg-zinc-500', medium: 'bg-blue-400', high: 'bg-orange-400', critical: 'bg-red-500',
};
```
with:
```js
const PRIORITY_DOT = {
  low: 'bg-zinc-500', medium: 'bg-blue-400', high: 'bg-orange-400', critical: 'bg-red-500',
};

const ACTIVITY_DOT = {
  ticket_created: 'bg-emerald-500',
  ticket_updated: 'bg-blue-500',
  comment_added:  'bg-violet-500',
};

function describeActivity(entry) {
  const meta = entry.metadata
    ? (typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata)
    : null;

  if (entry.action === 'ticket_created') return 'creó el ticket';
  if (entry.action === 'comment_added')  return 'agregó un comentario';
  if (entry.action === 'ticket_updated' && meta) {
    const parts = [];
    if (meta.status)   parts.push(`estado a "${STATUS_LABELS[meta.status] ?? meta.status}"`);
    if (meta.priority) parts.push(`prioridad a "${PRIORITY_LABELS[meta.priority] ?? meta.priority}"`);
    if (meta.assigned_to !== undefined) parts.push(meta.assigned_to ? 'reasignó el ticket' : 'quitó la asignación');
    if (meta.category_id !== undefined) parts.push('cambió la categoría');
    return parts.length ? `actualizó ${parts.join(', ')}` : 'actualizó el ticket';
  }
  return 'realizó una acción';
}
```

- [ ] **Step 2: Fetch activity alongside the ticket**

Replace:
```js
  const [ticket,      setTicket]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
```
with:
```js
  const [ticket,      setTicket]      = useState(null);
  const [activity,    setActivity]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
```

Then replace:
```js
  async function load() {
    try {
      const data = await api.get(`/tickets/${id}`);
      setTicket(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
```
with:
```js
  async function load() {
    try {
      const [data, activityData] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/tickets/${id}/activity`),
      ]);
      setTicket(data);
      setActivity(activityData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
```

- [ ] **Step 3: Render the timeline below the comments card**

Replace the end of the comments card and the left-column closing tag:
```js
            </form>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
```
with:
```js
            </form>
          </div>

          {/* History timeline */}
          <div className="rounded-2xl p-5" style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-4">
              Historial · {activity.length}
            </p>
            {activity.length === 0 ? (
              <p className="text-sm text-zinc-600">Sin actividad registrada.</p>
            ) : (
              <ul className="space-y-4">
                {activity.map((entry, i) => (
                  <li key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <span className={`w-2 h-2 rounded-full mt-1 ${ACTIVITY_DOT[entry.action] ?? 'bg-zinc-600'}`} />
                      {i < activity.length - 1 && (
                        <span className="w-px flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-xs text-zinc-300">
                        <span className="font-semibold text-zinc-200">{entry.user_name ?? 'Sistema'}</span>
                        {' '}{describeActivity(entry)}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {new Date(entry.created_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
```

- [ ] **Step 4: Verify in the browser**

```bash
cd frontend
npm run dev
```
Log in, open a ticket that has had a status change and a comment, and confirm a "Historial" card appears below the comments thread showing one entry per event (creation, update, comment), each with actor name, description, and timestamp, ordered oldest → newest with a connecting line between dots.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/TicketDetail.jsx
git commit -m "feat: show ticket activity history timeline in TicketDetail"
```

---

### Task 5: Landing page polish

**Files:**
- Modify: `frontend/src/pages/Landing.jsx`

- [ ] **Step 1: Mark decorative icons as `aria-hidden` (accessibility parity with the rest of the app)**

`CLAUDE.md` documents that every other page in this app went through an accessibility pass where "all icon SVGs `aria-hidden='true'`" — `Landing.jsx` was missed since it predates that pass on the public marketing page. Every `<svg>` in this file is purely decorative (no icon-only interactive elements). Fix all 11 occurrences in one shot:

Use the Edit tool on `frontend/src/pages/Landing.jsx` with `replace_all: true`:
- old_string: `<svg `
- new_string: `<svg aria-hidden="true" `

- [ ] **Step 2: Verify the count**

```bash
grep -c 'aria-hidden="true"' frontend/src/pages/Landing.jsx
```
Expected: `11`.

- [ ] **Step 3: Remove a dead `hover:text-white` class**

In the final CTA section, replace:
```js
              <Link
                to="/login"
                className="text-white hover:text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}
```
with:
```js
              <Link
                to="/login"
                className="text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}
```
(`hover:text-white` was a no-op since the base class is already `text-white`.)

- [ ] **Step 4: Lint and visually verify**

```bash
cd frontend
npm run lint
npm run dev
```
Open `/` in a browser and confirm the page renders identically to before (icons still visible — `aria-hidden` doesn't affect visual rendering) and the final CTA's "Ya tengo cuenta" link still has its hover background transition.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Landing.jsx
git commit -m "fix: accessibility parity and dead-class cleanup on landing page"
```

---

### Task 6: README screenshots and roadmap sync

**Files:**
- Create: `docs/screenshots/*.png` (landing, login, dashboard, kanban, ticket-detail, reports, sla)
- Modify: `README.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: the running app from Tasks 1-5 (specifically the new history timeline from Task 4 and the polished landing from Task 5, so the screenshots reflect current state).

- [ ] **Step 1: Run the full stack**

```bash
docker compose up --build
```
Confirm frontend is reachable at `http://localhost:5173` and backend at `http://localhost:4000`.

- [ ] **Step 2: Seed a demo account and some ticket data**

Register a demo company through the UI (or reuse the `admin@demo.test` account created during Task 2 verification), and make sure at least one ticket exists with a status change, an assignment, and a comment, so the Dashboard, Kanban, and TicketDetail screenshots show real content instead of empty states.

- [ ] **Step 3: Capture screenshots**

Use the agent-browser skill to navigate and capture, saving each to `docs/screenshots/`:
- `landing.png` — `/` (logged out)
- `login.png` — `/login`
- `dashboard.png` — `/dashboard` (with at least one ticket visible)
- `kanban.png` — `/kanban`
- `ticket-detail.png` — an individual ticket's `/tickets/:id` page, scrolled to show the new history timeline
- `reports.png` — `/admin/reportes` (as admin)
- `sla.png` — `/admin/sla` (as admin)

- [ ] **Step 4: Add a Screenshots section to the README**

In `README.md`, insert a new section after `## Features` (before `## Roles`):
```markdown
## Screenshots

| Landing | Dashboard |
|---|---|
| ![Landing](docs/screenshots/landing.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Kanban | Ticket detail |
|---|---|
| ![Kanban](docs/screenshots/kanban.png) | ![Ticket detail](docs/screenshots/ticket-detail.png) |

| Reports | SLA configuration |
|---|---|
| ![Reports](docs/screenshots/reports.png) | ![SLA](docs/screenshots/sla.png) |
```

- [ ] **Step 5: Update the README roadmap checklist**

In `README.md`, replace:
```markdown
- [x] SLA overdue indicator in TicketDetail page
- [ ] Email notifications (nodemailer) for assign/comment events
- [ ] Ticket change-history timeline in TicketDetail
- [ ] Rate limiting on auth endpoints
- [ ] Deploy to Railway
```
with:
```markdown
- [x] SLA overdue indicator in TicketDetail page
- [x] Rate limiting on auth endpoints
- [x] Email notifications (nodemailer, Ethereal) for assign/status/comment events
- [x] Ticket change-history timeline in TicketDetail
- [ ] Deploy to Railway
```

- [ ] **Step 6: Sync CLAUDE.md's status section**

In `CLAUDE.md`, under `### Current implementation status`, move the corresponding lines from the `**Pending**` list into the `**Working**` list — replace:
```markdown
**Pending (next session — finishing the demo):**
- Email notifications (nodemailer) — ticket assign + comment events via SMTP
- Ticket change history timeline in TicketDetail (reuses activity_log data)
- Rate limiting (express-rate-limit) on auth endpoints
- README with screenshots for portfolio
- Landing page polish
```
with:
```markdown
**Pending (next session — finishing the demo):**
- Deploy to Railway
```
and add these lines to the end of the `**Working:**` list (immediately before the `**Pending` heading):
```markdown
- Email notifications: nodemailer + Ethereal (fake SMTP), sent on ticket assign / status change / comment — preview URLs logged to the backend console (no real credentials involved)
- Ticket history timeline: `GET /api/tickets/:id/activity` (reuses `activity_log`), rendered in TicketDetail below the comments thread
- Rate limiting: `express-rate-limit` on `POST /api/auth/login`, trusts Railway's proxy, skips counting successful logins
```

- [ ] **Step 7: Commit**

```bash
git add docs/screenshots README.md CLAUDE.md
git commit -m "docs: add README screenshots, sync roadmap and CLAUDE.md status"
```
