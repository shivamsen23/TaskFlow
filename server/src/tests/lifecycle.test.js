const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const app = require('../app');
const prisma = require('../prisma');

let server;
let baseUrl;

async function runTests() {
  console.log('=== Starting Backend Task Lifecycle & Dependency Rules Tests ===\n');

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

    // 1. Create fresh task in BACKLOG for testing lifecycle transitions
    const createTaskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({
        projectId: apollo.id,
        title: 'Lifecycle State Machine Test Task',
        status: 'BACKLOG'
      })
    });
    const taskData = await createTaskRes.json();
    const taskId = taskData.task.id;

    // 2. Reject illegal jump: BACKLOG -> DONE
    const illegalJumpDoneRes = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({ status: 'DONE' })
    });
    const illegalJumpDoneData = await illegalJumpDoneRes.json();

    assert(
      illegalJumpDoneRes.status === 400 &&
      illegalJumpDoneData.error.includes('Cannot transition task directly from BACKLOG to DONE'),
      '1. Illegal transition BACKLOG -> DONE is rejected with 400'
    );

    // 3. Reject illegal jump: BACKLOG -> IN_REVIEW
    const illegalJumpReviewRes = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({ status: 'IN_REVIEW' })
    });
    assert(
      illegalJumpReviewRes.status === 400,
      '2. Illegal transition BACKLOG -> IN_REVIEW is rejected with 400'
    );

    // 4. Reject illegal jump: BACKLOG -> BLOCKED
    const illegalBlockRes = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({ status: 'BLOCKED' })
    });
    assert(
      illegalBlockRes.status === 400,
      '3. Illegal transition BACKLOG -> BLOCKED is rejected with 400'
    );

    // Verify DB unchanged after rejected transitions
    const dbTask1 = await prisma.task.findUnique({ where: { id: taskId } });
    assert(
      dbTask1.status === 'BACKLOG',
      '4. Rejected transitions leave database task status unchanged in BACKLOG'
    );

    // 5. Valid transition: BACKLOG -> IN_PROGRESS
    const toInProgressRes = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });
    const toInProgressData = await toInProgressRes.json();

    assert(
      toInProgressRes.status === 200 &&
      toInProgressData.task.status === 'IN_PROGRESS',
      '5. Valid transition BACKLOG -> IN_PROGRESS succeeds (200 OK)'
    );

    // 6. Reject illegal jump: IN_PROGRESS -> DONE
    const inProgressToDoneRes = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({ status: 'DONE' })
    });
    assert(
      inProgressToDoneRes.status === 400,
      '6. Illegal transition IN_PROGRESS -> DONE is rejected with 400'
    );

    // 7. Blocking from IN_PROGRESS: IN_PROGRESS -> BLOCKED
    const blockRes = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({ status: 'BLOCKED' })
    });
    const blockData = await blockRes.json();
    const dbBlockedTask = await prisma.task.findUnique({ where: { id: taskId } });

    assert(
      blockRes.status === 200 &&
      blockData.task.status === 'BLOCKED' &&
      dbBlockedTask.previousStatus === 'IN_PROGRESS',
      '7. Blocking from IN_PROGRESS stores previousStatus = "IN_PROGRESS"'
    );

    // 8. Unblocking from BLOCKED -> returns to IN_PROGRESS
    const unblockRes = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });
    const unblockData = await unblockRes.json();

    assert(
      unblockRes.status === 200 &&
      unblockData.task.status === 'IN_PROGRESS',
      '8. Unblocking restores task status back to IN_PROGRESS'
    );

    // 9. Valid transition: IN_PROGRESS -> IN_REVIEW
    const toReviewRes = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({ status: 'IN_REVIEW' })
    });
    assert(
      toReviewRes.status === 200,
      '9. Valid transition IN_PROGRESS -> IN_REVIEW succeeds'
    );

    // 10. Blocking from IN_REVIEW -> BLOCKED and unblocking back to IN_REVIEW
    await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({ status: 'BLOCKED' })
    });
    const dbBlockedFromReview = await prisma.task.findUnique({ where: { id: taskId } });

    const unblockToReviewRes = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({ status: 'IN_REVIEW' })
    });

    assert(
      dbBlockedFromReview.previousStatus === 'IN_REVIEW' &&
      unblockToReviewRes.status === 200,
      '10. Blocking from IN_REVIEW stores previousStatus = "IN_REVIEW" and restores to IN_REVIEW'
    );

    // 11. Test Blocking Dependency Rule on DONE
    // Create a blocker task that is in IN_PROGRESS
    const blockerTaskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({
        projectId: apollo.id,
        title: 'Prerequisite Infrastructure Task',
        status: 'IN_PROGRESS'
      })
    });
    const blockerTaskData = await blockerTaskRes.json();
    const blockerTaskId = blockerTaskData.task.id;

    // Attach blocker dependency to main task
    await fetch(`${baseUrl}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({
        blockingTaskIds: [blockerTaskId]
      })
    });

    // Try to move main task from IN_REVIEW -> DONE while blocker is unfinished
    const tryDoneRes = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({ status: 'DONE' })
    });
    const tryDoneData = await tryDoneRes.json();

    assert(
      tryDoneRes.status === 400 &&
      tryDoneData.error.includes('because blocking task(s) "Prerequisite Infrastructure Task" [IN_PROGRESS] are not finished'),
      '11. Unfinished blocking dependency blocks transition to DONE with clear explanation'
    );

    // 12. Complete the blocker task and verify main task can now move to DONE
    // Move blocker from IN_PROGRESS -> IN_REVIEW -> DONE
    await fetch(`${baseUrl}/api/tasks/${blockerTaskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({ status: 'IN_REVIEW' })
    });
    await fetch(`${baseUrl}/api/tasks/${blockerTaskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({ status: 'DONE' })
    });

    // Now move main task to DONE
    const allowDoneRes = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({ status: 'DONE' })
    });
    const allowDoneData = await allowDoneRes.json();

    assert(
      allowDoneRes.status === 200 &&
      allowDoneData.task.status === 'DONE',
      '12. Completed blocking dependency allows transition to DONE'
    );

    // 13. Reopening a DONE task (DONE -> IN_PROGRESS)
    const reopenRes = await fetch(`${baseUrl}/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${managerToken}` },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });
    const reopenData = await reopenRes.json();

    assert(
      reopenRes.status === 200 &&
      reopenData.task.status === 'IN_PROGRESS',
      '13. Reopening a DONE task transitions it back to IN_PROGRESS'
    );

    // 14. Verify TaskHistory recorded every status transition
    const historyEntries = await prisma.taskHistory.findMany({
      where: {
        taskId,
        action: 'STATUS_CHANGE'
      },
      orderBy: { createdAt: 'asc' }
    });

    assert(
      historyEntries.length >= 6 &&
      historyEntries[0].oldValue === 'BACKLOG' &&
      historyEntries[0].newValue === 'IN_PROGRESS',
      '14. Immutable TaskHistory audit log records all status changes with oldValue and newValue'
    );

    // Cleanup created test tasks
    await prisma.taskDependency.deleteMany({ where: { taskId } });
    await prisma.taskHistory.deleteMany({ where: { taskId: { in: [taskId, blockerTaskId] } } });
    await prisma.task.deleteMany({ where: { id: { in: [taskId, blockerTaskId] } } });

  } catch (err) {
    console.error('Lifecycle test error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }

  console.log(`\n=== Lifecycle Test Summary: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
