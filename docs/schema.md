# Schema Documentation

This document describes the complete PostgreSQL database schema managed via Prisma for the BUSY Task Manager.

---

## 1. Tables, Columns, and Data Types

### `User`
Stores system users across both manager and member roles.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | `@id @default(uuid())` | Unique user identifier |
| `name` | `String` | `NOT NULL` | Full name of the user |
| `email` | `String` | `NOT NULL, UNIQUE` | Unique email for login (backed by unique index) |
| `passwordHash` | `String` | `NOT NULL` | Bcrypt hashed password |
| `role` | `Enum (Role)` | `NOT NULL, DEFAULT 'MEMBER'` | Role: `MANAGER` or `MEMBER` |
| `createdAt` | `DateTime` | `NOT NULL, DEFAULT now()` | Timestamp of creation |
| `updatedAt` | `DateTime` | `NOT NULL, @updatedAt` | Timestamp of last modification |

---

### `Project`
Stores project workspaces containing tasks and memberships. Projects are archived rather than physically deleted.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | `@id @default(uuid())` | Unique project identifier |
| `key` | `String` | `NOT NULL, UNIQUE` | Short uppercase project key (e.g., `APOLLO`) |
| `name` | `String` | `NOT NULL` | Display name of the project |
| `description` | `String?` | `NULLABLE` | Detailed project description |
| `ownerId` | `String` (UUID) | `NOT NULL, FK -> User.id (Restrict)` | Project owner (must be a MANAGER) |
| `archived` | `Boolean` | `NOT NULL, DEFAULT false` | Soft archive flag |
| `createdAt` | `DateTime` | `NOT NULL, DEFAULT now()` | Timestamp of creation |
| `updatedAt` | `DateTime` | `NOT NULL, @updatedAt` | Timestamp of last modification |

- **Indexes:** `@@index([ownerId])`, `@@index([archived])`

---

### `ProjectMember`
Explicit join table modeling many-to-many assignment of users to projects.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | `@id @default(uuid())` | Unique membership identifier |
| `userId` | `String` (UUID) | `NOT NULL, FK -> User.id (Cascade)` | Assigned user |
| `projectId` | `String` (UUID) | `NOT NULL, FK -> Project.id (Cascade)` | Assigned project |
| `joinedAt` | `DateTime` | `NOT NULL, DEFAULT now()` | Timestamp when user joined project |

- **Unique Constraints:** `@@unique([userId, projectId])`
- **Indexes:** `@@index([userId])`, `@@index([projectId])`

---

### `Task`
Core work item entity. Implements soft deletion (`deletedAt`) to preserve immutable audit trails and timeline history.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | `@id @default(uuid())` | Unique task identifier |
| `projectId` | `String` (UUID) | `NOT NULL, FK -> Project.id (Restrict)` | Parent project (restricted from accidental cascade) |
| `title` | `String` | `NOT NULL` | Short title / summary |
| `description` | `String?` | `NULLABLE` | Detailed Markdown / plain text description |
| `priority` | `Enum (Priority)` | `NOT NULL, DEFAULT 'MEDIUM'` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `status` | `Enum (Status)` | `NOT NULL, DEFAULT 'BACKLOG'` | `BACKLOG`, `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`, `DONE` |
| `previousStatus` | `Enum (Status)?` | `NULLABLE` | Remembers previous state when moved to `BLOCKED` (`IN_PROGRESS` or `IN_REVIEW`) |
| `dueDate` | `DateTime?` | `NULLABLE` | Target completion date |
| `deletedAt` | `DateTime?` | `NULLABLE` | Soft deletion timestamp (null when active) |
| `creatorId` | `String` (UUID) | `NOT NULL, FK -> User.id (Restrict)` | Creator of the task |
| `createdAt` | `DateTime` | `NOT NULL, DEFAULT now()` | Timestamp of creation |
| `updatedAt` | `DateTime` | `NOT NULL, @updatedAt` | Timestamp of last modification |

- **Indexes:** `@@index([projectId])`, `@@index([status])`, `@@index([priority])`, `@@index([dueDate])`, `@@index([updatedAt])`, `@@index([deletedAt])`, `@@index([creatorId])`

