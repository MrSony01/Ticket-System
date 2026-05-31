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
- **Frontend:** React 19 + React Router 7 + Vite 8 + Tailwind CSS 3
- **Database:** MariaDB/MySQL via `mysql2/promise` connection pool
- **Auth:** JWT (`jsonwebtoken`) + bcryptjs password hashing
- **Infra:** Docker Compose (db + backend + frontend/nginx)
- **Deploy target:** Railway

### Multi-tenancy model
Each company has its own isolated space. Users, tickets and categories are scoped by `company_id`.
- `POST /api/auth/register` — creates company + first user as admin
- `POST /api/auth/login` — requires email + password + company slug
- JWT payload includes `company_id` — all queries filter by it

### Roles
| Role | Permissions |
|---|---|
| `user` | Create tickets, view own tickets, comment |
| `technician` | View assigned tickets, change status, internal notes |
| `admin` | Full access within company, manage users/categories, assign technicians |

### Backend structure (`backend/`)
```
server.js               # Entry point — loads .env, starts HTTP server on PORT (default 4000)
src/
  app.js                # Express app: CORS, JSON body, error handler, mounts routes
  config/db.js          # mysql2 connection pool
  routes/
    authRoutes.js       # Mounted at /api/auth
    ticketRoutes.js     # Mounted at /api/tickets
    categoryRoutes.js   # Mounted at /api/categories
  controllers/
    authController.js
    ticketController.js
    categoryController.js
  models/
    userModel.js
    ticketModel.js
    categoryModel.js
  middlewares/
    authMiddleware.js   # JWT verification + authorize() helper
    roleMiddleware.js   # Re-exports authorize() for semantic clarity
```

### Frontend structure (`frontend/src/`)
```
main.jsx              # React root mount
App.jsx               # Router + AuthProvider + Layout
index.css             # Tailwind directives
api/client.js         # Fetch wrapper — reads token from localStorage, BASE = '/api'
context/AuthContext.jsx
components/
  Navbar.jsx
  ProtectedRoute.jsx
pages/
  Login.jsx
  Register.jsx
  Dashboard.jsx
  CreateTicket.jsx
  TicketDetail.jsx
```

### Design direction
- **Style:** Dark & professional — dark background, vibrant accents, glass morphism, fixed sidebar
- **Identity:** Tech, modern SaaS — not flat corporate

### API base URL
Backend runs on `http://localhost:4000`. Routes:
- `GET /` — health check
- `/api/auth` — authentication endpoints
- `/api/tickets` — ticket CRUD endpoints
- `/api/categories` — category management

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

### Create first admin
Register via the app — all users start as `user`. Promote via SQL:
```sql
UPDATE users SET role='admin' WHERE email='your@email.com';
```

### Current implementation status
**Working (single-tenant):**
- Full Docker setup (db + backend + frontend/nginx)
- Auth: register, login, JWT
- Tickets: CRUD, comments, internal notes, role-based visibility
- Categories: list, create, delete (admin only)

**Pending (next iteration):**
- Migrate to multi-tenant: add `companies` table, `company_id` scope on all models
- Full frontend redesign: AgentX dark identity, fixed sidebar, dashboard metrics
- Admin panel: user management, role assignment within company
