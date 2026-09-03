# Submission

## Project Overview

- **Application Name:** TaskFlow
- **Assignment:** Assignment 01 — Project & Task Tracking
- **Live Application:** https://task-flow-sigma-drab.vercel.app/
- **Backend API:** https://taskflow-pw0i.onrender.com/
- **Health Check:** https://taskflow-pw0i.onrender.com/api/health
- **GitHub Repository:** https://github.com/shivamsen23/TaskFlow

## Note for the Reviewer

The backend is hosted on Render's free tier. If the app has been idle, the first request might take 30–60 seconds while the server wakes up. Once running, it responds normally.

## Demo Login Credentials

All accounts use the password: `Password123!`

| Role | Name | Email | Password | Access |
|---|---|---|---|---|
| MANAGER | Shivam Sen | shivam.sen@busyinfotech.com | Password123! | All Projects |
| MANAGER | Rahul Sharma | rahul.sharma@busyinfotech.com | Password123! | All Projects (Nexus Owner) |
| MEMBER | Elena Rostova | elena.rostova@busyinfotech.com | Password123! | Apollo & Titan |
| MEMBER | Arjun Mehta | arjun.mehta@busyinfotech.com | Password123! | Nexus |
| MEMBER | Priya Patel | priya.patel@busyinfotech.com | Password123! | Nexus & Titan |
| MEMBER | Marcus Johnson | marcus.johnson@busyinfotech.com | Password123! | Apollo |

*(The login page also has quick-fill buttons for fast testing.)*

## Tech Stack

| Layer | Technology | Why I Used It |
|---|---|---|
| Frontend | React + Vite + React Router | Simple SPA setup with fast local builds and clean client routing. |
| Backend | Node.js + Express | Easy to structure with clear routes, controllers, and middleware. |
| Database | PostgreSQL (Supabase) + Prisma | Reliable relational database with simple schema management and type-safe queries. |
| Hosting | Vercel (Frontend) + Render (Backend) | Free and easy platforms for deploying separated frontend and backend apps. |

## Deployment & Setup

```text
React Frontend (Vercel)
       ↓
Express Backend (Render)
       ↓
PostgreSQL Database (Supabase)
```

### Environment Variables

- **Backend (Render):**
  - `DATABASE_URL` — Connection string for PostgreSQL on Supabase.
  - `JWT_SECRET` — Secret key for signing login tokens.
  - `JWT_EXPIRES_IN` — Token expiration time (e.g., `7d`).
  - `CLIENT_URL` — Frontend URL allowed for CORS and cookie credentials.
  - `PORT` — Server port (set automatically by Render).

- **Frontend (Vercel):**
  - `VITE_API_URL` — Production backend URL (`https://taskflow-pw0i.onrender.com`).
  - `/api` requests are also proxied via `vercel.json` to keep cookies working smoothly across domains.

## Goal Checklist

| # | Goal | Status | Summary |
|---|---|---|---|
| 1 | Accounts and roles | Complete | Added email/password login with JWT in HttpOnly cookies, supporting MANAGER and MEMBER roles. |
| 2 | Projects | Complete | Managers can create, edit, and archive projects, while members only see projects they belong to. |
| 3 | Tasks inside projects | Complete | Tasks belong to one project, support priorities, due dates, multiple assignees, and dependencies. |
| 4 | Task lifecycle with rules | Complete | Enforced the status flow (`Backlog → In Progress → In Review → Done`) and blocked tasks with unfinished dependencies. |
| 5 | Assignment | Complete | Only project members can be assigned to tasks, and users have a dedicated "My Tasks" view. |
| 6 | Finding things | Complete | Server-side text search, filtering by status/priority/assignee/overdue, sorting, and pagination. |
| 7 | Acting on many tasks at once | Complete | Bulk status, assignee, and due date updates with per-task error reporting, plus filtered CSV export. |
| 8 | Dashboard | Complete | Overview cards, status breakdown, assignee workload chart, and 8-week completion trend. |
| 9 | History you cannot rewrite | Complete | Append-only task history and comments showing who made each change and what changed. |
| 10 | Overdue alerts | Complete | Lists overdue tasks, lets assigned users dismiss alerts, and reactivates alerts if due dates change. |

## Testing & Build Results

- **Backend Tests:** Ran `cd server && npm test` — **68 passed, 0 failed** across all 8 test suites.
- **Frontend Build:** Ran `cd client && npm run build` — **Built successfully** with zero errors.

## Development Time

- **Core Feature Development:** Around **12–14 hours** of focused coding over 2 days.
- **Testing, Fixes & Deployment:** Spent another **3–4 days** part-time setting up hosting on Render/Vercel/Supabase, fixing cookie issues, running tests, and writing documentation.

## What I Would Improve Next

1. **Real-Time Updates:** Add WebSockets or Server-Sent Events so team members see task updates and new comments instantly without refreshing.
2. **File Attachments:** Allow users to upload attachments (images, PDFs) directly to tasks and comments.
3. **Email Notifications:** Send email alerts when someone is assigned a new task or when a due date is approaching.

## One Limitation I Would Improve

For bulk updates, the backend currently loops through tasks individually to validate rules and write history entries one by one. This works well and keeps error reporting simple for normal batch sizes, but for very large batches, batching the database writes would be more efficient.
