# AgentX

Multi-tenant SaaS ticket management system. Portfolio project built with React, Node.js, MariaDB and Docker.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + Tailwind CSS 3 + React Router 7 + Recharts + @dnd-kit |
| Backend | Node.js + Express 5 (ES Modules) |
| Database | MariaDB/MySQL via mysql2/promise |
| Auth | JWT + bcryptjs |
| Infra | Docker Compose |
| Deploy | Railway |

## Features

- **Multi-tenant** — each company has its own isolated space, all data scoped by `company_id`
- **Role-based access** — user / technician / admin
- **Ticket lifecycle** — open → in progress → resolved → closed
- **Kanban board** — drag-and-drop status updates with optimistic UI
- **Dashboard** — server-side filtering, pagination, CSV export, SLA overdue badges
- **Internal notes** — visible only to technicians and admins
- **Category management** — admin-controlled CRUD
- **Invite flow** — invite users by link, set password on first login
- **Notifications** — in-app bell icon with polling, triggered on assign/status/comment
- **SLA configuration** — response/resolution hours per priority, overdue/breach badges
- **Global search** — Ctrl+K command palette, role-scoped results across tickets and users
- **Activity log** — paginated audit trail of ticket and user actions
- **Reports & analytics** — status/priority/category/technician breakdowns, resolution time, timeline charts
- **Accessibility pass** — visible labels, `aria-*` attributes, skip-to-content link, keyboard navigation
- **Responsive UI** — mobile sidebar drawer, dark SaaS theme

## Roles

| Role | Access |
|---|---|
| `user` | Create tickets, view own, comment |
| `technician` | View assigned tickets, change status, internal notes |
| `admin` | Full company access, manage users, groups, categories, SLA, assignments |

## Getting Started

### Requirements
- Docker Desktop

### Run
```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

### First admin
Registering from the app (`/register`) creates a new company and its first user as **admin** automatically — no manual SQL needed.

## Project Structure

```
ticket-system/
├── backend/
│   ├── src/
│   │   ├── config/       # DB connection pool
│   │   ├── controllers/  # Route handlers (auth, tickets, categories, admin, reports, activity, notifications, sla, search)
│   │   ├── middlewares/  # JWT auth + role authorization
│   │   ├── models/       # DB query functions
│   │   └── routes/       # Express routers
│   ├── server.js         # Entry point, runs idempotent DB migration on boot
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/          # Fetch wrapper
│   │   ├── components/   # Sidebar, NotificationBell, GlobalSearch, ProtectedRoute, AdminRoute
│   │   ├── context/      # AuthContext
│   │   └── pages/        # Landing, Login, Register, Dashboard, Kanban, MyTickets, TicketDetail,
│   │                     # UserProfile, AdminPanel + Users/Groups/Categories/Reports/Activity/SLA/Settings
│   ├── index.html
│   └── Dockerfile
├── database/
│   └── init.sql          # Schema + seed categories
└── docker-compose.yml
```

## Roadmap

- [x] Docker setup (db + backend + frontend/nginx)
- [x] Auth (register, login, JWT, invite flow, profile edit)
- [x] Ticket CRUD with role-based visibility
- [x] Comments + internal notes
- [x] Category management
- [x] Multi-tenant: companies + company_id scope
- [x] AgentX UI redesign: dark theme, sidebar, dashboard metrics
- [x] Admin panel: user/group management, role assignment
- [x] Kanban board, activity log, notifications, SLA, global search, CSV export
- [x] Accessibility pass (labels, aria attributes, keyboard nav, mobile sidebar)
- [x] SLA overdue indicator in TicketDetail page
- [ ] Email notifications (nodemailer) for assign/comment events
- [ ] Ticket change-history timeline in TicketDetail
- [ ] Rate limiting on auth endpoints
- [ ] Deploy to Railway

## Future roadmap (beyond the demo)

Ideas for if this ever goes beyond a portfolio piece into a real (even free) launch:

- [ ] File attachments on tickets (no upload capability exists yet)
- [ ] Rotate secrets (`JWT_SECRET`) out of committed config before any public deploy
- [ ] Automated database backups
- [ ] Error tracking / monitoring (e.g. Sentry)
- [ ] Privacy policy, terms of service, account/company deletion flow
- [ ] Canned responses / reply templates for technicians
- [ ] CSAT survey on ticket close
- [ ] Per-company branding (logo/color)
- [ ] Webhooks / integrations (Slack, Teams), email-to-ticket ingestion
