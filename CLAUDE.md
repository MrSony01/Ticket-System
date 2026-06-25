# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**AgentX** — Multi-tenant SaaS ticket management system. Portfolio project.

## Commands

### Backend (Express API)
```bash
cd backend
npm run dev     # Development with nodemon (auto-restart)
npm start       # Production
```

### Frontend (React + Vite)
```bash
cd frontend
npm run dev     # Vite dev server (default port 5173)
npm run build   # Production build
npm run lint    # ESLint
npm run preview # Preview production build
```

### Docker (full stack)
```bash
docker compose up --build   # First run or after code changes
docker compose up           # Subsequent runs (no rebuild)
docker compose down         # Stop all services
```

## Architecture

### Stack
- **Backend:** Node.js + Express 5.x, ES modules (`"type": "module"`)
- **Frontend:** React 19 + React Router 7 + Vite 8 + Tailwind CSS 3 + Recharts + @dnd-kit
- **Database:** MariaDB/MySQL via `mysql2/promise` connection pool
- **Auth:** JWT (`jsonwebtoken`) + bcryptjs password hashing
- **Infra:** Docker Compose (db + backend + frontend/nginx)
- **Deploy target:** Railway

### Multi-tenancy model
Each company has its own isolated space. Users, tickets and categories are scoped by `company_id`.
- `POST /api/auth/register` — creates company + first user as admin
- `POST /api/auth/login` — requires email + password only (company resolved from email globally)
- JWT payload includes `company_id` — all queries filter by it

### Roles
| Role | Permissions |
|---|---|
| `user` | Create tickets, view own tickets, comment |
| `technician` | View assigned tickets, change status, internal notes |
| `admin` | Full access within company, manage users/groups/categories, assign technicians |

### Backend structure (`backend/`)
```
server.js               # Entry point — loads .env, runs DB migration, starts HTTP server (PORT 4000)
src/
  app.js                # Express app: CORS, JSON body, error handler, mounts routes
  config/db.js          # mysql2 connection pool
  routes/
    authRoutes.js           # Mounted at /api/auth
    ticketRoutes.js         # Mounted at /api/tickets
    categoryRoutes.js       # Mounted at /api/categories
    adminRoutes.js          # Mounted at /api/admin — requires admin role
    notificationRoutes.js   # Mounted at /api/notifications — requires auth
    searchRoutes.js         # Mounted at /api/search — requires auth, role-scoped
  controllers/
    authController.js       # register, login, getMe, updateMe, changePassword, getInvite, acceptInvite
    ticketController.js     # + exportTickets (CSV), activity logging, notifications on assign/status/comment
    categoryController.js
    adminController.js      # users, groups, stats, company settings, invite + activity logging
    reportController.js     # getReports — 6-query aggregated analytics
    activityController.js   # getActivity — paginated audit log
    notificationController.js # getNotifications, getUnreadCount, markRead, markAllRead
    slaController.js        # getSLA, updateSLA — per-priority config
    searchController.js     # globalSearch — tickets + users, role-scoped
  models/
    userModel.js            # findByEmailGlobal() for slug-free login
    ticketModel.js          # findAll() with server-side filtering + LIMIT/OFFSET pagination
    categoryModel.js
    adminModel.js           # user/group CRUD + getCompany() + updateCompanyName()
    groupModel.js           # remove() for group deletion
    activityModel.js        # log() + findAll() — writes to activity_log table
    notificationModel.js    # create, findForUser, markRead, markAllRead, countUnread
    slaModel.js             # findByCompany() with defaults, upsert(), computeOverdue()
  middlewares/
    authMiddleware.js       # JWT verification + authorize() helper
    roleMiddleware.js       # Re-exports authorize() for semantic clarity
```

### Auth API endpoints (`/api/auth`)
```
POST  /register           # Create company + admin user
POST  /login              # Email + password (no slug), returns JWT + user + company
GET   /me                 # Get own profile (requires auth)
PATCH /me                 # Update name / email — email change requires currentPassword
PATCH /me/password        # Change password — requires currentPassword + newPassword (min 6 chars)
GET   /invite/:token      # Get invite details (public)
POST  /invite/:token      # Accept invite — set password, clears invite_token
```

