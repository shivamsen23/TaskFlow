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
- Supported `previousStatus` and soft delete `deletedAt` on Task
- Created and executed database migrations
- Created realistic seed script (`prisma/seed.js`) populating managers, members, active/archived projects, tasks, dependencies, history, comments, and alerts
- Verified database constraints and alert invalidation logic

### Phase 3: Authentication & Authorization (Completed)
- Implemented `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, and `GET /api/auth/manager-only-test`
- Implemented `authenticate` and `requireManager` server middleware
- Configured secure HttpOnly cookies for JWT session management with CORS credentials
- Created React `AuthContext`, `ProtectedRoute`, and interactive `LoginPage` with demo quick-fill credentials
- Updated `AppLayout` to display current user name, role badge, and sign-out controls
- Created comprehensive backend auth test suite with 100% pass rate

### Phase 4: Core Project & Task Management (Upcoming)
- Project CRUD (manager-only creation/archive) and membership management
- Task lifecycle state machine (`Backlog → In Progress → In Review → Done`, `Blocked` and unblock restoration) and intra-project dependency validation

### Phase 5: Search, Filtering, Bulk Actions & History (Upcoming)
- Server-side task search/filters/pagination
- Bulk updates with individual failure reporting, immutable history/audit trail, CSV export

### Phase 6: Dashboard, Overdue Alerts & Polish (Upcoming)
- Dashboard metrics and charts, overdue alerts with badge and dismissal logic

---

## Build Order Rationale
Phase 1 set up baseline scaffolding, Phase 2 established database persistence, and Phase 3 completed the core security perimeter (Goal 1: Accounts and Roles). This allows subsequent resource endpoints (projects, tasks) to immediately leverage `req.user` and role-based guards.

## Estimates vs Actuals
- **Phase 1 (Initialization & Scaffolding):** Estimated ~0.5h, Actual ~0.5h.
- **Phase 2 (Database Schema & Seed):** Estimated ~1.0h, Actual ~0.75h.
- **Phase 3 (Authentication & Roles):** Estimated ~1.0h, Actual ~0.75h.

## Scope Adjustments
- Kept Phase 3 strictly focused on Goal 1 (Accounts and Roles) without premature implementation of project or task CRUD.
