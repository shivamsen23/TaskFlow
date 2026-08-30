# Architecture

## Current Moving Pieces (Phase 6)

1. **Client (Single-Page Application)**
   - Built with React and bundled via Vite, styled consistently with `docs/ui-reference.png`.
   - `AuthContext` provides global session state (`user`, `isManager`, `login`, `logout`).
   - `ProtectedRoute` guards all application views.
   - `ProjectsPage` & `ProjectDetailsPage` provide workspace inspection, project settings, team membership controls, and direct project task management.
   - `TasksPage` & `TaskDetailsPage` provide cross-project and project-scoped task browsing, "Assigned to Me" filtering, priority/status indicators, assignee lists, blocking dependency graphs, and immutable activity history timelines.
   - Dynamic workflow actions on `TaskDetailsPage` offer only legal status moves (`getLegalNextStatuses`), with immediate error alert banners on server-rejected transitions.

2. **Server (REST API)**
   - Modular Express architecture using `route → controller → service` pattern.
   - `task-rules.service.js` encapsulates the state transition state machine (`BACKLOG → IN_PROGRESS → IN_REVIEW → DONE`, blocking transitions from `IN_PROGRESS`/`IN_REVIEW`, exact-state unblocking, reopening, and blocking dependency completion checks).
   - `tasks.service.js` coordinates task mutations, role visibility, assignment synchronization, and audit logging.
   - Modular routes mounted:
     - `/api/auth` (Login, Logout, Me, Manager Test)
     - `/api/users` (User lookup & directory)
     - `/api/projects` (CRUD, Archive, Restore, Member Management)
     - `/api/tasks` (CRUD, Assignees, Dependencies, Soft Deletion, Status Transitions, History Logging)

3. **Database (PostgreSQL via Prisma ORM)**
   - Relational schema with explicit join models (`ProjectMember`, `TaskAssignee`, `TaskDependency`), `previousStatus` persistence for $O(1)$ unblocking, soft deletion (`deletedAt`), and append-only `TaskHistory`.

## Where Each Piece Runs

- **Client:** Runs in the user's browser (served locally at `http://localhost:5173`).
- **Server:** Node.js Express server listening on `PORT` (defaults to `http://localhost:5000`).
- **Database:** PostgreSQL on port `5432` (or configured `DATABASE_URL`).

## Request Path (Representative: Task Lifecycle Transition & Dependency Verification)

1. User clicks "Complete Task → DONE" on `TaskDetailsPage` or changes status via API.
2. Client sends `PATCH /api/tasks/:id/status` with `{ status: "DONE" }` and `credentials: 'include'`.
3. `authenticate` verifies session token; server verifies user belongs to the target project (or is a Manager).
4. `tasks.service.js` calls `taskRulesService.validateStatusTransition(task, "DONE")`:
   - Validates that current status is `IN_REVIEW` (rejects illegal jumps from `BACKLOG` or `IN_PROGRESS` with HTTP 400).
   - Queries `TaskDependency` rows where `taskId = task.id`.
   - Checks if any active blocking task has `status !== 'DONE'`. If unfinished blocking tasks exist, throws HTTP 400 with a detailed error identifying the blocking tasks.
5. In a Prisma transaction (`prisma.$transaction`):
   - Updates task status to `DONE`.
   - Appends an immutable `TaskHistory` audit record (`action: 'STATUS_CHANGE'`, `field: 'status'`, `oldValue: 'IN_REVIEW'`, `newValue: 'DONE'`, `userId: user.id`).
6. Transaction commits atomically.
7. Controller returns HTTP 200 with updated task and recomputed legal next statuses (`reopen` options), and UI updates state immediately.

## What Was Deliberately Not Built

- **Client-Only Transition Validation:** All lifecycle rules and dependency completion checks are enforced strictly on the server, rejecting manual API violations with clear HTTP 400 errors.
- **Complex Dynamic State Machines:** Replaced generic dynamic workflow rule engines with a clean, human-readable switch-based state transition evaluator.
