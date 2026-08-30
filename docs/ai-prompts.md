# AI Prompts

Prompts used during development of TaskFlow.

These prompts were used to guide Antigravity feature-by-feature during development.
For each prompt, Antigravity should first inspect the existing code and then make only the required changes.

## 1. Project Setup

```text
Set up the basic TaskFlow frontend and backend using the existing project structure.

Add the basic React pages, routing, Express setup, and health check.

Keep it simple and don't change unrelated code.
```

## 2. Database

```text
Add the required database models and relationships using the existing Prisma setup.

Use PostgreSQL/Supabase and add the required migrations and seed data.

Don't change unrelated parts of the project.
```

## 3. Authentication

```text
Add login, logout, and authentication for users.

Use JWT with an HttpOnly cookie and support MANAGER and MEMBER roles.

Protect the required backend routes.
```

## 4. Projects

```text
Add project management.

Managers should be able to create, edit, archive, restore, and manage project members.

Members should only access their projects.
```

## 5. Tasks

```text
Add task management.

Support creating, editing, deleting, assigning, and viewing tasks.

Include priority, status, due date, assignees, and dependencies.
```

## 6. Task Workflow

```text
Implement the required task status workflow.

Prevent a task from being completed when a blocking dependency is unfinished.

Validate the rules on the backend and record status changes.
```

## 7. Search and Filters

```text
Add task search, filters, sorting, and pagination.

Support filtering by project, status, priority, assignee, and overdue tasks.

Keep the filtering server-side.
```

## 8. Bulk Actions and CSV

```text
Add bulk task actions for status, assignee, and due date.

Also add CSV export for the filtered task list.
```

## 9. History and Comments

```text
Add task history and comments.

Record important task changes such as status, assignment, and field updates.

Keep history read-only and allow users to add comments.
```

## 10. Dashboard and Alerts

```text
Add the dashboard and overdue alerts.

Show useful task statistics and overdue tasks.

Allow users to dismiss their alerts and reactivate an alert when the task changes again.
```

## Final Check

```text
Review the current project and fix any important bugs or missing requirements.

Run the relevant tests and make sure the frontend and backend build correctly.

Don't rewrite working code or change the UI unnecessarily.
```

## Deployment

```text
Check the production API configuration.

The frontend is on Vercel, the backend is on Render, and the database is on Supabase.

Make sure the frontend uses VITE_API_URL and the production API works correctly.
```
