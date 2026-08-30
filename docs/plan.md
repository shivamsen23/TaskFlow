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

### Phase 5: Tasks, Assignments & Dependencies (Completed)
- Implemented `POST /api/tasks`, `GET /api/tasks`, `GET /api/tasks/:id`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`
- Enforced project member assignment constraint (server rejects non-member assignments with 400)
- Enforced intra-project dependency rule (server rejects cross-project blocking dependencies with 400)
- Enforced manager-only task deletion with soft delete (`deletedAt`) and `TaskHistory` audit entry
- Implemented atomic assignee change tracking with `ASSIGNED` and `UNASSIGNED` `TaskHistory` entries
- Created React `TasksPage`, `TaskDetailsPage`, `TaskModal`, and updated `ProjectDetailsPage` with real task tables
- Added comprehensive automated backend test suite with 100% pass rate

### Phase 6: Task Lifecycle & Dependency Business Rules (Completed)
- Created dedicated `task-rules.service.js` enforcing lifecycle transitions (`BACKLOG → IN_PROGRESS → IN_REVIEW → DONE`)
- Implemented blocking transition from `IN_PROGRESS` and `IN_REVIEW` to `BLOCKED`, persisting exact `previousStatus`
- Implemented unblocking restoration to exact `previousStatus`
- Implemented server-side dependency completion validation before allowing transition to `DONE`
- Implemented task reopening from `DONE` back to active work
- Updated frontend `TaskDetailsPage` and `TaskModal` to display only legal workflow actions with error alert banners
- Added comprehensive automated test suite with 100% pass rate

### Phase 7: Server-Side Task Search, Filtering, Sorting & Pagination (Completed)
- Extended `GET /api/tasks` with parameterized Prisma queries (`search`, `project`, `status`, `assignee`, `priority`, `overdue`, `sortBy`, `sortOrder`, `page`, `limit`)
- Implemented server-side text search over titles and descriptions with `mode: 'insensitive'`
- Built server-side pagination returning `{ data, pagination: { page, limit, total, totalPages } }`
- Maintained strict member project visibility authorization in PostgreSQL queries
- Updated `TasksPage` UI with server-queried filters, search form, sorting dropdowns, and pagination controls
- Added comprehensive automated test suite (`server/src/tests/search-filter.test.js`) with 10 passed tests (46 total backend tests passing)

### Phase 8: Bulk Actions, Reports & CSV Export (Upcoming)
- Multi-task selection and atomic batch mutations with per-task error reporting
- Filtered CSV dataset export
- Comment thread authoring on task details

### Phase 9: Dashboard, Overdue Alerts & Final Polish (Upcoming)
- Dashboard KPI headline metrics, completion charts, and breakdown tables
- Overdue alerts area with navbar counter badge and dynamic invalidation

---

## Build Order Rationale
Phase 1 established scaffolding, Phase 2 established persistence, Phase 3 secured authentication, Phase 4 established project boundaries, Phase 5 implemented task CRUD/assignment, Phase 6 completed strict lifecycle state machine rules, and Phase 7 built high-performance server-side search, filtering, and pagination.

## Estimates vs Actuals
- **Phase 1 (Initialization & Scaffolding):** Estimated ~0.5h, Actual ~0.5h.
- **Phase 2 (Database Schema & Seed):** Estimated ~1.0h, Actual ~0.75h.
- **Phase 3 (Authentication & Roles):** Estimated ~1.0h, Actual ~0.75h.
- **Phase 4 (Projects & Membership):** Estimated ~1.5h, Actual ~1.0h.
- **Phase 5 (Tasks & Assignments):** Estimated ~1.5h, Actual ~1.0h.
- **Phase 6 (Lifecycle & Rules):** Estimated ~1.0h, Actual ~0.75h.
- **Phase 7 (Search, Filter, Pagination):** Estimated ~1.0h, Actual ~0.75h.
