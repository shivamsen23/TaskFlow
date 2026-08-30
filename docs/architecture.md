# Architecture

## Current Moving Pieces (Phase 9)

1. **Client (Single-Page Application)**
   - Built with React and bundled via Vite, styled consistently with `docs/ui-reference.png`.
   - `AuthContext` provides global session state (`user`, `isManager`, `login`, `logout`).
   - `ProtectedRoute` guards all application views.
   - `ProjectsPage` & `ProjectDetailsPage` provide workspace inspection, project settings, team membership controls, and direct project task management.
   - `TasksPage` & `TaskDetailsPage` provide cross-project task browsing with live server-side search, multi-criteria filters, server-side sorting, pagination controls, result counters, bulk operations toolbar, and filtered CSV export.
   - **Unified Immutable Timeline & Comments**: `TaskDetailsPage` renders an append-only timeline combining task creation, field updates with old/new values, assignments, unassignments, status transitions, and threaded discussion comments with real-time comment authoring.

2. **Server (REST API)**
   - Modular Express architecture using `route → controller → service` pattern.
   - `tasks.service.js` coordinates queries, mutations, and audit logging:
     - `addComment`: Persists task discussion comments in PostgreSQL with author relations.
     - `getTaskById`: Merges `TaskHistory` and `Comment` records into a sorted, unified `timeline` array.
     - Automatic audit logging inside all service methods (`createTask`, `updateTask`, `deleteTask`).
     - Zero update/delete endpoints for history or comments (strictly append-only).
   - Modular routes mounted:
     - `/api/auth` (Login, Logout, Me, Manager Test)
     - `/api/users` (User lookup & directory)
     - `/api/projects` (CRUD, Archive, Restore, Member Management)
     - `/api/tasks` (Search, Filter, Sort, Paginate, Bulk Mutations, CSV Export, Comments, CRUD, Assignees, Dependencies, Soft Deletion, Status Transitions, History Logging)

3. **Database (PostgreSQL via Prisma ORM)**
   - Relational schema with explicit join models (`ProjectMember`, `TaskAssignee`, `TaskDependency`), `previousStatus` persistence, indexed fields, and append-only `TaskHistory` and `Comment` entities with `Restrict` cascade behavior.

## Where Each Piece Runs

- **Client:** Runs in the user's browser (served locally at `http://localhost:5173`).
- **Server:** Node.js Express server listening on `PORT` (defaults to `http://localhost:5000`).
- **Database:** PostgreSQL on port `5432` (or configured `DATABASE_URL`).

## Request Path (Representative: Comment Authoring & Timeline Assembly)

1. User types a message in "Add to Discussion" on `TaskDetailsPage` and clicks "Post Comment".
2. Client sends `POST /api/tasks/:id/comments` with `{ content: "..." }` and `credentials: 'include'`.
3. `authenticate` verifies session; `tasksService.addComment` ensures task exists and user belongs to the project (or is a Manager).
4. Service inserts into `prisma.comment` (`taskId`, `userId: user.id`, `content`, `createdAt: new Date()`).
5. Returns HTTP 201 Created with the saved comment.
6. Client fetches `GET /api/tasks/:id` which merges `histories` and `comments` into a unified, chronological `timeline` array.
7. React UI renders the new comment bubble in place alongside historical system actions.

## What Was Deliberately Not Built

- **Editable/Deletable History or Comments:** No routes exist to update or delete `TaskHistory` or `Comment` rows, guaranteeing an immutable audit trail even for Managers.
- **Client-Side Fake Timeline:** The timeline is populated purely from server records in PostgreSQL.
