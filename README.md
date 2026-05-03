
# TaskFlow — Team Task Manager

A full-stack team task manager with role-based access (Admin / Member), built from a Figma/Claude Design prototype.

**Stack:** React 18 + TypeScript (Vite) · Express · PostgreSQL · Prisma · JWT auth · deployed on Railway.

---

## Features

- **Auth** — Signup / login with email + password, role selection (Admin / Member), bcrypt-hashed passwords, JWT sessions.
- **Dashboard** — Stat cards (total / completed / in-progress / overdue), 7-day completion bar chart, donut breakdown, attention list, live activity feed.
- **Projects** — Grid + list view, filters (Active / Paused), CRUD with multi-member assignment, per-card progress.
- **Tasks** — Kanban board (To Do / In Progress / Done) with HTML5 drag-and-drop, search + priority filters, task drawer with quick status, details panel, comments thread.
- **Team** (admin-only) — Member table with role toggle, add/remove members, invite flow that returns a temp password.
- **Role-based access control**
  - Admins: full CRUD on projects, tasks, comments, and team.
  - Members: read all tasks but only edit / drag / comment on tasks assigned to them; locked out of `/team` and project mutations.
- **System polish** — Loading skeletons, error states, empty states, toast notifications, full-stack validation (Zod on the API, browser validation on forms).

---

## Local development

### Prerequisites

- Node.js ≥ 20
- A running Postgres database (local Docker, or Railway / Supabase / Neon)

### Setup

```bash
# 1. install dependencies for both workspaces
npm run install:all

# 2. configure server env
cp server/.env.example server/.env
# edit server/.env — set DATABASE_URL and a strong JWT_SECRET

# 3. apply schema and seed demo data
cd server
npx prisma migrate dev --name init
npm run seed
cd ..

# 4. run both client + server
npm run dev
# server: http://localhost:3000
# client: http://localhost:5173 (proxies /api/* → :3000)
```

### Demo accounts (after seeding)

All seeded users share the password **`Password123!`**.

| Email                   | Role    |
| ----------------------- | ------- |
| `maya@taskflow.app`     | admin   |
| `priya@taskflow.app`    | admin   |
| `devon@taskflow.app`    | member  |
| `aisha@taskflow.app`    | member  |
| `jonas@taskflow.app`    | member  |
| `theo@taskflow.app`     | member  |
| `lina@taskflow.app`     | member  |

---

## Project layout

```
.
├── client/                  Vite + React + TS frontend
│   ├── src/
│   │   ├── pages/           Auth, Dashboard, Projects, Tasks, Team
│   │   ├── components/      Shell (sidebar/topbar), Icons, Toast, ConfirmModal, PriorityBadge
│   │   ├── lib/             api client, AuthContext, formatting helpers
│   │   ├── styles.css       design system (verbatim from prototype)
│   │   └── App.tsx          shell + routing
│   └── vite.config.ts       dev proxy → :3000
├── server/                  Express + Prisma backend
│   ├── prisma/
│   │   ├── schema.prisma    User, Project, ProjectMember, Task, Comment, Activity
│   │   ├── seed.js          demo data
│   │   └── seed-once.js     idempotent seed for first deploy
│   └── src/
│       ├── index.js         entry, mounts /api/* and serves client/dist in prod
│       ├── auth.js          JWT signing + auth middleware + requireAdmin
│       ├── routes/          auth, users, projects, tasks, dashboard
│       └── util.js          shape helpers, activity logger
├── nixpacks.toml            Railway build/start steps
└── railway.json             healthcheck + restart policy
```

---

## API surface

All `/api/*` except `/api/auth/*` and `/api/health` require `Authorization: Bearer <jwt>`.

| Method | Path                          | Auth   | Notes                                |
| ------ | ----------------------------- | ------ | ------------------------------------ |
| GET    | `/api/health`                 | —      | liveness                             |
| POST   | `/api/auth/signup`            | —      | `{ name, email, password, role }`    |
| POST   | `/api/auth/login`             | —      | `{ email, password }` → `{ token, user }` |
| GET    | `/api/auth/me`                | user   | current user                         |
| GET    | `/api/users`                  | user   | list workspace users                 |
| POST   | `/api/users`                  | admin  | invite (returns temp password)       |
| PATCH  | `/api/users/:id`              | admin  | rename / change role / change title  |
| DELETE | `/api/users/:id`              | admin  | remove from workspace                |
| GET    | `/api/projects`               | user   | with members + task counts           |
| POST   | `/api/projects`               | admin  | create                               |
| PATCH  | `/api/projects/:id`           | admin  | update + replace members             |
| DELETE | `/api/projects/:id`           | admin  | cascade-deletes tasks                |
| GET    | `/api/tasks?project=…`        | user   | list                                 |
| POST   | `/api/tasks`                  | user   | members may only assign to self      |
| PATCH  | `/api/tasks/:id`              | owner  | members can only edit assigned tasks |
| DELETE | `/api/tasks/:id`              | admin  |                                      |
| GET    | `/api/tasks/:id/comments`     | user   |                                      |
| POST   | `/api/tasks/:id/comments`     | user   | `{ body }`                           |
| GET    | `/api/dashboard/stats`        | user   | scoped to user for members           |
| GET    | `/api/dashboard/activity`     | user   | recent activity feed                 |
| GET    | `/api/dashboard/weekly`       | user   | bar-chart data                       |

Validation is enforced server-side via Zod schemas; failures return `400` with `{ error, details }`.

---

## Deploying to Railway

1. **Push this repo to GitHub.**
2. In Railway, **New Project → Deploy from GitHub** and pick this repo.
3. Add a **PostgreSQL** plugin to the project. Railway auto-injects `DATABASE_URL`.
4. Add the following service variables:
   - `JWT_SECRET` — long random string (generate with `openssl rand -hex 32`)
   - `NODE_ENV` — `production`
5. Deploy. The Nixpacks config will:
   - install both workspaces
   - run `prisma generate` and `vite build`
   - on start: `prisma migrate deploy` → `seed-once` → boot Express
6. Open the public URL — the React app is served by Express at `/`, the API at `/api/*`.

The seed script is idempotent (`seed-once` only seeds an empty database), so subsequent deploys don't clobber data.

### Manual one-shot reseed

```bash
railway run npm --prefix server run seed
```

---

## Submission checklist

- [x] Live URL — set after Railway deploy
- [x] GitHub repo — push this directory
- [x] README — this file
- [ ] 2–5 min demo video — record after deploy (signup → admin flow → member flow → drag-drop on Kanban → comments → team management)

---

## Acknowledgements

- Visual design originated as a Claude Design prototype (HTML/CSS/JS); the design system (`client/src/styles.css`) and component shapes are a faithful port. Behavioral logic is rebuilt against a real backend.
