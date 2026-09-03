# Plan

## Development Phases

### Phase 1: Project Setup
- Set up React/Vite frontend and Node/Express backend.
- Add basic routing, API structure, and project configuration.

### Phase 2: Database
- Create the required Prisma models and relationships.
- Set up PostgreSQL, migrations, and seed data.

### Phase 3: Authentication
- Add login, logout, JWT authentication, and user sessions.
- Add MANAGER and MEMBER permissions.

### Phase 4: Projects
- Add project creation and management.
- Add project members and manager/member access rules.

### Phase 5: Tasks
- Add task creation, editing, assignment, and deletion.
- Add priorities, due dates, assignees, and dependencies.

### Phase 6: Task Workflow
- Add the required task status flow.
- Prevent invalid status changes and unfinished blocking dependencies.

### Phase 7: Search and Filters
- Add task search, filters, sorting, and pagination.
- Keep the main filtering work on the backend.

### Phase 8: Bulk Actions and CSV
- Add bulk task updates.
- Add CSV export for the task list.

### Phase 9: History and Comments
- Add task history and comments.
- Keep important task changes available as a record.

### Phase 10: Dashboard and Alerts
- Add dashboard statistics and charts.
- Add overdue task alerts and dismissal.

## Development Time

| Work | Approx. Time |
|---|---:|
| Project setup and database | 2–3 hours |
| Authentication and projects | 2–3 hours |
| Tasks and workflow | 3–4 hours |
| Search, bulk actions and CSV | 2 hours |
| History, dashboard and alerts | 2 hours |
| **Total development** | **12–14 hours** |

> Development was completed over about 2 days, followed by another 3–4 days for testing, fixing issues, documentation, and deployment.

## Build Order

> The project was built step by step, starting with the basic setup and database, then authentication, projects, tasks, and finally the dashboard and alerts.

## Testing and Deployment

- Tested the main backend features during development.
- Fixed issues found during local and production testing.
- Deployed the frontend on Vercel, backend on Render, and PostgreSQL database on Supabase.
