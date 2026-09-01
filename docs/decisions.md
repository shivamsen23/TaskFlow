# Technical Decisions

A summary of the key technical decisions made during the development of TaskFlow.

## Decision 1: React + Vite for Frontend

**Chose:** React with Vite.

**Why:** It offers a fast development workflow, quick build times, and makes building a responsive single-page application straightforward.

## Decision 2: Node.js + Express for Backend

**Chose:** Node.js with Express.

**Why:** It is lightweight, flexible, and allows for clean modular routing, controllers, and middleware across REST endpoints.

## Decision 3: PostgreSQL with Supabase

**Chose:** PostgreSQL hosted on Supabase.

**Why:** It provides a reliable relational database with strong data integrity, constraints, and easy cloud hosting.

## Decision 4: Prisma as ORM

**Chose:** Prisma ORM.

**Why:** It simplifies database queries, provides type safety, and handles schema migrations cleanly as requirements evolve.

## Decision 5: JWT Authentication

**Chose:** JSON Web Tokens (JWT) for user authentication.

**Why:** It is stateless, standard, and securely stores the user identity and role for subsequent API requests.

## Decision 6: HttpOnly Cookie for JWT

**Chose:** Storing the JWT inside an HttpOnly cookie.

**Why:** It protects authentication tokens from client-side JavaScript access and reduces the risk of XSS attacks.

## Decision 7: MANAGER and MEMBER Roles

**Chose:** A role-based model with MANAGER and MEMBER roles.

**Why:** It keeps permissions simple, allowing managers full administrative control while restricting members to their assigned projects.

## Decision 8: Backend Authorization

**Chose:** Enforcing all permission checks on the server.

**Why:** Relying only on frontend UI hiding is not secure, so the backend verifies project access and role permissions on every request.

## Decision 9: Explicit Project and Task Relationships

**Chose:** Explicit join models for project members, task assignees, and task dependencies.

**Why:** It keeps relationships clear and lets us easily track additional metadata like joined dates and assignment history.

## Decision 10: Task Status Workflow

**Chose:** A strict server-validated status progression (Backlog → In Progress → In Review → Done, with Blocked).

**Why:** It ensures tasks move through an orderly lifecycle and prevents illegal status jumps across the board.

## Decision 11: Task Dependencies

**Chose:** Validating blocking dependencies on the backend before completing a task.

**Why:** It prevents a task from being marked as Done when its prerequisite tasks are still unfinished.

## Decision 12: Server-Side Search, Filters, and Pagination

**Chose:** Performing search, filtering, sorting, and pagination in PostgreSQL via Prisma.

**Why:** It keeps frontend performance fast and ensures that large task lists are queried efficiently on the server.

## Decision 13: Task History and Comments

**Chose:** Append-only history records and comments.

**Why:** It creates an audit trail of changes that cannot be modified or deleted after the fact.

## Decision 14: Vercel + Render + Supabase Deployment

**Chose:** Deploying the frontend on Vercel, the backend on Render, and the database on Supabase.

**Why:** It separates concerns across specialized hosting platforms that are easy to deploy, configure, and maintain.
