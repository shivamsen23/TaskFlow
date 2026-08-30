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
- Database migration `20260830073054_init` and correction `20260830081701_schema_corrections` executed against PostgreSQL.
- `prisma/seed.js` creating realistic seed data (2 managers, 4 members, 4 projects [active + archived], tasks with dependencies, history, comments, and alert dismissals).
- Verified unique constraints (`User.email`, `Project.key`, `ProjectMember` composite, `TaskAssignee` composite) and alert invalidation logic via Prisma operations.
- Updated `docs/schema.md`, `docs/decisions.md`, and `docs/plan.md`.

### What you corrected
- Designed `AlertDismissal` with `dismissedDueDate` snapshot so that alerts automatically resurface when a task's due date is changed without requiring mutation hooks or cleanup cron jobs.
- Added `previousStatus` to the `Task` model to support unblocking restoration directly and efficiently.
- Refined schema with `deletedAt` for task soft deletion, `Restrict` on immutable history/comments, and added `updatedAt` index on `Task`.

---

## Phase 3 — Authentication and Role Authorization

### Prompt

```text
PHASE 3 — AUTHENTICATION AND ROLE AUTHORIZATION

Implement ONLY Goal 1: Accounts and Roles.

Requirements:
- Login using email/password.
- Passwords stored only as bcrypt/bcryptjs hashes.
- Never store plaintext passwords.
- Use JWT authentication.
- Implement GET /api/auth/me.
- Implement authentication middleware.
- Implement manager authorization middleware.
- Return proper 401 Unauthorized and 403 Forbidden responses.
- Enforce authorization on the SERVER, not only in React.

Roles:
- MANAGER
- MEMBER

Create clean modules:
server/src/modules/auth/
server/src/modules/users/

Controllers must remain thin; business logic in services.
Authentication: prefer HttpOnly cookie for JWT, configure CORS with credentials, no JWT in localStorage.

Frontend:
- Implement Login page.
- Implement AuthContext.
- Implement protected routing.
- Show current user's name and role.
- Handle login/logout and authenticated API requests.

Add backend tests for:
1. valid login
2. invalid password
3. missing authentication
4. member blocked from a manager-only endpoint
5. manager allowed through a manager-only endpoint

Update documentation: architecture.md, decisions.md, ai-prompts.md, plan.md.
```

### What you got
- Backend authentication module (`server/src/modules/auth/`) with `auth.routes.js`, `auth.controller.js`, `auth.service.js`.
- Users module (`server/src/modules/users/`) with `users.routes.js`, `users.controller.js`, `users.service.js`.
- Server middleware (`server/src/middleware/auth.middleware.js`) implementing `authenticate` (reads HttpOnly cookies or Bearer tokens) and `requireManager` (checks `req.user.role === 'MANAGER'`).
- Secured session handling with `HttpOnly`, `SameSite: Lax` cookies and CORS credentials.
- React `AuthContext`, `ProtectedRoute`, interactive `LoginPage` with demo quick-fill buttons, and role-badged `AppLayout`.
- Comprehensive backend test suite (`server/src/tests/auth.test.js`) verifying 7 critical authentication/authorization scenarios with 100% pass rate.
- Updated documentation in `docs/` and credentials in `SUBMISSION.md`.

### What you corrected
- Configured Express centralized error middleware to selectively log 500 errors to prevent expected 401 invalid-login attempts from polluting console logs.
- Configured dynamic require for Prisma client in server to ensure cross-module compatibility.

---

## Phase 4 — Projects and Project Membership

### Prompt

```text
PHASE 4 — PROJECTS AND PROJECT MEMBERSHIP

Implement ONLY Goal 2 and the project-membership part needed for Goal 5.

Managers can:
- create project
- edit project
- archive project
- restore project
- set project owner
- add members
- remove members

Members:
- can only see projects they belong to
- cannot create projects
- cannot archive/restore projects
- cannot manage project membership

Important:
Archiving must NOT delete the project or tasks.
Archived projects should simply disappear from default active project views.

When removing a member from a project:
- remove the user from that project's tasks
- create appropriate assignment history records
- execute within an atomic transaction

Backend: projects controller, projects service, projects routes.
Frontend: Projects page, Project Details page, Create/Edit Project modal, Member management UI following docs/ui-reference.png.

Add tests for:
- manager creates project
- member cannot create project (403)
- member only sees projects they belong to
- member blocked from viewing non-member project (403)
- manager can archive project
- archived project remains in DB and disappears from active list
- manager can restore project
- removing project member unassigns them from project tasks and logs history
```

### What you got
- Projects module (`server/src/modules/projects/`) with `projects.routes.js`, `projects.controller.js`, `projects.service.js`.
- Server-side project isolation and role authorization: Members only query/view projects they belong to; Managers can query all and access privileged CRUD/archival endpoints.
- Atomic member removal logic in `prisma.$transaction`: deletes membership, unassigns active project tasks from `TaskAssignee`, and appends `TaskHistory` unassignment audit records.
- React frontend components (`ProjectsPage`, `ProjectDetailsPage`, `ProjectModal`, `AddMemberModal`, updated `AppLayout`) styled per `docs/ui-reference.png`.
- Automated test suite (`server/src/tests/projects.test.js`) passing 8 comprehensive test cases.

### What you corrected
- Protected project owners from accidental self-removal from their own projects unless ownership is explicitly transferred.
- Ensured default project list query cleanly filters out archived projects while allowing managers to filter and restore archived projects with a single click.
