# Schema

## Overview

TaskFlow uses PostgreSQL hosted on Supabase.

Prisma is used as the ORM between the Express backend and PostgreSQL.

The main models are:
- User
- Project
- ProjectMember
- Task
- TaskAssignee
- TaskDependency
- TaskHistory
- Comment
- AlertDismissal

## Main Models

### User

Stores application users.

Important fields:
- id
- name
- email
- passwordHash
- role

Roles are MANAGER and MEMBER.

### Project

Stores project information.

Important fields:
- id
- key
- name
- description
- owner
- archived

Projects are archived instead of being permanently deleted.

### ProjectMember

Connects users with projects.

A project can have many members and a user can belong to many projects.

### Task

Stores the main task information.

Important fields:
- id
- project
- title
- description
- priority
- status
- dueDate
- creator
- previousStatus
- deletedAt

Priorities:
LOW, MEDIUM, HIGH, URGENT

Statuses:
BACKLOG, IN_PROGRESS, IN_REVIEW, BLOCKED, DONE

Tasks use soft deletion so task history can still be kept.

### TaskAssignee

Connects users with tasks.

A task can have multiple assignees.

Only members of the task's project can be assigned.

### TaskDependency

Stores blocking relationships between tasks.

Example:

```text
Task A
  ↓ depends on
Task B
```

Task A cannot be completed while Task B is unfinished.

Dependencies are limited to tasks inside the same project.

### TaskHistory

Stores important changes made to a task.

Examples:
- task created
- status changed
- priority changed
- assignee added or removed
- task details updated

History is kept as a record and is not edited or deleted.

### Comment

Stores comments added to tasks.

Comments are shown together with task history in the activity timeline.

### AlertDismissal

Stores when a user dismisses an overdue task alert.

The due date at the time of dismissal is also stored.

If the task due date changes later, the alert can become active again.

## Relationships

```text
User
 ├── owns Projects
 ├── joins Projects through ProjectMember
 ├── is assigned to Tasks through TaskAssignee
 └── creates Tasks and Comments

Project
 └── contains Tasks

Task
 ├── has Assignees
 ├── can depend on other Tasks
 ├── has History
 ├── has Comments
 └── can have Alert Dismissals
```

## Important Database Rules

- User email must be unique.
- Project key must be unique.
- The same user cannot be added to the same project twice.
- The same user cannot be assigned to the same task twice.
- Task dependencies cannot be duplicated.
- Prisma migrations are used to manage schema changes.

## Application Rules

Some rules are checked by the backend instead of only by the database:

- Only project members can be assigned to project tasks.
- Blocking tasks must belong to the same project.
- Task status changes must follow the required workflow.
- A task cannot be marked DONE while a blocking task is unfinished.
- Managers have additional project/task permissions.
- Deleted tasks use soft deletion.

## Database Flow

```text
React Frontend
      ↓
Express Backend
      ↓
Prisma
      ↓
PostgreSQL
      ↓
Supabase
```

## Production Database

- **Production database:** PostgreSQL hosted on Supabase
- **Schema changes:** Managed using Prisma migrations
- **Seed/demo data:** Managed using `prisma/seed.js`
