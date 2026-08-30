# Architecture

## Current Moving Pieces (Phase 8)

1. **Client (Single-Page Application)**
   - Built with React and bundled via Vite, styled consistently with `docs/ui-reference.png`.
   - `AuthContext` provides global session state (`user`, `isManager`, `login`, `logout`).
   - `ProtectedRoute` guards all application views.
   - `ProjectsPage` & `ProjectDetailsPage` provide workspace inspection, project settings, team membership controls, and direct project task management.
   - `TasksPage` & `TaskDetailsPage` provide cross-project task browsing with live server-side search, multi-criteria filters (project, status, priority, assignee, overdue, assigned-to-me), server-side sorting, pagination controls, result counters, and immutable activity history timelines.
   - **Bulk Actions & CSV Toolbar**: Multi-row selection, sticky bulk toolbar (`Change Status`, `Change Assignees`, `Change Due Date`), per-task partial success result reporting dialog, and one-click filtered CSV dataset export (`/api/tasks/export/csv`).

2. **Server (REST API)**
   - Modular Express architecture using `route → controller → service` pattern.
   - `tasks.service.js` coordinates queries and mutations:
     - `buildTasksWhereAndOrderBy`: Centralized clause builder shared between task listing and CSV export.
     - `bulkUpdateTasks`: Executes independent per-task mutations, catching individual lifecycle/validation errors without failing the batch, and returning structured `{ results: [{ taskId, title, success, reason }], summary }`.
     - `exportTasksCsv`: Streams RFC-compliant formatted CSV respecting active query filters.
   - `task-rules.service.js` encapsulates the state transition state machine (`BACKLOG → IN_PROGRESS → IN_REVIEW → DONE`, blocking transitions, exact-state unblocking, reopening, and blocking dependency completion checks).
   - Modular routes mounted:
     - `/api/auth` (Login, Logout, Me, Manager Test)
     - `/api/users` (User lookup & directory)
     - `/api/projects` (CRUD, Archive, Restore, Member Management)
     - `/api/tasks` (Search, Filter, Sort, Paginate, Bulk Mutations, CSV Export, CRUD, Assignees, Dependencies, Soft Deletion, Status Transitions, History Logging)

3. **Database (PostgreSQL via Prisma ORM)**
   - Relational schema with explicit join models (`ProjectMember`, `TaskAssignee`, `TaskDependency`), `previousStatus` persistence for $O(1)$ unblocking, indexed fields (`updatedAt`, `deletedAt`, foreign keys), and append-only `TaskHistory`.

## Where Each Piece Runs

- **Client:** Runs in the user's browser (served locally at `http://localhost:5173`).
- **Server:** Node.js Express server listening on `PORT` (defaults to `http://localhost:5000`).
- **Database:** PostgreSQL on port `5432` (or configured `DATABASE_URL`).

## Request Path (Representative: Bulk Task Status Mutation with Partial Success)

1. User selects 3 tasks on `TasksPage` (Tasks A and B in `IN_PROGRESS`, Task C in `BLOCKED`) and chooses bulk status action `IN_REVIEW`.
2. Client posts `POST /api/tasks/bulk` with `{ taskIds: ["A", "B", "C"], action: "status", status: "IN_REVIEW" }`.
3. `authenticate` verifies session; controller forwards to `tasksService.bulkUpdateTasks`.
4. The service iterates over each task individually:
   - For Task A: `tasksService.updateTask` validates `IN_PROGRESS → IN_REVIEW` (valid), commits update in `prisma.$transaction`, logs `STATUS_CHANGE` history, records `{ taskId: 'A', success: true }`.
   - For Task B: validates `IN_PROGRESS → IN_REVIEW` (valid), commits update, logs history, records `{ taskId: 'B', success: true }`.
   - For Task C: validates `BLOCKED → IN_REVIEW` (invalid per state machine rules), catches error without rollback of A and B, records `{ taskId: 'C', success: false, reason: 'Task is BLOCKED and can only be unblocked back to its previous state' }`.
5. Controller returns HTTP 200:
   ```json
   {
     "results": [
       { "taskId": "A", "title": "Task A", "success": true },
       { "taskId": "B", "title": "Task B", "success": true },
       { "taskId": "C", "title": "Task C", "success": false, "reason": "Task is BLOCKED..." }
     ],
     "summary": { "total": 3, "successful": 2, "failed": 1 }
   }
   ```
6. Frontend updates the UI table and displays a detailed summary banner showing successful items and reasons for any rejections.

## What Was Deliberately Not Built

- **Single All-or-Nothing Transaction for Bulk Actions:** A monolithic transaction was avoided because Goal 7 mandates partial success where valid tasks are saved while invalid tasks return per-task rejection reasons.
- **Client-Side CSV Generation:** The CSV is generated directly by the backend from parameterized database queries, guaranteeing accurate export of filtered datasets without overflowing browser memory.
