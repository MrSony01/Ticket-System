# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Architecture

### Stack
- **Backend:** Node.js + Express 5.x, ES modules (`"type": "module"`)
- **Frontend:** React 19 + React Router 7 + Vite 8 + Tailwind CSS 3
- **Database:** MariaDB/MySQL via `mysql2/promise` connection pool
- **Auth:** JWT (`jsonwebtoken`) + bcryptjs password hashing

### Backend structure (`backend/`)
```
server.js               # Entry point — loads .env, starts HTTP server on PORT (default 4000)
src/
  app.js                # Express app: CORS, JSON body parsing, mounts routes
  config/db.js          # mysql2 connection pool — import and call pool.query() or pool.execute()
  routes/
    authRoutes.js       # Mounted at /api/auth
    ticketRoutes.js     # Mounted at /api/tickets
  controllers/          # Route handler logic (currently empty scaffolding)
  models/               # DB query functions (currently empty scaffolding)
  middlewares/
    authMiddleware.js   # JWT verification (empty scaffolding)
    roleMiddleware.js   # Role-based access control (empty scaffolding)
```

### Frontend structure (`frontend/src/`)
```
main.jsx    # React root mount
App.jsx     # Root component (still default Vite template — needs routing setup)
index.css   # Tailwind directives only (@tailwind base/components/utilities)
```

### API base URL
Backend runs on `http://localhost:4000`. Routes:
- `GET /` — health check
- `/api/auth` — authentication endpoints
- `/api/tickets` — ticket CRUD endpoints

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

`DB_HOST=db` assumes the Docker service name. Change to `localhost` for local development without Docker.

### Current implementation status
The scaffold is in place but the following are empty and need implementation:
- `database/init.sql` — SQL schema
- `docker-compose.yml` — Docker services (db, backend, frontend)
- All controllers, models, and middleware files
- Frontend components and routing (`App.jsx` is still the default Vite template)
