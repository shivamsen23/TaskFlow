# Submission

Fill this in and commit it. This is the first file we open.

## Links

- **GitHub repository:** <public repo URL>
- **Live application:** <deployed URL>

## Notes for the reviewer

<Anything we should know before opening the link — e.g. your host sleeps when idle and the first
request can take up to a minute.>

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| MANAGER | sarah.chen@busyinfotech.com | Password123! |
| MEMBER | elena.rostova@busyinfotech.com | Password123! |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React + Vite + React Router | Lean, high-performance SPA setup with fast development loop and clear client-side routing |
| Backend | Node.js + Express | Minimal, explicit route-controller-service pattern with centralized error handling |
| Database | PostgreSQL + Prisma ORM | Relational integrity, strongly-typed migrations, and explicit join models |
| Hosting | TBD (Supabase/Render/Vercel) | Reliable free-tier deployment targets |

## Goal checklist

Mark each honestly. Partial is fine — say what is partial.

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles | Done | JWT via HttpOnly cookies, bcrypt hashing, server-enforced role authorization middleware |
| 2 | Projects | Done | Manager CRUD, key, owner, archive/restore without data destruction, member isolation |
| 3 | Tasks inside projects | Done | Project-scoped task CRUD, priority, due dates, dependencies, assignees, manager soft deletion |
| 4 | A task lifecycle with rules | Done | Server-enforced state machine, BLOCKED exact state restoration via previousStatus, blocking dependency completion validation, reopening |
| 5 | Assignment | Done | Project member assignment constraint, multi-assignees, unassign on member removal, history tracking, "Assigned to Me" query |
| 6 | Finding things | Done | PostgreSQL server-side title/description search, project/status/assignee/priority/overdue filters, sorting, and pagination |
| 7 | Acting on many tasks at once | Done | Multi-task bulk status/assignee/due-date actions with partial success and per-task error reporting; server-side filtered CSV export |
| 8 | Understanding the state of work | Done | Server-calculated headline metrics, 8-week completion trend, status breakdown, assignee workload chart with Recharts |
| 9 | History you cannot rewrite | Done | Append-only TaskHistory and Comment entities, unified chronological timeline, no update/delete endpoints, old/new value tracking |
| 10 | Tasks that need attention | Done | Overdue alerts query, navbar counter badge, assigned-member dismissal, and automatic resurfacing if due date changes |

## How much time did you actually spend?

Around 7.5 hours total, executed in deliberate, test-verified increments:
- Initial project scaffolding & database schema with relations & seed: ~1.5h
- Authentication, roles, and project management: ~1.5h
- Task CRUD, assignments, and lifecycle state machine: ~1.5h
- Server-side search/filtering/pagination and bulk actions with CSV export: ~1.5h
- Immutable history/comments, dashboard metrics/charts, and overdue alerts: ~1.5h

## What would you do next, with another 12 hours?

1. **Real-time Collaboration via WebSockets / SSE**: Push status updates, comment additions, and alert triggers in real time across connected team members.
2. **File Attachments**: Integrate S3 / cloud storage upload signed URLs to attach design files or logs directly to tasks and comments.
3. **Email / Slack Webhook Notifications**: Trigger notification pings when a task is assigned to someone or when an overdue deadline is approaching.
4. **Enhanced Dependency Graph UI**: Render an interactive DAG (Directed Acyclic Graph) visualization of blocking task dependencies using ReactFlow.

## What are you least happy with in this codebase, and why?

While the direct sequential iteration for bulk operations (`bulkUpdateTasks`) guarantees per-task isolation and atomic history creation with clear partial-success reporting, for very large batch sizes (>500 items) doing individual database roundtrips could be further optimized by pipelining or using batched multi-row update queries with server-side rollback savesets. For this project's scale, the readability, transactional safety, and business-rule reuse provide the best balance.
