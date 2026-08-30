# Architecture

## Project Overview

TaskFlow is a web-based task management application.

It has three main parts:
- **Frontend:** React + Vite single-page application
- **Backend:** Node.js + Express REST API
- **Database:** PostgreSQL hosted on Supabase, accessed using Prisma ORM

---

## High-Level Architecture

```text
+-------------------------------------------------------+
|                   Manager / Member                    |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|             React Frontend (React + Vite)             |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|             Express REST API (Node.js)                |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|                     Prisma ORM                        |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|               PostgreSQL (Supabase)                   |
+-------------------------------------------------------+
```

The frontend sends REST requests to the backend with credentials included. The backend verifies authentication and permissions, executes business logic, and communicates with PostgreSQL through Prisma.

---

## Core User Flow

```text
[ Manager ]                           [ Member ]
     |                                    |
     v                                    v
+------------------------+           +------------------------+
| Manage Projects        |           | View Assigned Projects |
| (Create, Edit, Archive)|           +------------------------+
+------------------------+                        |
     |                                            v
     v                               +------------------------+
| Create & Assign Tasks  | --------> | Work on Tasks          |
+------------------------+           | (Update Status)        |
     |                               +------------------------+
     v                                            |
+-------------------------------------------------------------+
|        Enforce Lifecycle & Blocking Dependencies            |
|       (BACKLOG -> IN_PROGRESS -> IN_REVIEW -> DONE)         |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|               Append-Only History & Comments                |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|            Dashboard Metrics & Overdue Alerts               |
+-------------------------------------------------------------+
```

- **Managers:** Can create and edit projects, archive/restore projects, add or remove project members, assign tasks, delete tasks, and view portfolio-wide statistics.
- **Members:** Can view projects they belong to, update status on tasks assigned to them, post comments, and dismiss their own overdue alerts.

---

## Main Components

### 1. Frontend (React + Vite)
- **Routing:** Client-side routing with protected routes for authenticated users.
- **Views:** Dashboard, Projects, Project Details, Tasks, Task Details, My Tasks, Alerts, Reports, and Users.
- **State Management:** React Context manages the authenticated user session.
- **Charts:** Recharts powers the 8-week delivery velocity and status/workload charts.

### 2. Backend (Node.js + Express)
- **Structure:** Modular architecture divided into controllers, services, and routes.
- **Modules:** `auth`, `users`, `projects`, `tasks`, `dashboard`, and `alerts`.
- **Validation:** Server enforces all business rules (e.g. rejecting task completion if blocking dependencies are unfinished).
- **Queries:** Server-side search, multi-criteria filtering, sorting, pagination, and CSV export.

### 3. Database (PostgreSQL + Prisma)
- **Models:**
  - `User`: User accounts and roles (`MANAGER`, `MEMBER`).
  - `Project`: Project details, key, and ownership.
  - `ProjectMember`: Mapping between users and projects.
  - `Task`: Priority, status, due dates, and `previousStatus` (used to restore state upon unblocking).
  - `TaskAssignee`: Multi-user task assignments.
  - `TaskDependency`: Blocking task relationships.
  - `TaskHistory`: Append-only audit log tracking creation, field edits, status changes, and assignments.
  - `Comment`: User discussion timeline.
  - `AlertDismissal`: Overdue alert dismissal tracking.

---

## Authentication Flow

```text
[ Browser ]                     [ Express Backend ]
     |                                   |
     |  1. POST /api/auth/login          |
     | --------------------------------> |  Verify email & password hash (bcrypt)
     |                                   |  Generate signed JWT token
     |  2. Set-Cookie: token (HttpOnly)  |
     | <-------------------------------- |
     |                                   |
     |  3. Subsequent API Requests       |
     | --------------------------------> |  Authenticate JWT & check role
     |                                   |  (MANAGER vs MEMBER)
```

- Passwords hashed with **bcrypt**.
- JWT stored in a secure **`HttpOnly`** cookie to prevent XSS exposure.
- Server middleware enforces role restrictions on protected endpoints.

---

## Task Lifecycle & Workflow

```text
+-----------+        +-------------+        +-------------+        +--------+
|  BACKLOG  | -----> | IN_PROGRESS | -----> |  IN_REVIEW  | -----> |  DONE  |
+-----------+        +-------------+        +-------------+        +--------+
                           |                       |
                           |   Mark as Blocked     |
                           v                       v
                     +-----------------------------------+
                     |              BLOCKED              |
                     |  (Unblocking returns to previous) |
                     +-----------------------------------+
```

- Status moves sequentially: `BACKLOG → IN_PROGRESS → IN_REVIEW → DONE`.
- Tasks in `IN_PROGRESS` or `IN_REVIEW` can become `BLOCKED`. Unblocking restores the task to its exact prior state.
- A task **cannot** move to `DONE` while any blocking task dependency remains unfinished.

---

## Deployment & Environments

```text
React Frontend (Vercel)
          |
          v (API Proxy Rewrites)
Express Backend (Render)
          |
          v
PostgreSQL Database (Supabase)
```

- **Live Frontend:** https://task-flow-sigma-drab.vercel.app/
- **Live Backend:** https://taskflow-pw0i.onrender.com/
- **Health Check:** https://taskflow-pw0i.onrender.com/api/health
- **Local Development:**
  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:5000`
