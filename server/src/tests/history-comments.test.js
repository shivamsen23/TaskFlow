const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const app = require('../app');
const prisma = require('../prisma');

let server;
let baseUrl;

async function runTests() {
  console.log('=== Starting Backend Immutable Task History & Comments Tests ===\n');

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

    // Authenticate Elena (Member)
    const memberLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'elena.rostova@busyinfotech.com', password: 'Password123!' })
    });
    const memberCookie = memberLoginRes.headers.get('set-cookie');
    const memberToken = memberCookie?.match(/token=([^;]+)/)[1];

    const apollo = await prisma.project.findUnique({ where: { key: 'APOLLO' } });
    const elena = await prisma.user.findUnique({ where: { email: 'elena.rostova@busyinfotech.com' } });

    // 1. Task Creation creates history record with CREATED action
    const createRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({
        projectId: apollo.id,
        title: 'Immutable History Verification Task',
        description: 'Initial task description',
        priority: 'LOW',
        status: 'BACKLOG'
      })
    });
    const task = (await createRes.json()).task;
    const taskId = task.id;

    const createdHistory = await prisma.taskHistory.findFirst({
      where: { taskId, action: 'CREATED' }
    });

    assert(
      createdHistory !== null &&
      createdHistory.userId !== null &&
      createdHistory.createdAt instanceof Date,
      '1. Task creation automatically generates immutable CREATED history record'
    );

    // 2. Status change creates STATUS_CHANGE history record with oldValue & newValue
    await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });

    const statusHistory = await prisma.taskHistory.findFirst({
      where: { taskId, action: 'STATUS_CHANGE' }
    });

    assert(
      statusHistory !== null &&
      statusHistory.field === 'status' &&
      statusHistory.oldValue === 'BACKLOG' &&
      statusHistory.newValue === 'IN_PROGRESS',
      '2. Status change creates STATUS_CHANGE history record recording previous and new states'
    );

    // 3. Field updates (title, priority, due date) create FIELD_UPDATE history records with old & new values
    const newDueDate = '2026-12-01T00:00:00.000Z';
    await fetch(`${baseUrl}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({
        title: 'Updated Task Title for Audit Test',
        priority: 'URGENT',
        dueDate: newDueDate
      })
    });

    const fieldHistories = await prisma.taskHistory.findMany({
      where: { taskId, action: 'FIELD_UPDATE' }
    });

    const titleUpdate = fieldHistories.find((h) => h.field === 'title');
    const priorityUpdate = fieldHistories.find((h) => h.field === 'priority');
    const dueUpdate = fieldHistories.find((h) => h.field === 'dueDate');

    assert(
      titleUpdate && titleUpdate.oldValue === 'Immutable History Verification Task' && titleUpdate.newValue === 'Updated Task Title for Audit Test' &&
      priorityUpdate && priorityUpdate.oldValue === 'LOW' && priorityUpdate.newValue === 'URGENT' &&
      dueUpdate && dueUpdate.newValue !== null,
      '3. Field modifications record individual FIELD_UPDATE history records with old and new values'
    );

    // 4. Assignment creates ASSIGNED history record with assignee name
    await fetch(`${baseUrl}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({
        assigneeIds: [elena.id]
      })
    });

    const assignHistory = await prisma.taskHistory.findFirst({
      where: { taskId, action: 'ASSIGNED' }
    });

    assert(
      assignHistory !== null &&
      assignHistory.field === 'assignee' &&
      assignHistory.newValue === 'Elena Rostova',
      '4. Assigning a team member records ASSIGNED history record'
    );

    // 5. Unassignment creates UNASSIGNED history record with removed member name
    await fetch(`${baseUrl}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({
        assigneeIds: []
      })
    });

    const unassignHistory = await prisma.taskHistory.findFirst({
      where: { taskId, action: 'UNASSIGNED' }
    });

    assert(
      unassignHistory !== null &&
      unassignHistory.field === 'assignee' &&
      unassignHistory.oldValue === 'Elena Rostova',
      '5. Unassigning a team member records UNASSIGNED history record'
    );

    // 6. Comments API: POST /api/tasks/:id/comments creates Comment and integrates into task timeline
    const commentRes = await fetch(`${baseUrl}/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${memberToken}` },
      body: JSON.stringify({
        content: 'Reviewing implementation and dependencies now.'
      })
    });
    const commentData = await commentRes.json();

    const taskWithTimelineRes = await fetch(`${baseUrl}/api/tasks/${taskId}`, {
      headers: { Cookie: `token=${managerToken}` }
    });
    const taskWithTimeline = (await taskWithTimelineRes.json()).task;

    const hasCommentInTimeline = taskWithTimeline.timeline.some(
      (item) => item.type === 'COMMENT' && item.content.includes('Reviewing implementation')
    );

    assert(
      commentRes.status === 201 &&
      commentData.comment.content === 'Reviewing implementation and dependencies now.' &&
      hasCommentInTimeline,
      '6. Adding a comment creates a database Comment and integrates into the chronological timeline'
    );

    // 7. Verify History Update endpoint does NOT exist (404)
    const updateHistoryRes = await fetch(`${baseUrl}/api/tasks/${taskId}/histories/${createdHistory.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({ action: 'MODIFIED' })
    });

    assert(
      updateHistoryRes.status === 404,
      '7. History records cannot be edited (no update history endpoint exists - 404)'
    );

    // 8. Verify History Delete endpoint does NOT exist (404)
    const deleteHistoryRes = await fetch(`${baseUrl}/api/tasks/${taskId}/histories/${createdHistory.id}`, {
      method: 'DELETE',
      headers: { Cookie: `token=${managerToken}` }
    });

    assert(
      deleteHistoryRes.status === 404,
      '8. History records cannot be deleted (no delete history endpoint exists - 404)'
    );

    // Cleanup created test task
    await prisma.comment.deleteMany({ where: { taskId } });
    await prisma.taskAssignee.deleteMany({ where: { taskId } });
    await prisma.taskHistory.deleteMany({ where: { taskId } });
    await prisma.task.deleteMany({ where: { id: taskId } });

  } catch (err) {
    console.error('History/Comments test error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }

  console.log(`\n=== History & Comments Test Summary: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