### Admin API endpoints (`/api/admin`)
```
GET    /users              # List all company users (with group info + invite_pending flag)
POST   /users              # Create user (name, email, password, role, group_id)
POST   /users/invite       # Create invite-only user — generates invite_token, no password required
PATCH  /users/:id/role     # Change user role
PATCH  /users/:id/group    # Assign/remove user from group (group_id: null to remove)
DELETE /users/:id          # Delete user

GET    /groups             # List all company groups
POST   /groups             # Create group
DELETE /groups/:id         # Delete group

GET    /stats              # Company stats: users by role, groups count, tickets by status, categories count
GET    /reports            # Analytics: byStatus, byPriority, byCategory, byTechnician, overTime (30d), avgResolutionDays
GET    /activity           # Audit log — paginated, filter by action/entityType
GET    /sla                # SLA config per priority (defaults: critical=2h/8h, high=8h/24h, medium=24h/72h, low=72h/168h)
PATCH  /sla                # Update SLA config for a priority { priority, response_hours, resolution_hours }
GET    /search             # Global search alias (also available at /api/search without admin requirement)
GET    /company            # Get company info (name, slug, member_count, created_at)
PATCH  /company            # Update company name — requires admin currentPassword (bcrypt verified)
```

### Ticket API endpoints (`/api/tickets`)
```
GET    /                   # List tickets — server-side filters: status, priority, categoryId, assignedTo, search
                           # Pagination: page + limit (max 100). Returns { tickets, total, page, pages }
                           # Role-scoped: user→own, technician→assigned, admin→all
GET    /export             # Export filtered tickets as CSV (admin only) — same filters as list
GET    /:id                # Get ticket detail + comments
POST   /                   # Create ticket
PATCH  /:id                # Update ticket (status, priority, assigned_to, category_id) — role-restricted
POST   /:id/comments       # Add comment (is_internal for tech/admin only)
```

### Notification API endpoints (`/api/notifications`)
```
GET    /            # List notifications for current user (query: ?unreadOnly=true)
GET    /unread      # Count of unread notifications { count }
PATCH  /read-all    # Mark all as read
PATCH  /:id/read    # Mark single notification as read
```

### Search API endpoint (`/api/search`)
```
GET    /?q=<term>   # Search tickets + users within company, role-scoped (min 2 chars)
                    # Returns { tickets: [...], users: [...] }
                    # users array is empty for role=user
```

### Frontend structure (`frontend/src/`)
```
main.jsx                  # React root mount
App.jsx                   # Router + AuthProvider + AppLayout wrapper
                          # AppLayout: skip link (#main-content), mobile top bar (hamburger),
                          # mobile overlay backdrop, sidebar open/close state, Escape key handler,
                          # auto-close on route change, <main id="main-content" tabIndex={-1}>
index.css                 # Tailwind directives + scrollbar + dark body (#080810)
api/client.js             # Fetch wrapper — reads token from localStorage, BASE = '/api'
context/
  AuthContext.jsx          # user, company, token, login(), logout(), updateCompany()
components/
  Sidebar.jsx              # Fixed 240px sidebar, mobile: slide-in via translate-x, transition-transform
                          # <aside> + <nav aria-label="Menú principal"> + section labels (PRINCIPAL/ADMINISTRACIÓN)
                          # NotificationBell (aria-label, aria-expanded) + Ctrl+K search trigger (aria-label)
                          # Mobile close button (aria-label="Cerrar menú") + all icons aria-hidden="true"
                          # NavItem: icon aria-hidden, link text always visible (no icon-only)
  ProtectedRoute.jsx
  AdminRoute.jsx
  NotificationBell.jsx     # Bell icon with unread badge, dropdown panel, polls every 30s
                          # aria-label="Notificaciones", aria-expanded, aria-haspopup
  GlobalSearch.jsx         # Ctrl+K command palette — debounced search, keyboard nav (↑↓↵ESC)
pages/
  Landing.jsx              # Public landing page (violet theme)
  Login.jsx                # Centered card — visible labels (htmlFor/id), password toggle (eye icon),
                          # error div role="alert", success banner on ?registered=1
  Register.jsx             # Centered card — visible labels (htmlFor/id), password toggle (eye icon),
                          # error div role="alert", slug preview from company name
  AcceptInvite.jsx         # /invite/:token — set password on first login
  Dashboard.jsx            # Server-side filters + pagination + CSV export button + SLA overdue badges
  CreateTicket.jsx         # Dark theme, priority dot indicator
  TicketDetail.jsx         # Two-column layout: content + metadata panel, technician dropdown
  MyTickets.jsx            # /mis-tickets — tickets assigned to current user, paginated
  Kanban.jsx               # /kanban — drag-and-drop board (4 columns), optimistic updates via @dnd-kit
  UserProfile.jsx          # /perfil — edit name/email + change password, re-issues JWT on save
  AdminPanel.jsx           # /admin — stats (users/groups/categories/tickets) + groups visualization
  AdminUsers.jsx           # /admin/usuarios — user table, invite modal, pending badge, detail modal
  AdminGroups.jsx          # /admin/grupos — expandable groups, member management
  AdminCategories.jsx      # /admin/categorias — CRUD categories
  AdminReports.jsx         # /admin/reportes — Recharts: donut, bar, line, stacked bar charts
  AdminSettings.jsx        # /admin/configuracion — change company name (password-protected)
  AdminActivity.jsx        # /admin/actividad — paginated audit log, filter by action type
  AdminSLA.jsx             # /admin/sla — SLA config per priority, inline edit with validation
```

