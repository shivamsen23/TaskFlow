# Architecture

## Current Moving Pieces (Phase 7)

1. **Client (Single-Page Application)**
   - Built with React and bundled via Vite, styled consistently with `docs/ui-reference.png`.
   - `AuthContext` provides global session state (`user`, `isManager`, `login`, `logout`).
   - `ProtectedRoute` guards all application views.
   - `ProjectsPage` & `ProjectDetailsPage` provide workspace inspection, project settings, team membership controls, and direct project task management.
   - `TasksPage` & `TaskDetailsPage` provide cross-project task browsing with live server-side search, multi-criteria filters (project, status, priority, assignee, overdue, assigned-to-me), server-side sorting (due date, priority, last updated, title), pagination controls, result counters, and immutable activity history timelines.

2. **Server (REST API)**
   - Modular Express architecture using `route → controller → service` pattern.
   - `tasks.service.js` executes parameterized Prisma queries with server-side `where`, `orderBy`, `skip`, `take`, and `count()`.
   - `task-rules.service.js` encapsulates the state transition state machine (`BACKLOG → IN_PROGRESS → IN_REVIEW → DONE`, blocking transitions, exact-state unblocking, reopening, and blocking dependency completion checks).
   - Modular routes mounted:
     - `/api/auth` (Login, Logout, Me, Manager Test)
     - `/api/users` (User lookup & directory)
     - `/api/projects` (CRUD, Archive, Restore, Member Management)
     - `/api/tasks` (Search, Filter, Sort, Paginate, CRUD, Assignees, Dependencies, Soft Deletion, Status Transitions, History Logging)

3. **Database (PostgreSQL via Prisma ORM)**
   - Relational schema with explicit join models (`ProjectMember`, `TaskAssignee`, `TaskDependency`), `previousStatus` persistence for $O(1)$ unblocking, indexed fields (`updatedAt`, `deletedAt`, foreign keys), and append-only `TaskHistory`.

## Where Each Piece Runs

- **Client:** Runs in the user's browser (served locally at `http://localhost:5173`).
- **Server:** Node.js Express server listening on `PORT` (defaults to `http://localhost:5000`).
- **Database:** PostgreSQL on port `5432` (or configured `DATABASE_URL`).

## Request Path (Representative: Server-Side Multi-Criteria Task Query)

1. User modifies filter controls (e.g. search query, project, status, sort order) on `TasksPage`.
2. Client issues `GET /api/tasks?search=api&project=APOLLO&status=IN_PROGRESS&sortBy=dueDate&sortOrder=asc&page=1&limit=10` with `credentials: 'include'`.
3. `authenticate` verifies session token; server extracts `req.user` and `req.query`.
4. `tasks.service.js` parses query parameters:
   - Validates project membership access if the user is a `MEMBER` (returns 403 Forbidden if attempting to query unauthorized projects).
   - Builds Prisma `where` clause (`deletedAt: null`, `projectId`, `status`, text search matching `title` or `description`, overdue bounds).
   - Computes `skip = (page - 1) * limit` and `take = limit`.
   - Executes `prisma.task.count({ where })` and `prisma.task.findMany({ where, skip, take, orderBy, include })` concurrently in PostgreSQL.
5. Returns JSON response:
   ```json
   {
     "data": [...tasks],
     "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 }
   }
   ```
6. React UI renders exact page slice and updates result counts and pagination indicators without loading excessive records into browser memory.

## What Was Deliberately Not Built

- **Client-Side Array Filtering:** All filtering, text searching, ordering, and pagination occur directly inside PostgreSQL via Prisma queries, preventing browser performance degradation on large datasets.
