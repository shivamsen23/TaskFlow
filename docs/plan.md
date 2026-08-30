# Plan

## Work Breakdown & Sessions

The work is planned across incremental, verifiable phases:

### Phase 1: Project Initialization (Completed)
- Environment configuration (`.env.example`, `.gitignore`)
- Backend setup (Node.js, Express, `/api/health`, CORS, JSON body parser, centralized error handler)
- Frontend setup (React + Vite, React Router, basic layout, placeholder routes)
- Base directory structure and package configurations

### Phase 2: Database Schema & Migrations (Upcoming)
- PostgreSQL database design with Prisma schema
- Models, relations, indexes, and initial migrations

### Phase 3: Authentication & Authorization (Upcoming)
- JWT-based authentication, password hashing with bcrypt
- Role-based authorization middleware (Manager vs Member)

### Phase 4: Core Project & Task Management (Upcoming)
- Project CRUD and membership management
- Task lifecycle state machine and dependency validation

### Phase 5: Search, Filtering, Bulk Actions & History (Upcoming)
- Server-side task search/filters/pagination
- Bulk updates with individual failure reporting, immutable history/audit trail, CSV export

### Phase 6: Dashboard, Overdue Alerts & Polish (Upcoming)
- Dashboard metrics and charts, overdue alerts with badge and dismissal logic

---

## Build Order Rationale
Phase 1 focuses entirely on standing up a lean, robust skeleton for both client and server before adding any business logic or persistence layer. This ensures environment consistency, clean boundaries, and verified communication between client and server upfront.

## Estimates vs Actuals
- **Phase 1 (Initialization & Scaffolding):** Estimated ~0.5h, Actual ~0.5h.

## Scope Adjustments
- Strictly kept Phase 1 free of business logic, premature database schema, and mock data as per specification.
