const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const app = require('../app');
const prisma = require('../prisma');

let server;
let baseUrl;

async function runTests() {
  console.log('=== Starting Backend Bulk Operations & CSV Export Tests ===\n');

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

    const apollo = await prisma.project.findUnique({ where: { key: 'APOLLO' } });
    const elena = await prisma.user.findUnique({ where: { email: 'elena.rostova@busyinfotech.com' } });

    // 1. Create Task A (IN_PROGRESS), Task B (IN_PROGRESS), Task C (BLOCKED)
    const createResA = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({ projectId: apollo.id, title: 'Bulk Test Task A', status: 'IN_PROGRESS' })
    });
    const taskA = (await createResA.json()).task;

    const createResB = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({ projectId: apollo.id, title: 'Bulk Test Task B', status: 'IN_PROGRESS' })
    });
    const taskB = (await createResB.json()).task;

    const createResC = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({ projectId: apollo.id, title: 'Bulk Test Task C', status: 'BLOCKED' })
    });
    const taskC = (await createResC.json()).task;

    // 2. Run Bulk Status Transition to IN_REVIEW (A & B valid, C invalid)
    const bulkStatusRes = await fetch(`${baseUrl}/api/tasks/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({
        taskIds: [taskA.id, taskB.id, taskC.id],
        action: 'status',
        status: 'IN_REVIEW'
      })
    });
    const bulkStatusData = await bulkStatusRes.json();

    const resA = bulkStatusData.results.find((r) => r.taskId === taskA.id);
    const resB = bulkStatusData.results.find((r) => r.taskId === taskB.id);
    const resC = bulkStatusData.results.find((r) => r.taskId === taskC.id);

    assert(
      bulkStatusRes.status === 200 &&
      bulkStatusData.summary.total === 3 &&
      bulkStatusData.summary.successful === 2 &&
      bulkStatusData.summary.failed === 1 &&
      resA.success === true &&
      resB.success === true &&
      resC.success === false &&
      resC.reason.includes('Task is BLOCKED and can only be unblocked'),
      '1. Bulk status update achieves partial success (Tasks A & B succeed, Task C rejected with clear reason)'
    );

    // 3. Verify Database state: A and B are updated, C remains untouched
    const dbA = await prisma.task.findUnique({ where: { id: taskA.id } });
    const dbB = await prisma.task.findUnique({ where: { id: taskB.id } });
    const dbC = await prisma.task.findUnique({ where: { id: taskC.id } });

    assert(
      dbA.status === 'IN_REVIEW' &&
      dbB.status === 'IN_REVIEW' &&
      dbC.status === 'BLOCKED',
      '2. Database reflects committed changes for successful tasks and unchanged state for rejected tasks'
    );

    // 4. Verify TaskHistory created for successful transitions
    const historyA = await prisma.taskHistory.findMany({
      where: { taskId: taskA.id, action: 'STATUS_CHANGE' }
    });
    const historyB = await prisma.taskHistory.findMany({
      where: { taskId: taskB.id, action: 'STATUS_CHANGE' }
    });
    const historyC = await prisma.taskHistory.findMany({
      where: { taskId: taskC.id, action: 'STATUS_CHANGE' }
    });

    assert(
      historyA.length === 1 && historyA[0].newValue === 'IN_REVIEW' &&
      historyB.length === 1 && historyB[0].newValue === 'IN_REVIEW' &&
      historyC.length === 0,
      '3. Immutable TaskHistory audit logs created for each successful bulk item and none for rejected item'
    );

    // 5. Bulk Due Date update
    const newDueDate = '2026-11-20T00:00:00.000Z';
    const bulkDueRes = await fetch(`${baseUrl}/api/tasks/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({
        taskIds: [taskA.id, taskB.id],
        action: 'dueDate',
        dueDate: newDueDate
      })
    });
    const bulkDueData = await bulkDueRes.json();

    assert(
      bulkDueRes.status === 200 &&
      bulkDueData.summary.successful === 2,
      '4. Bulk due date update applies new due date to selected tasks'
    );

    // 6. Bulk Assignee update
    const bulkAssignRes = await fetch(`${baseUrl}/api/tasks/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({
        taskIds: [taskA.id, taskB.id],
        action: 'assignees',
        assigneeIds: [elena.id]
      })
    });
    const bulkAssignData = await bulkAssignRes.json();

    assert(
      bulkAssignRes.status === 200 &&
      bulkAssignData.summary.successful === 2,
      '5. Bulk assignee update applies project members to selected tasks'
    );

    // 7. CSV Export endpoint with filter (project=APOLLO)
    const csvRes = await fetch(`${baseUrl}/api/tasks/export/csv?project=APOLLO`, {
      headers: { Cookie: `token=${managerToken}` }
    });
    const csvContent = await csvRes.text();

    assert(
      csvRes.status === 200 &&
      csvRes.headers.get('content-type').includes('text/csv') &&
      csvContent.startsWith('Task ID,Project Key,Project Name,Title') &&
      csvContent.includes('APOLLO') &&
      !csvContent.includes('NEXUS'),
      '6. CSV export returns valid formatted CSV adhering to active filters'
    );

    // Cleanup created test tasks
    await prisma.taskAssignee.deleteMany({ where: { taskId: { in: [taskA.id, taskB.id, taskC.id] } } });
    await prisma.taskHistory.deleteMany({ where: { taskId: { in: [taskA.id, taskB.id, taskC.id] } } });
    await prisma.task.deleteMany({ where: { id: { in: [taskA.id, taskB.id, taskC.id] } } });

  } catch (err) {
    console.error('Bulk/CSV test error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }

  console.log(`\n=== Bulk & CSV Test Summary: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