### Design system
- **Background:** `#080810` (body), `#0e0e16` (sidebar), `#0f0f18` (cards)
- **Accent:** violet-500/600 (`#7c3aed`) — buttons, active states, gradients
- **Text:** zinc-100 (primary), zinc-400 (secondary), zinc-600 (muted)
- **Font:** Plus Jakarta Sans
- **Status colors:** blue=open, amber=in-progress, emerald=resolved, zinc=closed
- **Role colors:** violet=admin, cyan=technician, zinc=user
- **Priority colors:** zinc=low, blue=medium, orange=high, red=critical

### Database schema notes
- `users.invite_token VARCHAR(64)` — set on invite, cleared on accept
- DB indexes: `idx_tickets_company_status`, `idx_tickets_company_created`, `idx_tickets_assigned`, `idx_tickets_category`, `idx_tickets_priority`
- Startup migration in `server.js` — runs on every boot (idempotent), creates:
  - `ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_token`
  - `activity_log (id, company_id, user_id, action, entity_type, entity_id, metadata JSON, created_at)`
  - `notifications (id, user_id, company_id, type, title, message, entity_id, read_at, created_at)`
  - `sla_configs (id, company_id, priority, response_hours, resolution_hours)` — UNIQUE on (company_id, priority)

### Environment variables
Backend reads from `backend/.env`:
```
PORT=4000
DB_HOST=db
DB_PORT=3306
DB_USER=ticketuser
DB_PASSWORD=ticketpass
DB_NAME=ticketdb
JWT_SECRET=supersecretkey123
```

`DB_HOST=db` uses the Docker service name. Change to `localhost` for local dev without Docker.

### Current implementation status

**Working:**
- Full Docker setup (db + backend + frontend/nginx)
- Auth: register, login, invite flow, profile edit, password change
- Tickets: CRUD, comments, internal notes, role-based visibility, technician dropdown assignment
- Dashboard: server-side filtering (status, priority, category, search) + pagination + CSV export + SLA badges
- Kanban: drag-and-drop board with optimistic status updates
- MyTickets: `/mis-tickets` — scoped view for the logged-in user
- Categories: CRUD (admin only)
- Activity logging: auto-logged on ticket create/update/comment, user create/invite/delete/role-change
- Notifications in-app: bell icon + 30s polling, auto-created on ticket assign / status change / comment
- SLA per priority: configurable response + resolution hours, overdue/breach badges in Dashboard
- Global search Ctrl+K: command palette with debounce, keyboard nav, role-scoped results
- CSV export: `GET /api/tickets/export` with same filters as dashboard list
- Admin panel:
  - `/admin` — stats (users, groups, categories, tickets) + groups visualization
  - `/admin/usuarios` — user table, create user, invite via link, detail modal (role/group/delete)
  - `/admin/grupos` — expandable groups with member management
  - `/admin/categorias` — category CRUD
  - `/admin/reportes` — analytics with Recharts (status donut, priority bar, timeline, category bar, technician workload)
  - `/admin/actividad` — paginated audit log, filterable by action type
  - `/admin/sla` — SLA config per priority with inline editing
  - `/admin/configuracion` — change company name (requires password confirmation)
- User profile: `/perfil` — edit name/email + change password, accessible from sidebar user footer
- Accessibility & UX pass:
  - Login + Register: visible `<label htmlFor>` above every field (not placeholder-only), password show/hide toggle (eye icon, `aria-label`), error messages with `role="alert"`
  - All forms across the app: `role="alert"` on error divs (CreateTicket, AdminReports, etc.)
  - Layout: skip-to-content link (`<a href="#main-content" className="sr-only focus:not-sr-only">`), `<main id="main-content" tabIndex={-1}>`
  - Sidebar: `<nav aria-label="Menú principal">`, all icon SVGs `aria-hidden="true"`, nav item text always visible
  - NotificationBell: `aria-label="Notificaciones"`, `aria-expanded`, `aria-haspopup`
  - Search trigger: `aria-label="Abrir búsqueda global"`
  - Mobile responsive sidebar: slide-in drawer via `transition-transform translate-x`, backdrop overlay (`bg-black/60`), hamburger toggle in mobile top bar (`aria-label="Abrir menú de navegación"`), close button inside sidebar (`aria-label="Cerrar menú"`), auto-close on route change and Escape key

**Pending (next session):**
- Email notifications (nodemailer) — ticket assign + comment events via SMTP
- SLA overdue indicator in TicketDetail page
- Ticket change history timeline in TicketDetail (reuses activity_log data)
- Rate limiting (express-rate-limit) on auth endpoints
- README with screenshots for portfolio
- Landing page polish
