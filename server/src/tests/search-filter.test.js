const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const app = require('../app');
const prisma = require('../prisma');

let server;
let baseUrl;

async function runTests() {
  console.log('=== Starting Backend Task Search, Filtering, Sorting & Pagination Tests ===\n');

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // Authenticate Sarah (Manager)
    const managerLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'shivam.sen@busyinfotech.com', password: 'Password123!' })
    });
    const managerCookie = managerLoginRes.headers.get('set-cookie');
    const managerToken = managerCookie?.match(/token=([^;]+)/)[1];

    // Authenticate Elena (Member - member of Apollo & Titan, NOT Nexus)
    const memberLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'elena.rostova@busyinfotech.com', password: 'Password123!' })
    });
    const memberCookie = memberLoginRes.headers.get('set-cookie');
    const memberToken = memberCookie?.match(/token=([^;]+)/)[1];

    const apollo = await prisma.project.findUnique({ where: { key: 'APOLLO' } });
    const nexus = await prisma.project.findUnique({ where: { key: 'NEXUS' } });
    const elena = await prisma.user.findUnique({ where: { email: 'elena.rostova@busyinfotech.com' } });

    // 1. Pagination: Request page 1 with limit 3
    const pagedRes = await fetch(`${baseUrl}/api/tasks?page=1&limit=3`, {
      headers: { Cookie: `token=${managerToken}` }
    });
    const pagedData = await pagedRes.json();

    assert(
      pagedRes.status === 200 &&
      Array.isArray(pagedData.data) &&
      pagedData.data.length === 3 &&
      pagedData.pagination.page === 1 &&
      pagedData.pagination.limit === 3 &&
      pagedData.pagination.total >= 8 &&
      pagedData.pagination.totalPages >= 3,
      '1. Pagination returns exactly requested page size with total count and totalPages'
    );

    // 2. Text Search across Title & Description
    const searchRes = await fetch(`${baseUrl}/api/tasks?search=authentication`, {
      headers: { Cookie: `token=${managerToken}` }
    });
    const searchData = await searchRes.json();

    const allMatchSearch = searchData.data.every((t) =>
      t.title.toLowerCase().includes('authentication') ||
      (t.description && t.description.toLowerCase().includes('authentication'))
    );

    assert(
      searchRes.status === 200 &&
      searchData.data.length > 0 &&
      allMatchSearch,
      '2. Text search correctly filters by title and description matching query'
    );

    // 3. Project Filter by ID & Key
    const projFilterRes = await fetch(`${baseUrl}/api/tasks?project=APOLLO`, {
      headers: { Cookie: `token=${managerToken}` }
    });
    const projFilterData = await projFilterRes.json();

    const allApollo = projFilterData.data.every((t) => t.project.key === 'APOLLO');

    assert(
      projFilterRes.status === 200 &&
      projFilterData.data.length > 0 &&
      allApollo,
      '3. Project filter restricts results strictly to target project key/ID'
    );

    // 4. Status Filter (IN_PROGRESS)
    const statusFilterRes = await fetch(`${baseUrl}/api/tasks?status=IN_PROGRESS`, {
      headers: { Cookie: `token=${managerToken}` }
    });
    const statusFilterData = await statusFilterRes.json();

    const allInProgress = statusFilterData.data.every((t) => t.status === 'IN_PROGRESS');

    assert(
      statusFilterRes.status === 200 &&
      statusFilterData.data.length > 0 &&
      allInProgress,
      '4. Status filter returns only tasks in requested status'
    );

    // 5. Priority Filter (URGENT)
    const priorityFilterRes = await fetch(`${baseUrl}/api/tasks?priority=URGENT`, {
      headers: { Cookie: `token=${managerToken}` }
    });
    const priorityFilterData = await priorityFilterRes.json();

    const allUrgent = priorityFilterData.data.every((t) => t.priority === 'URGENT');

    assert(
      priorityFilterRes.status === 200 &&
      priorityFilterData.data.length > 0 &&
      allUrgent,
      '5. Priority filter returns only tasks matching requested priority'
    );

    // 6. Assignee Filter
    const assigneeFilterRes = await fetch(`${baseUrl}/api/tasks?assignee=${elena.id}`, {
      headers: { Cookie: `token=${managerToken}` }
    });
    const assigneeFilterData = await assigneeFilterRes.json();

    const allAssignedElena = assigneeFilterData.data.every((t) =>
      t.assignees.some((a) => a.userId === elena.id)
    );

    assert(
      assigneeFilterRes.status === 200 &&
      assigneeFilterData.data.length > 0 &&
      allAssignedElena,
      '6. Assignee filter returns only tasks assigned to target user'
    );

    // 7. Overdue Filter
    const overdueRes = await fetch(`${baseUrl}/api/tasks?overdue=true`, {
      headers: { Cookie: `token=${managerToken}` }
    });
    const overdueData = await overdueRes.json();

    const now = new Date();
    const allOverdue = overdueData.data.every((t) =>
      t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    );

    assert(
      overdueRes.status === 200 &&
      overdueData.data.length > 0 &&
      allOverdue,
      '7. Overdue filter returns only tasks with past due dates that are not DONE'
    );

    // 8. Sorting: Sort by Due Date Ascending
    const sortRes = await fetch(`${baseUrl}/api/tasks?sortBy=dueDate&sortOrder=asc&limit=10`, {
      headers: { Cookie: `token=${managerToken}` }
    });
    const sortData = await sortRes.json();

    const tasksWithDue = sortData.data.filter((t) => t.dueDate !== null);
    let isAsc = true;
    for (let i = 1; i < tasksWithDue.length; i++) {
      if (new Date(tasksWithDue[i].dueDate) < new Date(tasksWithDue[i - 1].dueDate)) {
        isAsc = false;
        break;
      }
    }

    assert(
      sortRes.status === 200 &&
      isAsc,
      '8. Sorting by dueDate asc correctly orders tasks chronologically'
    );

    // 9. Member Authorization & Project Isolation: Elena requesting Nexus project
    const memberNexusRes = await fetch(`${baseUrl}/api/tasks?project=${nexus.id}`, {
      headers: { Cookie: `token=${memberToken}` }
    });
    const memberNexusData = await memberNexusRes.json();

    assert(
      memberNexusRes.status === 403 &&
      memberNexusData.error.includes('Access denied'),
      '9. Member requesting tasks for non-member project is blocked with 403 Forbidden'
    );

    // 10. Multi-filter Combination: Project + Status + Search
    const comboRes = await fetch(`${baseUrl}/api/tasks?project=APOLLO&status=IN_PROGRESS&limit=5`, {
      headers: { Cookie: `token=${managerToken}` }
    });
    const comboData = await comboRes.json();

    const allMatchCombo = comboData.data.every(
      (t) => t.project.key === 'APOLLO' && t.status === 'IN_PROGRESS'
    );

    assert(
      comboRes.status === 200 &&
      allMatchCombo,
      '10. Combined filters (project + status + limit) filter properly at database level'
    );

  } catch (err) {
    console.error('Search/Filter test error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }

  console.log(`\n=== Search & Filter Test Summary: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
