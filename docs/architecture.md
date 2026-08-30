# Architecture

## Current Moving Pieces (Phase 4)

1. **Client (Single-Page Application)**
   - Built with React and bundled via Vite, styled consistently with `docs/ui-reference.png`.
   - `AuthContext` provides global session state (`user`, `isManager`, `login`, `logout`).
   - `ProtectedRoute` guards all application views.
   - `ProjectsPage` provides project browsing, active/archived filters, search, and manager creation modal.
   - `ProjectDetailsPage` provides detailed workspace inspection, archive/restore controls, and team member management with member addition modal and removal confirmation.

2. **Server (REST API)**
   - Modular Express architecture using `route → controller → service` pattern.
   - `authenticate` middleware enforces valid JWT session.
   - `requireManager` middleware guards privileged project mutations (create, edit, archive, restore, add/remove members).
   - `projects.service.js` encapsulates database operations, role visibility filters, and multi-table transactional unassignments.
   - Modular routes mounted:
     - `/api/auth` (Login, Logout, Me, Manager Test)
     - `/api/users` (User lookup & directory)
     - `/api/projects` (CRUD, Archive, Restore, Member Management)

3. **Database (PostgreSQL via Prisma ORM)**
   - Complete relational schema with explicit join models (`ProjectMember`, `TaskAssignee`, `TaskDependency`), soft deletion, and immutable history logs.

## Where Each Piece Runs

- **Client:** Runs in the user's browser (served locally at `http://localhost:5173`).
- **Server:** Node.js Express server listening on `PORT` (defaults to `http://localhost:5000`).
- **Database:** PostgreSQL on port `5432` (or configured `DATABASE_URL`).

## Request Path (Representative: Project Member Removal & Task Unassignment)

1. Manager clicks "Remove" for a team member on `ProjectDetailsPage`.
2. Client sends `DELETE /api/projects/:id/members/:userId` with `credentials: 'include'`.
3. `authenticate` verifies session token; `requireManager` validates `req.user.role === 'MANAGER'`.
4. `projects.controller.js` invokes `projectsService.removeMember(projectId, targetUserId, req.user)`.
5. `projects.service.js` opens a Prisma interactive transaction (`prisma.$transaction`):
   - Validates user is not the project owner.
   - Deletes the `ProjectMember` join record.
   - Queries all active tasks in this project where the target user is currently assigned.
   - Deletes each `TaskAssignee` join record for those tasks.
   - Appends an immutable `TaskHistory` audit record for every unassigned task (`action: 'UNASSIGNED'`, `field: 'assignee'`, `oldValue: user.name`, `userId: managerUser.id`).
6. Transaction commits atomically.
7. Controller returns HTTP 200 with confirmation details, and client re-fetches the updated project state.

## What Was Deliberately Not Built

- **Hard Deletion of Projects:** Projects are soft-archived (`archived: true`) rather than deleted, guaranteeing no data or task loss.
- **Client-Only Project Filtering:** Role visibility is enforced strictly on the server: Members only receive projects they belong to in API queries, and direct URL access to non-member projects is rejected with HTTP 403 Forbidden.
