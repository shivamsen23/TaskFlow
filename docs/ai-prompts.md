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

---

## Phase 5 — Tasks and Assignments

### Prompt

```text
PHASE 5 — TASKS AND ASSIGNMENTS

Implement Goal 3 and task assignment functionality from Goal 5.

Implement:
Task CRUD.

Every task:
- belongs to exactly one project
- has title
- description
- priority
- optional due date
- status
- one or more optional assignees
- blocking task dependencies

Only project members can be assigned.
Managers can delete tasks.
Members cannot delete tasks.

Create: tasks routes, tasks controller, tasks service.
Support: POST /api/tasks, GET /api/tasks/:id, PUT /api/tasks/:id, DELETE /api/tasks/:id, GET /api/tasks.

When task assignees change:
- record assignment/unassignment in history

Frontend: Tasks page, Project task list, Create/Edit Task modal, Task Details page, Assignee selector, Priority selector, Due date, Dependency selector following docs/ui-reference.png.

Add tests for:
- task must belong to project
- non-member cannot be assigned (400)
- multiple assignees work
- member cannot delete task (403)
- manager can delete task (soft delete)
- dependency must be same project
- assignment changes create history
```

### What you got
- Tasks module (`server/src/modules/tasks/`) with `tasks.routes.js`, `tasks.controller.js`, `tasks.service.js`.
- Strict server-side validation: tasks must belong to a valid project; assignees must be members of that project; dependencies must be intra-project.
- Soft deletion implementation via `deletedAt DateTime?`, restricted to Managers, logging `DELETED` in `TaskHistory`.
- Atomic `prisma.$transaction` tracking field updates, assignee additions (`ASSIGNED`), and removals (`UNASSIGNED`) with audit records.
- React frontend pages and components (`TasksPage`, `TaskDetailsPage`, `TaskModal`, updated `ProjectDetailsPage` and `AppLayout`) styled per `docs/ui-reference.png`.
- Automated backend test suite (`server/src/tests/tasks.test.js`) passing 7 comprehensive test cases (22 total tests across the system).

### What you corrected
- Refactored `prisma.$transaction` in task creation and update methods to ensure full database commits prior to fetching populated relation graphs.

---

## Phase 6 — Task Lifecycle and Dependency Business Rules

### Prompt

```text
PHASE 6 — TASK LIFECYCLE AND DEPENDENCY BUSINESS RULES

Implement Goal 4 completely.

Allowed lifecycle:
BACKLOG → IN_PROGRESS → IN_REVIEW → DONE
IN_PROGRESS → BLOCKED
IN_REVIEW → BLOCKED
BLOCKED → exact state from which it was blocked (previousStatus)
DONE → reopened (IN_PROGRESS)

Dependency rule:
A task cannot move to DONE if any blocking task is unfinished.
Validate on the SERVER.
Return useful error messages (e.g. "Task cannot be marked as DONE because blocking task ALP-12 is not finished.")

Every successful status change must create TaskHistory.
Every rejected status change must leave the database unchanged.

Frontend:
- Only display legal next status actions.
- Show clear error messages from backend.

Add tests for:
- valid transitions
- invalid transitions
- blocking
- unblocking
- reopening DONE
- unfinished dependency blocks DONE
- completed dependency allows DONE
- invalid transition does not change database
- history created on valid transition
```

### What you got
- Dedicated `task-rules.service.js` implementing state machine evaluation, legal next status calculation, and blocking dependency completion validation.
- Integration into `tasks.service.js` with `previousStatus` persistence during `BLOCKED` transitions and atomic `STATUS_CHANGE` history logging.
- `PATCH /api/tasks/:id/status` endpoint for direct, lightweight status mutations.
- React frontend UI with interactive workflow buttons offering only currently legal next actions and instant error alert banners on server-rejected transitions.
- Comprehensive automated test suite (`server/src/tests/lifecycle.test.js`) with 14 test cases (36 total tests across the system with 100% pass rate).

### What you corrected
- Added granular, actionable error messages for illegal jumps explaining why the transition was rejected (e.g. missing review phase or unfinished blocking tasks).

---

## Phase 7 — Server-Side Task Search, Filtering, Sorting & Pagination

### Prompt

```text
PHASE 7 — SERVER-SIDE TASK SEARCH FILTERING SORTING PAGINATION

Implement Goal 6.

Extend GET /api/tasks.

Support query parameters:
page, limit, search, project, status, assignee, priority, overdue, sortBy, sortOrder

Search:
- title, description (case-insensitive)

Filters:
- project, status, assignee, priority, overdue

Sorting:
- due date, priority, last updated

Pagination:
- page, limit, total, totalPages

Filtering must happen in PostgreSQL through Prisma.
DO NOT: fetch all tasks into React, filter in JavaScript, sort all records in browser, paginate after loading all tasks.

Return:
{
  data: [],
  pagination: { page, limit, total, totalPages }
}

Respect project visibility for members.
Update Tasks UI with search input, filters, sorting, pagination, and result count.
Add backend tests for combinations of filters.
```

### What you got
- Enhanced `GET /api/tasks` in `server/src/modules/tasks/tasks.service.js` using Prisma `where`, `orderBy`, `skip`, `take`, and `count()`.
- Standardized response returning `{ data, pagination: { page, limit, total, totalPages } }` (along with `tasks` alias for backwards compatibility).
- React `TasksPage` updated with live search input, filter dropdowns, sorting toggles, pagination controls, and active result counts.
- Automated test suite (`server/src/tests/search-filter.test.js`) with 10 test cases verifying search, filters, combinations, pagination limits, and member authorization (46 total backend tests passing).

