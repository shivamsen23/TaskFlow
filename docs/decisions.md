# Decisions

## Decision 1: Project Structure and Script Management

- **Chose:** Standard two-folder layout (`client/` and `server/`) with root orchestration scripts in root `package.json`.
- **Rejected:** Monorepo frameworks (Lerna, Turborepo, Nx, npm workspaces).
- **Why:** For an application of this scope, heavy monorepo tooling introduces unnecessary config overhead, build complexity, and cognitive load. Simple npm scripts provide fast, clear developer workflows without extra dependencies.

## Decision 2: Frontend Tooling and Routing

- **Chose:** React initialized with Vite and React Router (`react-router-dom`).
- **Rejected:** Next.js / Create React App.
- **Why:** Vite provides instantaneous hot module reloading, fast build times, and zero-boilerplate configuration. React Router offers straightforward client-side routing matching the SPA requirements.

## Decision 3: Backend Framework and Layering

- **Chose:** Node.js with Express, configured with clean modular middleware (CORS, JSON parsing, 404 handler, centralized error handler).
- **Rejected:** NestJS or heavy enterprise frameworks with dependency injection and repository wrappers.
- **Why:** A straightforward `route → controller → service` pattern using Prisma directly inside services provides the right balance of clarity, maintainability, and readability without over-engineering.

## Decision 4: Environment Variable Strategy

- **Chose:** Single clear `.env.example` in root with local loading in `server/src/server.js` and `.gitignore` safety.
- **Rejected:** Hardcoded configuration or committed `.env` files.
- **Why:** Keeps secrets strictly out of version control while making it effortless for new developers or evaluators to set up local environments.

## Decision 5: Language and Module System Selection

- **Chose:** JavaScript (Node.js CommonJS for server, ES Modules for client).
- **Rejected:** TypeScript.
- **Why:** JavaScript provides maximum agility and simplicity for the take-home requirements without compilation overhead or overly complex typing boilerplate, aligned with the explicit instruction to avoid unnecessary complexity.

## Decision 6: Primary Key Strategy (UUIDs)

- **Chose:** UUID v4 strings (`@default(uuid())`) across all database entities.
- **Rejected:** Serial auto-incrementing integers.
- **Why:** UUIDs prevent ID enumeration vulnerabilities, eliminate sequential collision risks, and ensure unambiguous identifiers across distributed services and client state.

## Decision 7: Immutable Audit History & Comments Architecture

- **Chose:** Dedicated append-only `TaskHistory` and `Comment` tables with explicit `createdAt` and no update triggers or endpoints.
- **Rejected:** Generic polymorphic event store or editable comment schemas.
- **Why:** Requirement 9 mandates that timeline entries and comments can never be edited or deleted. Storing structured history with strong foreign keys guarantees referential integrity while preventing retroactive alteration.

## Decision 8: Alert Dismissal Invalidation Pattern

- **Chose:** Storing `dismissedDueDate` snapshot on `AlertDismissal`.
- **Rejected:** Mutation hooks / DB triggers to delete dismissal records whenever a task due date changes.
- **Why:** By recording the task's due date at dismissal time, invalidation becomes purely declarative. When the task's `dueDate` changes, the query `WHERE dismissedDueDate = task.dueDate` naturally returns false, causing the overdue alert to resurface immediately with zero background cleanup jobs or triggers.

## Decision 9: Task Unblock State Persistence (`previousStatus`)

- **Chose:** Dedicated nullable `previousStatus` column on the `Task` entity.
- **Rejected:** Querying the latest `TaskHistory` record at runtime to find which state preceded `BLOCKED`.
- **Why:** Direct column storage provides instant $O(1)$ read and write performance during state transitions and eliminates race conditions or edge cases from parsing audit log strings.

## Decision 10: Explicit Join Models (`ProjectMember`, `TaskAssignee`, `TaskDependency`)

- **Chose:** Explicit Prisma join models with composite unique constraints and individual indexes.
- **Rejected:** Implicit Prisma many-to-many relationship tables.
- **Why:** Explicit join models provide fine-grained control over timestamps (`joinedAt`, `assignedAt`), cascade behaviors, and future metadata without relying on hidden database tables.

## Decision 11: Task Soft Deletion and Restrict Deletion Policy

- **Chose:** Soft deletion via `Task.deletedAt` and changing foreign key behaviors on `Project → Task`, `Task → TaskHistory`, `Task → Comment`, and `User → Comment` to `onDelete: Restrict`.
- **Rejected:** Physical SQL `DELETE CASCADE` on tasks, history, and comments.
- **Why:** Soft deletion preserves immutable historical audit trails and comments even when tasks are removed from active views. Setting foreign keys to `Restrict` prevents unintended cascading data loss when projects or users are referenced.

## Decision 12: Authentication Token Storage (HttpOnly Cookies vs LocalStorage)

