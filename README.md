# AgentX

Multi-tenant SaaS ticket management system. Portfolio project built with React, Node.js, MariaDB and Docker.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + Tailwind CSS 3 + React Router 7 |
| Backend | Node.js + Express 5 (ES Modules) |
| Database | MariaDB 11 via mysql2/promise |
| Auth | JWT + bcryptjs |
| Infra | Docker Compose |
| Deploy | Railway (planned) |

## Features

- **Multi-tenant** — each company has its own isolated space
- **Role-based access** — user / technician / admin
- **Ticket lifecycle** — open → in progress → resolved → closed
- **Internal notes** — visible only to technicians and admins
- **Category management** — admin-controlled
- **Dark UI** — professional SaaS design

## Roles

| Role | Access |
|---|---|
| `user` | Create tickets, view own, comment |
| `technician` | View assigned tickets, change status, internal notes |
| `admin` | Full company access, manage users, categories, assignments |

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
Register from the app — users start with `user` role. Promote to admin via SQL:
```sql
UPDATE users SET role='admin' WHERE email='your@email.com';
```

## Project Structure

```
ticket-system/
├── backend/
│   ├── src/
│   │   ├── config/       # DB connection pool
│   │   ├── controllers/  # Route handlers
│   │   ├── middlewares/  # JWT auth + role authorization
│   │   ├── models/       # DB query functions
│   │   └── routes/       # Express routers
│   ├── server.js
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/          # Fetch wrapper
│   │   ├── components/   # Navbar, ProtectedRoute
│   │   ├── context/      # AuthContext
│   │   └── pages/        # Login, Register, Dashboard, CreateTicket, TicketDetail
│   ├── index.html
│   └── Dockerfile
├── database/
│   └── init.sql          # Schema + seed categories
└── docker-compose.yml
```

## Roadmap

- [x] Docker setup (db + backend + frontend/nginx)
- [x] Auth (register, login, JWT)
- [x] Ticket CRUD with role-based visibility
- [x] Comments + internal notes
- [x] Category management
- [ ] Multi-tenant: companies + company_id scope
- [ ] AgentX UI redesign: dark theme, sidebar, dashboard metrics
- [ ] Admin panel: user management, role assignment
- [ ] Deploy to Railway
