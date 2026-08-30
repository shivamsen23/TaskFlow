# Decisions

## Decision 1: Project Structure and Script Management

- **Chose:** Standard two-folder layout (`client/` and `server/`) with root orchestration scripts in root `package.json`.
- **Rejected:** Monorepo frameworks (Lerna, Turborepo, Nx, npm workspaces).
- **Why:** For an application of this scope, heavy monorepo tooling introduces unnecessary config overhead, build complexity, and cognitive load. Simple npm scripts provide fast, clear developer workflows without extra dependencies.

## Decision 2: Frontend Tooling and Routing

- **Chose:** React initialized with Vite and React Router (`react-router-dom`).
- **Rejected:** Next.js / Create React App.
- **Why:** Vite provides instantaneous hot module reloading, fast build times, and zero-boilerplate configuration. React Router offers straightforward client-side routing matching the SPA requirements.

## Decision 3: Backend Framework and Layering

- **Chose:** Node.js with Express, configured with clean modular middleware (CORS, JSON parsing, 404 handler, centralized error handler).
- **Rejected:** NestJS or heavy enterprise frameworks with dependency injection and repository wrappers.
- **Why:** A straightforward `route → controller → service` pattern using Prisma directly inside services provides the right balance of clarity, maintainability, and readability without over-engineering.

## Decision 4: Environment Variable Strategy

- **Chose:** Single clear `.env.example` in root with local loading in `server/src/server.js` and `.gitignore` safety.
- **Rejected:** Hardcoded configuration or committed `.env` files.
- **Why:** Keeps secrets strictly out of version control while making it effortless for new developers or evaluators to set up local environments.

## Decision 5: Language and Module System Selection

- **Chose:** JavaScript (Node.js CommonJS for server, ES Modules for client).
- **Rejected:** TypeScript.
- **Why:** JavaScript provides maximum agility and simplicity for the take-home requirements without compilation overhead or overly complex typing boilerplate, aligned with the explicit instruction to avoid unnecessary complexity.