---

### `TaskAssignee`
Explicit join table modeling many-to-many assignments of users to tasks.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | `@id @default(uuid())` | Unique assignment identifier |
| `taskId` | `String` (UUID) | `NOT NULL, FK -> Task.id (Cascade)` | Assigned task |
| `userId` | `String` (UUID) | `NOT NULL, FK -> User.id (Cascade)` | Assigned user |
| `assignedAt` | `DateTime` | `NOT NULL, DEFAULT now()` | Timestamp when assigned |

- **Unique Constraints:** `@@unique([taskId, userId])`
- **Indexes:** `@@index([taskId])`, `@@index([userId])`

---

### `TaskDependency`
Self-referencing relationship representing blocking task relationships within a project.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | `@id @default(uuid())` | Unique dependency identifier |
| `taskId` | `String` (UUID) | `NOT NULL, FK -> Task.id (Cascade)` | The blocked / dependent task |
| `blockingTaskId` | `String` (UUID) | `NOT NULL, FK -> Task.id (Cascade)` | The task that blocks progress |
| `createdAt` | `DateTime` | `NOT NULL, DEFAULT now()` | Timestamp when dependency was linked |

- **Unique Constraints:** `@@unique([taskId, blockingTaskId])`
- **Indexes:** `@@index([taskId])`, `@@index([blockingTaskId])`

---

### `TaskHistory`
Append-only immutable audit log for every change made to a task. Foreign keys use `Restrict` / `SetNull` to guarantee history can never be wiped out.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | `@id @default(uuid())` | Unique audit record identifier |
| `taskId` | `String` (UUID) | `NOT NULL, FK -> Task.id (Restrict)` | Target task (protected from deletion) |
| `userId` | `String?` (UUID) | `NULLABLE, FK -> User.id (SetNull)` | Actor who made the change |
| `action` | `String` | `NOT NULL` | Event type (`CREATED`, `STATUS_CHANGE`, `FIELD_UPDATE`, etc.) |
| `field` | `String?` | `NULLABLE` | Changed field name (`status`, `priority`, `dueDate`, etc.) |
| `oldValue` | `String?` | `NULLABLE` | Previous value formatted as string |
| `newValue` | `String?` | `NULLABLE` | New value formatted as string |
| `createdAt` | `DateTime` | `NOT NULL, DEFAULT now()` | Timestamp of the event |

- **Indexes:** `@@index([taskId])`, `@@index([createdAt])`

---

### `Comment`
Immutable timeline comments on tasks. Protected with `Restrict` foreign keys.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | `@id @default(uuid())` | Unique comment identifier |
| `taskId` | `String` (UUID) | `NOT NULL, FK -> Task.id (Restrict)` | Target task (protected from deletion) |
| `userId` | `String` (UUID) | `NOT NULL, FK -> User.id (Restrict)` | Author of the comment |
| `content` | `String` | `NOT NULL` | Comment body text |
| `createdAt` | `DateTime` | `NOT NULL, DEFAULT now()` | Timestamp when posted |

- **Indexes:** `@@index([taskId])`

---

