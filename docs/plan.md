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

### Phase 4: Core Project & Project Membership Management (Completed)
- Implemented `GET /api/projects`, `GET /api/projects/:id`, `POST /api/projects`, `PUT /api/projects/:id`, `PATCH /api/projects/:id/archive`, `PATCH /api/projects/:id/restore`, `POST /api/projects/:id/members`, `DELETE /api/projects/:id/members/:userId`
- Enforced project isolation: Members only receive projects they belong to; 403 on non-member access
- Enforced manager-only project creation, archival, restoration, and team membership management
- Implemented atomic transactional unassignment and `TaskHistory` generation on project member removal
- Created React `ProjectsPage`, `ProjectDetailsPage`, `ProjectModal`, and `AddMemberModal` styled per `docs/ui-reference.png`
- Added comprehensive automated backend test suite with 100% pass rate

### Phase 5: Tasks, Lifecycle State Machine & Dependencies (Upcoming)
- Task CRUD within projects (title, description, priority, due date, assignees, dependencies)
- Task lifecycle state machine (`Backlog → In Progress → In Review → Done`, `Blocked` from `In Progress`/`In Review`, and returning to `previousStatus` on unblock)
- Server-side dependency validation (intra-project constraint, blocking tasks must be `DONE` before dependent moves to `DONE`)

### Phase 6: Search, Filtering, Bulk Actions, History & Comments (Upcoming)
- Cross-project task search/filtering/sorting/pagination
- Multi-task bulk operations with individual per-task success/failure reporting
- Immutable timeline history and comment posting
- CSV export of filtered task lists

### Phase 7: Dashboard, Overdue Alerts & Polish (Upcoming)
- Dashboard KPI cards, completion trends, and status breakdowns
- Overdue alerts with navbar badge count and due-date invalidation logic

---

## Build Order Rationale
Phase 1 established scaffolding, Phase 2 established persistence, Phase 3 secured authentication, and Phase 4 implemented project workspaces and team membership. This provides the project boundary and membership foundation necessary to implement task management, lifecycle transitions, and assignment rules in Phase 5.

## Estimates vs Actuals
- **Phase 1 (Initialization & Scaffolding):** Estimated ~0.5h, Actual ~0.5h.
- **Phase 2 (Database Schema & Seed):** Estimated ~1.0h, Actual ~0.75h.
- **Phase 3 (Authentication & Roles):** Estimated ~1.0h, Actual ~0.75h.
- **Phase 4 (Projects & Membership):** Estimated ~1.5h, Actual ~1.0h.

## Scope Adjustments
- Strictly focused Phase 4 on Goal 2 (Projects) and the project-membership aspect of Goal 5 (task unassignment on removal) without implementing full task CRUD yet.
