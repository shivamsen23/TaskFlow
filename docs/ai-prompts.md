# AI prompts

The prompts used during development, grouped by phase and objective.

## Phase 1 — Project Initialization

### Prompt

```text
PHASE 1 — PROJECT INITIALIZATION

You are helping me build the BUSY Infotech take-home assignment.

FIRST, read and understand:
- README.md
- SUBMISSION.md
- docs/architecture.md
- docs/schema.md
- docs/plan.md
- docs/decisions.md
- docs/ai-prompts.md

Do not start coding until you understand the assignment requirements.

==================================================
IMPORTANT DEVELOPMENT PRINCIPLES
==================================================
... (development principles adhering to simplicity, correctness, and maintainability) ...

==================================================
TECHNOLOGY STACK
==================================================
Frontend: React, Vite, React Router
Backend: Node.js, Express
Database: PostgreSQL
ORM: Prisma
Language: JavaScript

==================================================
PHASE 1 SCOPE
==================================================
This phase is ONLY about project initialization.
Do NOT implement auth, JWT, users/roles, projects, tasks, task dependencies, dashboard, reports, alerts, comments, history, CSV export, bulk actions.

==================================================
PROJECT STRUCTURE
==================================================
busy-task-manager/
├── client/
├── server/
├── prisma/
├── docs/
│   ├── architecture.md
│   ├── schema.md
│   ├── plan.md
│   ├── decisions.md
│   └── ai-prompts.md
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── SUBMISSION.md

==================================================
FRONTEND SETUP
==================================================
Inside client:
- Initialize React using Vite.
- Configure React Router.
- Create a clean basic application structure.
- Create a basic Login page placeholder.
- Create a basic protected application layout placeholder.
- Create a simple Dashboard placeholder.
Do NOT build the final UI yet.
Do NOT add fake business data.
Make sure the frontend can start successfully.

==================================================
BACKEND SETUP
==================================================
Inside server:
Initialize Node.js + Express.
Create server/src/app.js and server/src/server.js.
Implement GET /api/health returning {"status": "ok"}.
Use environment variable for PORT, CORS configuration, JSON body parsing, basic centralized error middleware.

==================================================
ENVIRONMENT CONFIGURATION
==================================================
Create .env.example with PORT=5000, DATABASE_URL=, JWT_SECRET=, JWT_EXPIRES_IN=, CLIENT_URL=.
Ensure .env and node_modules are gitignored.

==================================================
FINAL VERIFICATION
==================================================
Start backend, verify GET /api/health, start frontend, verify React app loads, check console errors, imports, gitignore, and clean structure.
```

### What you got
- Clean project structure with `client/`, `server/`, `prisma/`, `docs/`, `.env.example`, `.gitignore`, `package.json`, `README.md`, `SUBMISSION.md`.
- Express backend initialized with CORS, JSON body parsing, centralized error handling, and `GET /api/health` endpoint.
- React frontend initialized with Vite, React Router, placeholder Login page, AppLayout, and Dashboard page.
- Root scripts for running/building both frontend and backend.
- Updated documentation across `docs/`.

### What you corrected
- Verified that no premature schema or business logic was introduced into Phase 1.
- Ensured `.env` remains strictly ignored in version control.