### `AlertDismissal`
Tracks overdue alert dismissals per user per task with automatic invalidation on due date change.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` (UUID) | `@id @default(uuid())` | Unique dismissal identifier |
| `taskId` | `String` (UUID) | `NOT NULL, FK -> Task.id (Cascade)` | Target overdue task |
| `userId` | `String` (UUID) | `NOT NULL, FK -> User.id (Cascade)` | User who dismissed the alert |
| `dismissedDueDate` | `DateTime?` | `NULLABLE` | Snapshot of `task.dueDate` at the time of dismissal |
| `dismissedAt` | `DateTime` | `NOT NULL, DEFAULT now()` | Timestamp when dismissed |

- **Unique Constraints:** `@@unique([taskId, userId])`
- **Indexes:** `@@index([taskId])`, `@@index([userId])`

---

## 2. Relationships

- **One-to-Many:**
  - `User` (1) ↔ `Project` (many, as owner)
  - `User` (1) ↔ `Task` (many, as creator)
  - `Project` (1) ↔ `Task` (many, onDelete: Restrict)
  - `Task` (1) ↔ `TaskHistory` (many, onDelete: Restrict)
  - `Task` (1) ↔ `Comment` (many, onDelete: Restrict)
  - `User` (1) ↔ `Comment` (many, onDelete: Restrict)
- **Many-to-Many (Explicit Join Tables):**
  - `User` ↔ `Project` via `ProjectMember`
  - `User` ↔ `Task` via `TaskAssignee`
  - `Task` ↔ `Task` via `TaskDependency` (self-referential)
  - `User` ↔ `Task` via `AlertDismissal`

---

## 3. Database vs Application-Level Constraints

### Database-Enforced Constraints:
- **Uniqueness:** `User.email`, `Project.key`, `[ProjectMember.userId, ProjectMember.projectId]`, `[TaskAssignee.taskId, TaskAssignee.userId]`, `[TaskDependency.taskId, TaskDependency.blockingTaskId]`, `[AlertDismissal.taskId, AlertDismissal.userId]`.
- **Foreign Key Integrity:** Cascading deletions only on ephemeral join rows (`TaskAssignee`, `TaskDependency`, `AlertDismissal`, `ProjectMember`); `Restrict` on `Project → Task`, `Task → TaskHistory`, `Task → Comment`, and `User → Comment` to prevent accidental deletion of immutable records and project work items.
- **Enum Validity:** PostgreSQL `ENUM` types for `Role`, `Priority`, `Status`.

### Application-Enforced Constraints:
1. **Task Soft Deletion Policy:** The DELETE task endpoint marks `deletedAt = new Date()` rather than performing a physical SQL `DELETE`. All task listings and queries filter `WHERE deletedAt IS NULL` by default.
2. **Intra-Project Dependency Enforcement:** A blocking task must belong to the exact same `projectId` as the blocked task. Enforced at API layer during dependency creation.
3. **State Machine Transition Rules:** Enforcing valid status flow (`Backlog → In Progress → In Review → Done`, `Blocked` from `In Progress`/`In Review`, and returning to `previousStatus` on unblock).
4. **Blocking Completion Gate:** Rejecting transition to `DONE` if any blocking task in `TaskDependency` is not in `DONE` status.
5. **Project Membership Assignment Gate:** Only users with an active `ProjectMember` record on the task's project can be assigned to `TaskAssignee`.
6. **Role-Based Authorization:** Managers only for project creation/archiving/membership changes and task deletion.
7. **Alert Invalidation Logic:** Comparing `AlertDismissal.dismissedDueDate == Task.dueDate`. If the due date was updated, the dismissal record is ignored and the alert resurfaces automatically.

---

## 4. Deliberate Denormalization & Design Decisions

- **`Task.deletedAt` Soft Deletion:** Preserves task history, audit trails, and comments perpetually even when a task is deleted by a manager.
- **`Task.previousStatus`:** Stored directly on `Task` rather than querying the latest `TaskHistory` row to resolve unblock transitions. This avoids expensive history joins during hot-path status updates.
- **`AlertDismissal.dismissedDueDate`:** Stores the exact `dueDate` at dismissal time. This allows checking active alerts with a simple, single indexed SQL join without needing complex audit log traversal or triggers.
- **`TaskHistory` String Fields (`oldValue`, `newValue`):** Kept as generic strings/JSON to support unified polymorphic history tracking without separate tables for each field type.

---

## 5. Scalability Analysis: What Would Break First at 100x Data?

1. **Task List Filtering & Search:**
   - At millions of tasks, `ILIKE '%query%'` across `title` and `description` will become a bottleneck.
   - *Mitigation:* Add PostgreSQL Full-Text Search (`tsvector` index and `websearch_to_tsquery`) or Trigram indexes (`pg_trgm`).
2. **Task History Growth:**
   - Append-only audit logs grow linearly with every user edit.
   - *Mitigation:* Partition `TaskHistory` by range (`createdAt` monthly/yearly) or offload historical archives.
3. **Complex Dependency Cycle Detection:**
   - Multi-hop dependency checks currently use recursive CTEs or depth-first searches.
   - *Mitigation:* Cache dependency paths or limit maximum dependency chain depth per project.
