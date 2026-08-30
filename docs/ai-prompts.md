# AI prompts

The prompts used during development, grouped by phase and objective.

## Phase 1 — Project Initialization

### Prompt

```text
PHASE 1 — PROJECT INITIALIZATION

You are helping me build the BUSY Infotech take-home assignment.

FIRST, read and understand:
- README.md
- SUBMISSION.md
- docs/architecture.md
- docs/schema.md
- docs/plan.md
- docs/decisions.md
- docs/ai-prompts.md

Do not start coding until you understand the assignment requirements.

==================================================
IMPORTANT DEVELOPMENT PRINCIPLES
==================================================
... (development principles adhering to simplicity, correctness, and maintainability) ...

==================================================
TECHNOLOGY STACK
==================================================
Frontend: React, Vite, React Router
Backend: Node.js, Express
Database: PostgreSQL
ORM: Prisma
Language: JavaScript

==================================================
PHASE 1 SCOPE
==================================================
This phase is ONLY about project initialization.
Do NOT implement auth, JWT, users/roles, projects, tasks, task dependencies, dashboard, reports, alerts, comments, history, CSV export, bulk actions.

==================================================
PROJECT STRUCTURE
==================================================
busy-task-manager/
├── client/
├── server/
├── prisma/
├── docs/
│   ├── architecture.md
│   ├── schema.md
│   ├── plan.md
│   ├── decisions.md
│   └── ai-prompts.md
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── SUBMISSION.md

==================================================
FRONTEND SETUP
==================================================
Inside client:
- Initialize React using Vite.
- Configure React Router.
- Create a clean basic application structure.
- Create a basic Login page placeholder.
- Create a basic protected application layout placeholder.
- Create a simple Dashboard placeholder.
Do NOT build the final UI yet.
Do NOT add fake business data.
Make sure the frontend can start successfully.

==================================================
BACKEND SETUP
==================================================
Inside server:
Initialize Node.js + Express.
Create server/src/app.js and server/src/server.js.
Implement GET /api/health returning {"status": "ok"}.
Use environment variable for PORT, CORS configuration, JSON body parsing, basic centralized error middleware.

==================================================
ENVIRONMENT CONFIGURATION
==================================================
Create .env.example with PORT=5000, DATABASE_URL=, JWT_SECRET=, JWT_EXPIRES_IN=, CLIENT_URL=.
Ensure .env and node_modules are gitignored.

==================================================
FINAL VERIFICATION
==================================================
Start backend, verify GET /api/health, start frontend, verify React app loads, check console errors, imports, gitignore, and clean structure.
```

### What you got
- Clean project structure with `client/`, `server/`, `prisma/`, `docs/`, `.env.example`, `.gitignore`, `package.json`, `README.md`, `SUBMISSION.md`.
- Express backend initialized with CORS, JSON body parsing, centralized error handling, and `GET /api/health` endpoint.
- React frontend initialized with Vite, React Router, placeholder Login page, AppLayout, and Dashboard page.
- Root scripts for running/building both frontend and backend.
- Updated documentation across `docs/`.

### What you corrected
- Verified that no premature schema or business logic was introduced into Phase 1.
- Ensured `.env` remains strictly ignored in version control.

---

## Phase 2 — Database and Prisma

### Prompt

```text
PHASE 2 — DATABASE AND PRISMA

Phase 1 is complete.

Now implement ONLY the database layer.

Technology:
PostgreSQL + Prisma.

Read the assignment README again, especially Goals 1 through 5 and Goals 9 and 10.

Create a Prisma schema that supports the complete required application.

Entities should cover:
User, Project, ProjectMember, Task, TaskAssignee, TaskDependency, TaskHistory, Comment, AlertDismissal

User: id, name, email unique, passwordHash, role, createdAt, updatedAt
Roles: MANAGER, MEMBER
Project: id, key unique, name, description, owner, archived, timestamps
ProjectMember: many-to-many User ↔ Project
Task: id, project, title, description, priority, status, previousStatus, optional dueDate, creator, timestamps
Priority: LOW, MEDIUM, HIGH, URGENT
Status: BACKLOG, IN_PROGRESS, IN_REVIEW, BLOCKED, DONE
TaskAssignee: many-to-many User ↔ Task
TaskDependency: self-referencing task relationship.
TaskHistory: append-only historical records (task, user, action, field, oldValue, newValue, createdAt)
Comment: task, user, content, createdAt
AlertDismissal: design it so dismissing an overdue alert can become invalid/reappear if task due date changes.

Add sensible: indexes, unique constraints, foreign keys, cascade/restrict behavior.
Create Prisma migrations.
Create prisma/seed.js with realistic demo data.
Do NOT implement REST APIs yet.
Do NOT implement authentication yet.
Do NOT build UI.
Update docs/schema.md and docs/decisions.md.
Verify unique constraints using Prisma/database operations.
```

### What you got
- `prisma/schema.prisma` modeling all 9 required entities, enums (`Role`, `Priority`, `Status`), relations, and indexes.
- Database migration `20260830073054_init` executed against PostgreSQL.
- `prisma/seed.js` creating realistic seed data (2 managers, 4 members, 4 projects [active + archived], tasks with dependencies, history, comments, and alert dismissals).
- Verified unique constraints (`User.email`, `Project.key`, `ProjectMember` composite, `TaskAssignee` composite) and alert invalidation logic via Prisma operations.
- Updated `docs/schema.md`, `docs/decisions.md`, and `docs/plan.md`.

### What you corrected
- Designed `AlertDismissal` with `dismissedDueDate` snapshot so that alerts automatically resurface when a task's due date is changed without requiring mutation hooks or cleanup cron jobs.
- Added `previousStatus` to the `Task` model to support unblocking restoration directly and efficiently.