### What you corrected
- Configured case-insensitive search (`mode: 'insensitive'`) over title and description combined via Prisma `OR`.

---

## Phase 8 — Bulk Task Operations and CSV Export

### Prompt

```text
PHASE 8 — BULK TASK OPERATIONS AND CSV EXPORT

Implement Goal 7.

Bulk operations:
1. change status
2. change assignees
3. change due date

Process tasks independently to support partial success.
If one task is invalid:
- valid tasks succeed and commit
- invalid task is rejected
- response returns per-task result and error explanation

Reuse existing task service and business rules; record TaskHistory for each successful task.

CSV export:
- GET /api/tasks/export/csv
- Respect all active query filters (search, project, status, assignee, priority, overdue, sorting)
- Server-side generation

Frontend:
- Selection checkboxes
- Sticky bulk action toolbar
- Bulk results modal/banner
- Export CSV button

Add backend tests for partial success.
```

### What you got
- `bulkUpdateTasks` in `server/src/modules/tasks/tasks.service.js` and `POST /api/tasks/bulk` implementing independent per-task processing with partial success.
- `exportTasksCsv` in `server/src/modules/tasks/tasks.service.js` and `GET /api/tasks/export/csv` streaming RFC-compliant CSVs matching active server-side filters.
- React `TasksPage` updated with multi-select checkboxes, floating bulk action bar, detailed per-task outcome dialog, and one-click CSV export button.
- Comprehensive automated test suite (`server/src/tests/bulk-csv.test.js`) with 6 test cases verifying partial success isolation, audit logging, and filtered CSV content (52 total backend tests passing).

### What you corrected
- Centralized `buildTasksWhereAndOrderBy` helper in `tasks.service.js` so `GET /api/tasks` and `GET /api/tasks/export/csv` share identical filtering and sorting logic.

---

## Phase 9 — Immutable Task History and Comments

### Prompt

```text
PHASE 9 — IMMUTABLE TASK HISTORY AND COMMENTS

Implement Goal 9 completely.

Every task timeline must record:
- task creation
- status changes
- priority changes
- title changes
- description changes
- due date changes
- assignment
- unassignment
- comments

Every record must include who, what happened, when, old value & new value where applicable.
History must be append-only.
NO update history endpoint.
NO delete history endpoint.
Managers must not be able to modify historical records.

Task details page:
- display timeline
- display comments
- allow adding comment
- do not allow editing/deleting timeline items

Add tests for:
- task creation creates history
- status change creates history
- field change creates old/new values
- assignment creates history
- unassignment creates history
- comment creates history
- history update endpoint does not exist
- history delete endpoint does not exist
```

### What you got
- `addComment` service and `POST /api/tasks/:id/comments` endpoint persisting task comments in PostgreSQL with author relations.
- Extended `GET /api/tasks/:id` to merge `TaskHistory` and `Comment` entities into a single, unified, chronological `timeline` array.
- Updated `TaskDetailsPage` in React with a threaded activity history and comment timeline and a comment posting form.
- Automated test suite (`server/src/tests/history-comments.test.js`) with 8 test cases verifying creation, status, field updates, assignments, comments, and lack of edit/delete endpoints (60 total backend tests passing).

### What you corrected
- Unified history and comments into a single chronological timeline feed without needing polymorphic database tables.

---

## Phase 10 — Dashboard and Overdue Alerts

### Prompt

```text
PHASE 10 — DASHBOARD AND OVERDUE ALERTS

Implement Goal 8 and Goal 10.

DASHBOARD
Create GET /api/dashboard with server-side calculations:
1. Open tasks
2. Overdue tasks
3. Due this week
4. Completed this week
5. Tasks by status
6. Tasks by assignee
7. Completion trend for last 8 weeks
Respect user's project visibility.

Frontend dashboard with Recharts:
- metric cards
- status chart
- assignee workload chart
- 8-week completion chart
- overdue task section

ALERTS
Create GET /api/alerts and POST /api/alerts/:taskId/dismiss.
Overdue task: dueDate in the past, status != DONE.
Navigation shows alert count badge.
Assigned members can dismiss.
If task dueDate changes after dismissal, alert becomes active again.
Enforce on server; no localStorage truth.

Add tests for:
- overdue task appears
- DONE overdue task does not appear
- assigned member can dismiss
- unassigned member cannot dismiss (403)
- dismissed alert remains dismissed while dueDate unchanged
- changing dueDate causes alert to reappear
```

### What you got
- `server/src/modules/dashboard/` implementing server-side aggregation for KPI headline metrics, status distributions, team workloads, and 8-week completion trends.
- `server/src/modules/alerts/` implementing overdue task filtering, assignment-authorized dismissal (`AlertDismissal`), and automatic invalidation when due date changes.
- React `DashboardPage` featuring Recharts visualizations (8-Week Throughput Area Chart, Status Breakdown Bar Chart, Assignee Workload Chart) and overdue task lists.
- React `AlertsPage` with active/all filter views, days-overdue badges, and inline dismissal buttons.
- Updated `AppLayout` with a live red pill badge displaying active overdue alert counts.
- Automated test suite (`server/src/tests/dashboard-alerts.test.js`) with 8 test cases (68 total backend tests passing).

### What you corrected
- Verified that alert dismissal is evaluated dynamically by comparing `dismissedDueDate` with the live `task.dueDate` in PostgreSQL, enabling automatic alert resurfacing without cron workers.
