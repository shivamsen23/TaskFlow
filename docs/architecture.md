# Architecture

## Current Moving Pieces (Phase 3)

1. **Client (Single-Page Application)**
   - Built with React and bundled via Vite.
   - Uses React Router for client-side navigation (`/login`, `/`).
   - `AuthContext` provides global authentication state (`user`, `loading`, `login`, `logout`).
   - `ProtectedRoute` guards authenticated routes from unauthenticated access.
   - All authenticated API requests use `credentials: 'include'` to pass HttpOnly session cookies.

2. **Server (REST API)**
   - Built with Node.js and Express using a clean `route → controller → service` pattern.
   - `authenticate` middleware parses JWT from HttpOnly cookies (or Authorization header) and validates the user in PostgreSQL.
   - `requireManager` middleware enforces role-based access control (Manager role vs Member role) on the server.
   - Exposes modular routes under `/api/auth` (`/login`, `/logout`, `/me`, `/manager-only-test`) and `/api/users`.

3. **Database (PostgreSQL via Prisma ORM)**
   - Normalized relational data model with indexed foreign keys, soft deletion, and immutable history tables.

## Where Each Piece Runs

- **Client:** Runs in the user's browser (served locally by Vite development server at `http://localhost:5173`).
- **Server:** Runs in a Node.js process listening on the configured `PORT` (defaults to `5000` via `http://localhost:5000`).
- **Database:** PostgreSQL server on port `5434` (local dev) or managed instance.

## Request Path (Representative: User Login & Role Authorization Flow)

### 1. User Login Flow
1. User enters email and password into the React `LoginPage` and submits.
2. React client sends `POST /api/auth/login` with `{ email, password }` and `credentials: 'include'`.
3. Express server routes request to `auth.controller.js` $\rightarrow$ `auth.service.js`.
4. `auth.service.js` looks up user by normalized email in PostgreSQL via Prisma.
5. Password is verified against `passwordHash` using `bcryptjs.compare`.
6. Server signs a JWT with `{ userId, email, role }` using `JWT_SECRET`.
7. `auth.controller.js` sets a secure `HttpOnly` cookie named `token` and responds with HTTP 200 and sanitized `{ user }` JSON.
8. `AuthContext` updates React state, and `ProtectedRoute` permits navigation to the dashboard.

### 2. Authenticated & Authorized API Request Flow
1. Client makes a request (e.g. `GET /api/auth/manager-only-test`) with `credentials: 'include'`.
2. Browser automatically sends the `token` HttpOnly cookie.
3. `authenticate` middleware extracts the cookie, verifies the JWT signature, and queries PostgreSQL for user existence and active status.
4. `requireManager` middleware verifies `req.user.role === 'MANAGER'`:
   - If user is a `MEMBER`, server immediately halts and returns **HTTP 403 Forbidden** (`{ "error": "Access denied: Manager role required" }`).
   - If user is a `MANAGER`, server calls `next()`.
5. Controller processes the request and sends the response.

## What Was Deliberately Not Built

- **Complex Session Stores (Redis / Server-side Sessions):** Stateless JWTs in HttpOnly cookies provide high performance, zero cache dependency, and tamper-proof security without external state management.
- **Client-Side Token Storage (localStorage):** LocalStorage is vulnerable to XSS token theft; HttpOnly cookies guarantee tokens cannot be accessed by browser JavaScript.
- **Excessive Abstraction Layers:** Prisma is used directly inside services without redundant repository wrappers.
