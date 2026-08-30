# Architecture

## Current Moving Pieces (Complete System: Phases 1–10)

1. **Client (Single-Page Application)**
   - Built with React, bundled via Vite, and styled cleanly adhering to `docs/ui-reference.png`.
   - `AuthContext` provides global session state (`user`, `isManager`, `login`, `logout`) backed by HttpOnly cookie sessions.
   - `ProtectedRoute` guards all authenticated views.
   - **Dashboard View (`DashboardPage`)**: Recharts-powered responsive charts (8-Week Throughput Area Chart, Status Breakdown Bar Chart, Team Assignee Workload Chart), 4 KPI summary cards, and quick-access critical overdue list.
   - **Projects Views (`ProjectsPage`, `ProjectDetailsPage`)**: Project management, team membership management, archive/restore toggles, and project task breakdowns.
   - **Tasks Views (`TasksPage`, `TaskDetailsPage`)**: Cross-project task management with PostgreSQL-powered search, multi-criteria filters, server-side sorting, pagination controls, multi-task checkboxes, bulk operations toolbar, and filtered CSV export.
   - **Task Detail & Activity Timeline**: Dedicated task page with workflow buttons (restricting transitions to valid lifecycle moves), same-project dependency tracking, threaded comments, and immutable append-only history.
   - **Alerts View & Navigation (`AlertsPage`, `AppLayout`)**: Live navigation badge displaying active overdue alert count; Alerts management page displaying past-due tasks, days overdue, and assignment-authorized alert dismissals.

2. **Server (REST API)**
   - Modular Express architecture using `route → controller → service` pattern.
   - **Authentication Middleware (`auth.middleware.js`)**: Decodes JWT from HttpOnly cookies; enforces Manager-only route access.
   - **Task Business Rule Service (`task-rules.service.js`)**: Encapsulates lifecycle state machine transitions (`BACKLOG → IN_PROGRESS → IN_REVIEW → DONE`), exact unblocking state restoration via `previousStatus`, and server-side blocking dependency validation.
   - **Tasks Service (`tasks.service.js`)**:
     - `buildTasksWhereAndOrderBy`: Centralized clause builder shared between task listing and CSV export.
     - `bulkUpdateTasks`: Executes independent per-task mutations with partial-success error reporting.
     - `exportTasksCsv`: Streams RFC-compliant formatted CSV respecting active query filters.
     - `addComment`: Persists task discussion comments in PostgreSQL with author relations.
   - **Dashboard Service (`dashboard.service.js`)**: Server-side aggregation queries for KPI metrics, status distributions, team workloads, and weekly completion trends.
   - **Alerts Service (`alerts.service.js`)**: Server-side calculation of overdue tasks and declarative dismissal invalidation matching current `task.dueDate`.
   - Modular routes mounted:
     - `/api/auth` (Login, Logout, Me, Manager Test)
     - `/api/users` (User lookup & directory)
     - `/api/projects` (CRUD, Archive, Restore, Member Management)
     - `/api/tasks` (Search, Filter, Sort, Paginate, Bulk Mutations, CSV Export, Comments, CRUD, Assignees, Dependencies, Soft Deletion, Status Transitions, History Logging)
     - `/api/dashboard` (Server-side KPI metrics and chart datasets)
     - `/api/alerts` (Overdue alerts and assignment-based dismissals)

3. **Database (PostgreSQL via Prisma ORM)**
   - Relational schema with explicit join models (`ProjectMember`, `TaskAssignee`, `TaskDependency`), `previousStatus` persistence, indexed fields, and append-only `TaskHistory`, `Comment`, and `AlertDismissal` entities with `Restrict` cascade behavior.

## Where Each Piece Runs

- **Client:** Runs in the user's browser (served locally at `http://localhost:5173`).
- **Server:** Node.js Express server listening on `PORT` (defaults to `http://localhost:5000`).
- **Database:** PostgreSQL on port `5432` (or configured `DATABASE_URL`).

## Request Path (Representative: Overdue Alert Dismissal & Due Date Invalidation)

1. An assigned team member views `/alerts` or `/dashboard` and sees an active overdue task alert.
2. The user clicks "Dismiss" on the alert row $\rightarrow$ client sends `POST /api/alerts/:id/dismiss`.
3. Server verifies that the task is overdue and the user is assigned to it (returns 403 otherwise).
4. Server upserts `AlertDismissal` storing `dismissedDueDate = task.dueDate` and `dismissedAt = new Date()`.
5. On subsequent `GET /api/alerts` calls, the server checks `dismissedDueDate === task.dueDate` and flags `isDismissed = true`, decrementing the navigation badge count.
6. When the task's due date is subsequently modified (e.g. pushed back by 3 days) via `PUT /api/tasks/:id`, the query `WHERE dismissedDueDate = task.dueDate` naturally returns false.
7. The alert automatically resurfaces in `GET /api/alerts` without requiring manual background cleanup jobs or database triggers.

## What Was Deliberately Not Built

- **Complex Monorepo Orchestrators:** Standard two-folder layout with root npm orchestration scripts provides maximum clarity.
- **Client-Side Data Computations:** Dashboard metrics, filters, sorting, CSV generation, and alert invalidations are executed entirely in PostgreSQL queries on the server.
