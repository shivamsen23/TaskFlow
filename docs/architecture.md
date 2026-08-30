# Architecture

## Current Moving Pieces (Phase 1)

At Phase 1 initialization, the system consists of:

1. **Client (Single-Page Application)**
   - Built with React and bundled via Vite.
   - Uses React Router for client-side navigation (`/login`, `/`).
   - Serves as the user interface layer.
   - Communicates with the backend API via HTTP requests (proxied locally in Vite via `/api`).

2. **Server (REST API)**
   - Built with Node.js and Express.
   - Structured around clean middleware: CORS handling, JSON body parsing, route routing, and centralized error handling.
   - Exposes a health verification endpoint at `GET /api/health`.

## Where Each Piece Runs

- **Client:** Runs in the user's browser (served locally by Vite development server at `http://localhost:5173`).
- **Server:** Runs in a Node.js process listening on the configured `PORT` (defaults to `5000` via `http://localhost:5000`).

## Request Path (Representative: Health Check)

1. Client sends `GET /api/health` to `http://localhost:5000/api/health` (or via Vite proxy).
2. Express server receives the request through CORS middleware and JSON body parser.
3. Express matches the route `app.get('/api/health')` in `server/src/app.js`.
4. Handler responds with HTTP 200 and `{ "status": "ok" }`.
5. If an unhandled route is requested, it falls through to the 404 middleware.
6. If an uncaught error occurs, the centralized error middleware catches it and responds with the appropriate status and error JSON.

## What Was Deliberately Not Built (Phase 1)

- **Authentication & JWT Middleware:** Deferred to dedicated auth phase to ensure solid separation of concerns.
- **Database Connection / ORM Models:** Deferred until Phase 2 to design the schema thoughtfully against the full requirements.
- **Complex Monorepo Tooling / Dependency Injection / Repositories:** Kept simple with standard npm scripts and straightforward `route → controller → service` pattern without heavy enterprise overhead.
