# TaskFlow

TaskFlow is a web-based task and project tracking application for managing client engagements, tracking team workload, and coordinating project deliverables.

It provides role-based project access, structured task lifecycles with blocking dependencies, server-side search and filtering, activity history, and real-time dashboard analytics.

---

## Features

- **Login and User Roles:** Secure authentication with distinct permissions for managers and team members.
- **Project Management:** Create, edit, and archive client projects without losing underlying task data.
- **Task Management:** Full task creation, editing, prioritization, due dates, and soft deletion.
- **Task Assignments:** Assign multiple project members to tasks and track workload per person.
- **Task Dependencies & Workflow:** Strict status progression with automatic enforcement of blocking dependencies.
- **Search, Filters, Sorting & Pagination:** Server-side queries across projects, statuses, priorities, assignees, and overdue work.
- **Bulk Actions & CSV Export:** Multi-task status/assignee/due-date updates with per-item error reporting, plus filtered CSV downloads.
- **Task History & Comments:** Append-only activity timeline tracking all field changes, assignments, and team comments.
- **Dashboard:** Portfolio overview with headline metrics, status distributions, assignee workloads, and completion trends.
- **Overdue Alerts:** Automated overdue task detection with assignment-based dismissals that reactivate if due dates change.

---

## Tech Stack

- **Frontend:** React, Vite, React Router, Recharts
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (hosted on Supabase)
- **ORM:** Prisma
- **Authentication:** JWT stored in secure `HttpOnly` cookies
- **Deployment:** Vercel (Frontend) + Render (Backend) + Supabase (Database)

---

## How It Works

```text
Browser / React Frontend
          ↓
     Vercel SPA
          ↓
  Express REST API (Render)
          ↓
      Prisma ORM
          ↓
 PostgreSQL (Supabase)
```

1. **Frontend:** React SPA handles user interactions, protected routing, and dashboard visualizations.
2. **API Layer:** Express handles REST endpoints, verifies JWT cookies, and executes server-side business rules.
3. **Database Layer:** Prisma communicates with PostgreSQL to run type-safe queries, handle migrations, and maintain relational constraints.

---

## User Roles

- **MANAGER:** Full administrative control. Can create, edit, and archive projects, manage project members, assign tasks, delete tasks, and view the entire company portfolio.
- **MEMBER:** Scoped access. Can view only the projects they belong to, update statuses on tasks assigned to them, participate in discussions, and dismiss their own overdue alerts.

---

## Main Task Workflow

```text
BACKLOG ───> IN_PROGRESS ───> IN_REVIEW ───> DONE
                 │                 │
                 └───> BLOCKED <───┘
```

- Tasks move sequentially through `BACKLOG → IN_PROGRESS → IN_REVIEW → DONE`.
- Tasks in `IN_PROGRESS` or `IN_REVIEW` can be moved to `BLOCKED`. Unblocking restores the task to its exact previous state.
- **Dependency Rule:** A task cannot be marked as `DONE` while any of its blocking task dependencies remain unfinished. The backend validates this rule on every status change.

---

## Live Demo

- **Frontend Application:** https://task-flow-sigma-drab.vercel.app/
- **Backend API:** https://taskflow-pw0i.onrender.com/
- **Health Check:** https://taskflow-pw0i.onrender.com/api/health

---

## Demo Login

All demo accounts use the password: `Password123!`

| Role | Name | Email | Password | Access |
|---|---|---|---|---|
| MANAGER | Shivam Sen | `shivam.sen@busyinfotech.com` | `Password123!` | All Projects |
| MANAGER | Rahul Sharma | `rahul.sharma@busyinfotech.com` | `Password123!` | All Projects (Nexus Owner) |
| MEMBER | Elena Rostova | `elena.rostova@busyinfotech.com` | `Password123!` | Apollo & Titan |
| MEMBER | Arjun Mehta | `arjun.mehta@busyinfotech.com` | `Password123!` | Nexus |
| MEMBER | Priya Patel | `priya.patel@busyinfotech.com` | `Password123!` | Nexus & Titan |
| MEMBER | Marcus Johnson | `marcus.johnson@busyinfotech.com` | `Password123!` | Apollo |

*(Quick-fill demo buttons are also available directly on the login screen.)*

---

## Running Locally

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL database (local or cloud instance like Supabase)

### 2. Installation
Clone the repository and install all dependencies:
```bash
npm run install:all
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
```

### 4. Database Setup & Seed
Generate the Prisma client, run migrations, and populate demo data:
```bash
npm run db:generate
npm run db:migrate
npm run seed
```

### 5. Start Development Servers
Run the backend and frontend concurrently:
```bash
# Terminal 1: Backend (http://localhost:5000)
npm run dev:server

# Terminal 2: Frontend (http://localhost:5173)
npm run dev:client
```

---

## Project Structure

```text
TaskFlow/
├── client/          # React + Vite frontend SPA (pages, components, context, styles)
├── server/          # Node.js + Express backend (routes, controllers, services, middleware)
├── prisma/          # Database schema (schema.prisma), migrations, and seed script
└── docs/            # Architecture, technical decisions, plan, schema, and AI logs
```

- **`client/`**: React application built with Vite, React Router, and Recharts.
- **`server/`**: Modular REST API with centralized error handling and JWT cookie authentication.
- **`prisma/`**: Prisma database schema definitions, migrations, and realistic seed data.
- **`docs/`**: Comprehensive project documentation for developers and reviewers.

---

## Testing

- **Backend Test Suite:**
  ```bash
  cd server && npm test
  ```
  Runs all 8 backend test suites (Auth, Projects, Tasks, Lifecycle, Search/Filter, Bulk/CSV, History/Comments, Dashboard/Alerts).

- **Frontend Production Build:**
  ```bash
  cd client && npm run build
  ```
  Verifies that all client modules build cleanly with Vite.

---

## Deployment

- **Frontend:** Hosted on **Vercel** with `/api` rewrites proxying requests to the backend.
- **Backend:** Hosted on **Render** as a Node.js web service.
- **Database:** Hosted on **Supabase** (PostgreSQL).

> **Note:** Render's free tier spins down web services after periods of inactivity. The first request after idle time may take 30–60 seconds while the server wakes up.

---

## Documentation

For more in-depth technical details, see:
- [Architecture](docs/architecture.md) — High-level diagrams, request flows, and module explanations.
- [Schema](docs/schema.md) — Database models, relationships, and rule definitions.
- [Decisions](docs/decisions.md) — Key technical and architectural decisions.
- [Plan](docs/plan.md) — Development phases and timeline.
- [AI Prompts](docs/ai-prompts.md) — Development prompt log.
- [Submission](SUBMISSION.md) — Assignment submission checklist, credentials, and reflections.
