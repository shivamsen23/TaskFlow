const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const app = require('../app');
const prisma = require('../prisma');

let server;
let baseUrl;

async function runTests() {
  console.log('=== Starting Backend Tasks & Assignments Tests ===\n');

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
    // Authenticate Sarah (Manager - member of Apollo & Titan)
    const managerLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.chen@busyinfotech.com', password: 'Password123!' })
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

    // Get Projects for tests
    const apollo = await prisma.project.findUnique({ where: { key: 'APOLLO' }, include: { members: true } });
    const nexus = await prisma.project.findUnique({ where: { key: 'NEXUS' }, include: { members: true } });

    // Users
    const elena = await prisma.user.findUnique({ where: { email: 'elena.rostova@busyinfotech.com' } });
    const marcus = await prisma.user.findUnique({ where: { email: 'marcus.johnson@busyinfotech.com' } });
    const david = await prisma.user.findUnique({ where: { email: 'david.kim@busyinfotech.com' } }); // Nexus member, NOT Apollo

    // 1. Task must belong to project (creation fails without projectId)
    const noProjectRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({
        title: 'Task without project'
      })
    });
    const noProjectData = await noProjectRes.json();

    assert(
      noProjectRes.status === 400 &&
      noProjectData.error.includes('projectId is required'),
      '1. Task creation requires a valid projectId'
    );

    // 2. Non-member cannot be assigned to project task (David Kim is not in Apollo)
    const invalidAssigneeRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({
        projectId: apollo.id,
        title: 'Apollo Security Review',
        assigneeIds: [david.id] // David is not in Apollo
      })
    });
    const invalidAssigneeData = await invalidAssigneeRes.json();

    assert(
      invalidAssigneeRes.status === 400 &&
      invalidAssigneeData.error.includes('only project members may be assigned'),
      '2. Non-member cannot be assigned to project task (Server rejects with 400)'
    );

    // 3. Multiple valid assignees work (Elena and Marcus are both Apollo members)
    const createValidTaskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({
        projectId: apollo.id,
        title: 'Apollo Core Integration Tests',
        description: 'End to end testing suite for Apollo components',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        assigneeIds: [elena.id, marcus.id]
      })
    });
    const createValidTaskData = await createValidTaskRes.json();

    assert(
      createValidTaskRes.status === 201 &&
      createValidTaskData.task &&
      createValidTaskData.task.assignees.length === 2 &&
      createValidTaskData.task.assignees.some((a) => a.userId === elena.id) &&
      createValidTaskData.task.assignees.some((a) => a.userId === marcus.id),
      '3. Task successfully created with multiple valid project assignees'
    );

    const testTaskId = createValidTaskData.task.id;

    // 4. Dependency must belong to the same project (try to block Apollo task with Nexus task)
    const nexusTask = await prisma.task.findFirst({ where: { projectId: nexus.id, deletedAt: null } });

    const invalidDepRes = await fetch(`${baseUrl}/api/tasks/${testTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({
        blockingTaskIds: [nexusTask.id]
      })
    });
    const invalidDepData = await invalidDepRes.json();

    assert(
      invalidDepRes.status === 400 &&
      invalidDepData.error.includes('same project'),
      '4. Cross-project blocking task dependency is rejected with 400'
    );

    // 5. Assignment changes create TaskHistory records (ASSIGNED & UNASSIGNED)
    // Update task to only assign Elena (remove Marcus, keep Elena)
    const updateAssigneeRes = await fetch(`${baseUrl}/api/tasks/${testTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({
        assigneeIds: [elena.id]
      })
    });
    const updateAssigneeData = await updateAssigneeRes.json();

    // Check TaskHistory for unassignment of Marcus
    const unassignHistory = await prisma.taskHistory.findFirst({
      where: {
        taskId: testTaskId,
        action: 'UNASSIGNED',
        field: 'assignee',
        oldValue: marcus.name
      }
    });

    assert(
      updateAssigneeRes.status === 200 &&
      updateAssigneeData.task.assignees.length === 1 &&
      unassignHistory !== null,
      '5. Updating assignees unassigns user and records immutable TaskHistory entry'
    );

    // 6. Member cannot delete task
    const memberDeleteRes = await fetch(`${baseUrl}/api/tasks/${testTaskId}`, {
      method: 'DELETE',
      headers: {
        Cookie: `token=${memberToken}`
      }
    });
    const memberDeleteData = await memberDeleteRes.json();

    assert(
      memberDeleteRes.status === 403 &&
      memberDeleteData.error.includes('Manager role required'),
      '6. Member cannot delete a task (403 Forbidden)'
    );

    // 7. Manager can delete task (soft delete)
    const managerDeleteRes = await fetch(`${baseUrl}/api/tasks/${testTaskId}`, {
      method: 'DELETE',
      headers: {
        Cookie: `token=${managerToken}`
      }
    });
    const managerDeleteData = await managerDeleteRes.json();

    // Verify task is soft deleted in database
    const dbDeletedTask = await prisma.task.findUnique({
      where: { id: testTaskId }
    });

    // Verify deletion history
    const deleteHistory = await prisma.taskHistory.findFirst({
      where: {
        taskId: testTaskId,
        action: 'DELETED'
      }
    });

    assert(
      managerDeleteRes.status === 200 &&
      dbDeletedTask.deletedAt !== null &&
      deleteHistory !== null,
      '7. Manager can delete task (soft deleted with timestamp and DELETED history audit record)'
    );

  } catch (err) {
    console.error('Tasks test error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }

  console.log(`\n=== Tasks Test Summary: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
