# Architecture

## Current Moving Pieces (Phase 5)

1. **Client (Single-Page Application)**
   - Built with React and bundled via Vite, styled consistently with `docs/ui-reference.png`.
   - `AuthContext` provides global session state (`user`, `isManager`, `login`, `logout`).
   - `ProtectedRoute` guards all application views.
   - `ProjectsPage` & `ProjectDetailsPage` provide workspace inspection, project settings, team membership controls, and direct project task management.
   - `TasksPage` & `TaskDetailsPage` provide cross-project and project-scoped task browsing, "Assigned to Me" filtering, priority/status indicators, assignee lists, blocking dependency graphs, and immutable activity history timelines.
   - `TaskModal` manages task creation/editing with project member assignee validation and same-project blocking dependency selectors.

2. **Server (REST API)**
   - Modular Express architecture using `route → controller → service` pattern.
   - `authenticate` middleware enforces valid JWT session.
   - `requireManager` middleware guards privileged mutations (project CRUD/archival, member management, task deletion).
   - Modular routes mounted:
     - `/api/auth` (Login, Logout, Me, Manager Test)
     - `/api/users` (User lookup & directory)
     - `/api/projects` (CRUD, Archive, Restore, Member Management)
     - `/api/tasks` (CRUD, Assignees, Dependencies, Soft Deletion, History Logging)

3. **Database (PostgreSQL via Prisma ORM)**
   - Relational schema with explicit join models (`ProjectMember`, `TaskAssignee`, `TaskDependency`), soft deletion (`deletedAt`), and append-only `TaskHistory`.

## Where Each Piece Runs

- **Client:** Runs in the user's browser (served locally at `http://localhost:5173`).
- **Server:** Node.js Express server listening on `PORT` (defaults to `http://localhost:5000`).
- **Database:** PostgreSQL on port `5432` (or configured `DATABASE_URL`).

## Request Path (Representative: Task Assignment & History Audit Trail)

1. User creates or edits a task on `TaskModal` or `TaskDetailsPage`.
2. Client sends `POST /api/tasks` or `PUT /api/tasks/:id` with `assigneeIds` and `blockingTaskIds`.
3. `authenticate` verifies session token; server verifies user belongs to the target project (or is a Manager).
4. `tasks.service.js` validates:
   - Every assignee in `assigneeIds` has a `ProjectMember` record in the task's project.
   - Every blocking task in `blockingTaskIds` belongs to the exact same project and is not self-referential.
5. In a single atomic Prisma transaction (`prisma.$transaction`):
   - Updates task scalar fields.
   - Calculates assignee delta: deletes unassigned `TaskAssignee` rows and creates `TaskHistory` (`action: 'UNASSIGNED'`, `field: 'assignee'`, `oldValue: user.name`); inserts new `TaskAssignee` rows and creates `TaskHistory` (`action: 'ASSIGNED'`, `field: 'assignee'`, `newValue: user.name`).
   - Syncs `TaskDependency` rows.
6. Transaction commits atomically.
7. Controller returns HTTP 200/201 with populated relational data, and UI updates state instantly.

## What Was Deliberately Not Built

- **Hard Deletion of Tasks:** Tasks are soft-deleted (`deletedAt = new Date()`), preserving immutable audit history and comment threads.
- **Client-Only Assignment Validation:** Server rigorously checks project membership for all assignees before permitting assignment mutations.
- **Status Transition Rules (Goal 4):** Deferred to Phase 6 state machine implementation.
