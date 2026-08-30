# Plan

## Work Breakdown & Sessions

The work is planned across incremental, verifiable phases:

### Phase 1: Project Initialization (Completed)
- Environment configuration (`.env.example`, `.gitignore`)
- Backend setup (Node.js, Express, `/api/health`, CORS, JSON body parser, centralized error handler)
- Frontend setup (React + Vite, React Router, basic layout, placeholder routes)
- Base directory structure and package configurations

### Phase 2: Database Schema & Migrations (Completed)
- Designed full PostgreSQL relational schema covering User, Project, ProjectMember, Task, TaskAssignee, TaskDependency, TaskHistory, Comment, and AlertDismissal
- Configured Prisma models, enums (`Role`, `Priority`, `Status`), indexes, unique constraints, and foreign key cascades
- Supported `previousStatus` on Task for state machine restoration
- Created and executed initial database migration (`20260830073054_init`)
- Created realistic seed script (`prisma/seed.js`) populating managers, members, active/archived projects, tasks, dependencies, history, comments, and alerts
- Verified database constraints and alert invalidation logic

### Phase 3: Authentication & Authorization (Upcoming)
- JWT-based authentication, password hashing with bcrypt
- Role-based authorization middleware (Manager vs Member)

### Phase 4: Core Project & Task Management (Upcoming)
- Project CRUD and membership management
- Task lifecycle state machine and dependency validation

### Phase 5: Search, Filtering, Bulk Actions & History (Upcoming)
- Server-side task search/filters/pagination
- Bulk updates with individual failure reporting, immutable history/audit trail, CSV export

### Phase 6: Dashboard, Overdue Alerts & Polish (Upcoming)
- Dashboard metrics and charts, overdue alerts with badge and dismissal logic

---

## Build Order Rationale
Phase 1 set up the baseline infrastructure. Phase 2 established the complete, normalized PostgreSQL schema with Prisma so all subsequent phases (Auth, Projects, Tasks, Lifecycle, History, Alerts) build directly upon verified, type-safe database models without rework.

## Estimates vs Actuals
- **Phase 1 (Initialization & Scaffolding):** Estimated ~0.5h, Actual ~0.5h.
- **Phase 2 (Database Schema & Seed):** Estimated ~1.0h, Actual ~0.75h.

## Scope Adjustments
- Strictly limited Phase 2 to database modeling, migrations, seed data, and constraint verification without premature API or UI logic.