- **Chose:** JWT stored in `HttpOnly`, `SameSite: Lax` secure cookies with CORS `credentials: true`.
- **Rejected:** Storing JWT in `localStorage` or `sessionStorage`.
- **Why:** LocalStorage is completely vulnerable to Cross-Site Scripting (XSS) attacks where malicious scripts can steal credentials. HttpOnly cookies are inaccessible to browser JavaScript, mitigating XSS token extraction.

## Decision 13: Server-Side Role Enforcement Middleware

- **Chose:** Server-side `authenticate` and `requireManager` Express middleware chain.
- **Rejected:** Relying solely on client UI role checks (e.g. hiding buttons in React).
- **Why:** Client-side checks are purely cosmetic UX conveniences. True security requires every privileged endpoint to inspect the validated token payload on the server and reject non-manager requests with HTTP 403 Forbidden.

## Decision 14: Project Archival vs Physical Deletion

- **Chose:** Soft archival flag (`Project.archived`) and restricting physical deletion.
- **Rejected:** Physical SQL DELETE of projects or archiving via separate cold-storage tables.
- **Why:** Goal 2 requires that archiving hides a project from default active views without destroying tasks, memberships, or history. A boolean flag on `Project` filtered by default in `projectsService.getProjects` satisfies the requirement cleanly without relational disruptions.

## Decision 15: Transactional Member Removal & Automatic Task Unassignment

- **Chose:** Atomic Prisma transaction (`prisma.$transaction`) that deletes `ProjectMember`, finds all active tasks assigned to the user in that project, removes `TaskAssignee` records, and creates individual `TaskHistory` unassignment entries.
- **Rejected:** Leaving orphan task assignees or running multiple non-transactional queries.
- **Why:** Goal 5 mandates that removing a user from a project unassigns them from that project's tasks, while Goal 9 requires immutable history tracking. An atomic database transaction guarantees relational consistency and ensures audit records are never skipped.

## Decision 16: Server-Side Assignee Membership & Intra-Project Dependency Validation

- **Chose:** Strict server-side verification that assignees belong to `ProjectMember` and blocking tasks belong to the exact same `projectId`.
- **Rejected:** Trusting frontend dropdown filters or allowing cross-project task blocking.
- **Why:** Requirement 3 and Requirement 5 state that only project members may be assigned to project tasks and dependencies are strictly intra-project. Backend validation guarantees data integrity against malformed API requests.

## Decision 17: Task Soft Deletion with Manager Authorization

- **Chose:** Soft deletion via `deletedAt = new Date()` protected by `requireManager` middleware and logging a `DELETED` entry in `TaskHistory`.
- **Rejected:** Hard SQL DELETE or allowing Members to delete tasks.
- **Why:** Requirement 1 explicitly restricts task deletion to Managers, and Requirement 9 mandates immutable history. Soft deletion keeps all timeline logs and related audit records intact while hiding the task from all active views.

## Decision 18: Server-Side Task Lifecycle State Machine & Dependency Validation

- **Chose:** Dedicated `task-rules.service.js` state machine enforcing allowed state paths (`BACKLOG → IN_PROGRESS → IN_REVIEW → DONE`), exact `previousStatus` unblocking, and server-side verification that all blocking dependencies are finished before allowing `DONE`.
- **Rejected:** Allowing unrestricted status changes or performing dependency checks solely on the frontend.
- **Why:** Goal 4 mandates strict lifecycle rules and server-level rejection of illegal jumps or premature completions. Centralizing the state machine in a service guarantees database integrity across direct API calls, modal edits, and quick workflow buttons.

## Decision 19: Server-Side Query Processing vs Client-Side Array Filtering

- **Chose:** Full server-side query processing using PostgreSQL `WHERE`, `ORDER BY`, `LIMIT`, and `OFFSET` via Prisma parameterized queries.
- **Rejected:** Loading the entire task database into React state and filtering/sorting with JavaScript array functions.
- **Why:** Goal 6 specifically mandates: *"All of this must be done by the server — do not load every task into the browser and filter there."* Server-side filtering scales to tens of thousands of records, respects strict data isolation per role, and minimizes network payload sizes.

## Decision 20: Bulk Task Partial Success Isolation & Server CSV Streaming

- **Chose:** Processing bulk task mutations in independent per-task operations returning detailed per-task `{ taskId, title, success, reason }` status reports, coupled with server-side filtered CSV generation.
- **Rejected:** Executing the entire bulk batch in a single atomic transaction that rolls back on any single task violation, or building CSV files inside the React client.
- **Why:** Goal 7 explicitly requires: *"Because some of those changes will be illegal for some tasks, the result must report per task what succeeded and what was rejected and why — not just fail the whole batch."* Independent execution guarantees that valid tasks are saved while invalid tasks are clearly explained.
