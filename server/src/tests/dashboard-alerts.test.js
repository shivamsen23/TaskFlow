const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const app = require('../app');
const prisma = require('../prisma');

let server;
let baseUrl;

async function runTests() {
  console.log('=== Starting Backend Dashboard & Overdue Alerts Tests ===\n');

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
      body: JSON.stringify({ email: 'sarah.chen@busyinfotech.com', password: 'Password123!' })
    });
    const managerCookie = managerLoginRes.headers.get('set-cookie');
    const managerToken = managerCookie?.match(/token=([^;]+)/)[1];

    // Authenticate Elena (Member of Apollo and Titan, NOT Nexus)
    const elenaLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'elena.rostova@busyinfotech.com', password: 'Password123!' })
    });
    const elenaCookie = elenaLoginRes.headers.get('set-cookie');
    const elenaToken = elenaCookie?.match(/token=([^;]+)/)[1];

    // Authenticate David Kim (Member of Nexus, NOT Apollo)
    const davidLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'david.kim@busyinfotech.com', password: 'Password123!' })
    });
    const davidCookie = davidLoginRes.headers.get('set-cookie');
    const davidToken = davidCookie?.match(/token=([^;]+)/)[1];

    const apollo = await prisma.project.findUnique({ where: { key: 'APOLLO' } });
    const elena = await prisma.user.findUnique({ where: { email: 'elena.rostova@busyinfotech.com' } });

    // 1. Test GET /api/dashboard for manager
    const dashRes = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Cookie: `token=${managerToken}` }
    });
    const dashData = await dashRes.json();

    assert(
      dashRes.status === 200 &&
      typeof dashData.metrics.openTasks === 'number' &&
      typeof dashData.metrics.overdueTasks === 'number' &&
      Array.isArray(dashData.statusBreakdown) &&
      dashData.statusBreakdown.length === 5 &&
      Array.isArray(dashData.completionTrend) &&
      dashData.completionTrend.length === 8,
      '1. GET /api/dashboard returns server-calculated metrics, status breakdowns, and 8-week completion trend'
    );

    // 2. Test Dashboard project visibility for member (Elena)
    const elenaDashRes = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Cookie: `token=${elenaToken}` }
    });
    const elenaDashData = await elenaDashRes.json();

    assert(
      elenaDashRes.status === 200 &&
      elenaDashData.metrics.openTasks <= dashData.metrics.openTasks,
      '2. Dashboard strictly respects logged-in user project visibility for regular members'
    );

    // 3. Create overdue task assigned to Elena in Apollo
    const pastDueDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days ago
    const createOverdueRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({
        projectId: apollo.id,
        title: 'Overdue Alert Test Task',
        status: 'IN_PROGRESS',
        dueDate: pastDueDate,
        assigneeIds: [elena.id]
      })
    });
    const overdueTask = (await createOverdueRes.json()).task;

    // 4. Overdue task appears in GET /api/alerts
    const alertsRes1 = await fetch(`${baseUrl}/api/alerts`, {
      headers: { Cookie: `token=${elenaToken}` }
    });
    const alertsData1 = await alertsRes1.json();

    const foundAlert = alertsData1.alerts.find((a) => a.id === overdueTask.id);

    assert(
      alertsRes1.status === 200 &&
      foundAlert &&
      foundAlert.isDismissed === false &&
      foundAlert.isAssignedToUser === true,
      '3. Overdue task with past due date appears in GET /api/alerts as active alert'
    );

    // 5. Unassigned member (David Kim) cannot dismiss Elena's task alert (403 Forbidden)
    const unauthorizedDismissRes = await fetch(`${baseUrl}/api/alerts/${overdueTask.id}/dismiss`, {
      method: 'POST',
      headers: { Cookie: `token=${davidToken}` }
    });

    assert(
      unauthorizedDismissRes.status === 403,
      '4. Unassigned member cannot dismiss alert for a task they are not assigned to (403 Forbidden)'
    );

    // 6. Assigned member (Elena) can dismiss alert (200 OK)
    const dismissRes = await fetch(`${baseUrl}/api/alerts/${overdueTask.id}/dismiss`, {
      method: 'POST',
      headers: { Cookie: `token=${elenaToken}` }
    });
    const dismissData = await dismissRes.json();

    assert(
      dismissRes.status === 200 &&
      dismissData.taskId === overdueTask.id,
      '5. Assigned member successfully dismisses alert for their task'
    );

    // 7. Dismissed alert remains dismissed while due date is unchanged
    const alertsRes2 = await fetch(`${baseUrl}/api/alerts`, {
      headers: { Cookie: `token=${elenaToken}` }
    });
    const alertsData2 = await alertsRes2.json();
    const dismissedAlert = alertsData2.alerts.find((a) => a.id === overdueTask.id);

    assert(
      dismissedAlert &&
      dismissedAlert.isDismissed === true,
      '6. Dismissed alert remains dismissed while task due date is unchanged'
    );

    // 8. Changing the task due date causes the alert to automatically become active again!
    const newPastDueDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days ago
    await fetch(`${baseUrl}/api/tasks/${overdueTask.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({
        dueDate: newPastDueDate
      })
    });

    const alertsRes3 = await fetch(`${baseUrl}/api/alerts`, {
      headers: { Cookie: `token=${elenaToken}` }
    });
    const alertsData3 = await alertsRes3.json();
    const resurfacedAlert = alertsData3.alerts.find((a) => a.id === overdueTask.id);

    assert(
      resurfacedAlert &&
      resurfacedAlert.isDismissed === false,
      '7. Changing task due date invalidates previous dismissal and causes alert to reappear active'
    );

    // 9. Completed (DONE) overdue task does not appear in alerts
    // Move overdueTask from IN_PROGRESS -> IN_REVIEW -> DONE
    await fetch(`${baseUrl}/api/tasks/${overdueTask.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({ status: 'IN_REVIEW' })
    });
    await fetch(`${baseUrl}/api/tasks/${overdueTask.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({ status: 'DONE' })
    });

    const alertsRes4 = await fetch(`${baseUrl}/api/alerts`, {
      headers: { Cookie: `token=${elenaToken}` }
    });
    const alertsData4 = await alertsRes4.json();
    const completedTaskInAlerts = alertsData4.alerts.find((a) => a.id === overdueTask.id);

    assert(
      completedTaskInAlerts === undefined,
      '8. Completed (DONE) task no longer appears in overdue alerts'
    );

    // Cleanup created test task and dismissals
    await prisma.alertDismissal.deleteMany({ where: { taskId: overdueTask.id } });
    await prisma.taskAssignee.deleteMany({ where: { taskId: overdueTask.id } });
    await prisma.taskHistory.deleteMany({ where: { taskId: overdueTask.id } });
    await prisma.task.deleteMany({ where: { id: overdueTask.id } });

  } catch (err) {
    console.error('Dashboard/Alerts test error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }

  console.log(`\n=== Dashboard & Alerts Test Summary: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
