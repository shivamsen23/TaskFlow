const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const app = require('../app');
const prisma = require('../prisma');

let server;
let baseUrl;

async function runTests() {
  console.log('=== Starting Backend Projects & Membership Tests ===\n');

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

    // 1. Manager creates project
    const createProjectRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({
        key: 'ZEUS',
        name: 'Project Zeus Cloud Engine',
        description: 'Next-gen cloud compute orchestration engine.'
      })
    });
    const createProjectData = await createProjectRes.json();

    assert(
      createProjectRes.status === 201 &&
      createProjectData.project &&
      createProjectData.project.key === 'ZEUS' &&
      createProjectData.project.archived === false,
      '1. Manager can create a new project (201 Created)'
    );

    const createdProjectId = createProjectData.project?.id;

    // 2. Member cannot create project
    const memberCreateRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${memberToken}`
      },
      body: JSON.stringify({
        key: 'HADES',
        name: 'Project Hades Underground',
        description: 'Unauthorized project creation attempt.'
      })
    });
    const memberCreateData = await memberCreateRes.json();

    assert(
      memberCreateRes.status === 403 &&
      memberCreateData.error === 'Access denied: Manager role required',
      '2. Member cannot create a project (403 Forbidden)'
    );

    // 3. Member only sees projects they belong to
    const memberProjectsRes = await fetch(`${baseUrl}/api/projects`, {
      headers: {
        Cookie: `token=${memberToken}`
      }
    });
    const memberProjectsData = await memberProjectsRes.json();

    const memberHasZeus = memberProjectsData.projects?.some((p) => p.key === 'ZEUS');
    const allBelong = memberProjectsData.projects?.every((p) =>
      p.members.some((m) => m.user.email === 'elena.rostova@busyinfotech.com')
    );

    assert(
      memberProjectsRes.status === 200 &&
      memberProjectsData.projects.length > 0 &&
      !memberHasZeus &&
      allBelong,
      '3. Member only sees active projects they belong to'
    );

    // 4. Member blocked from viewing non-member project
    const memberViewBlockedRes = await fetch(`${baseUrl}/api/projects/${createdProjectId}`, {
      headers: {
        Cookie: `token=${memberToken}`
      }
    });
    const memberViewBlockedData = await memberViewBlockedRes.json();

    assert(
      memberViewBlockedRes.status === 403 &&
      memberViewBlockedData.error === 'Access denied: You are not a member of this project',
      '4. Member is blocked from viewing project they do not belong to (403 Forbidden)'
    );

    // 5. Manager can archive project
    const archiveRes = await fetch(`${baseUrl}/api/projects/${createdProjectId}/archive`, {
      method: 'PATCH',
      headers: {
        Cookie: `token=${managerToken}`
      }
    });
    const archiveData = await archiveRes.json();

    assert(
      archiveRes.status === 200 &&
      archiveData.project?.archived === true,
      '5. Manager can archive a project (archived = true)'
    );

    // 6. Archived project remains in DB and is hidden from default view
    const defaultProjectsRes = await fetch(`${baseUrl}/api/projects`, {
      headers: {
        Cookie: `token=${managerToken}`
      }
    });
    const defaultProjectsData = await defaultProjectsRes.json();
    const isZeusInDefault = defaultProjectsData.projects.some((p) => p.id === createdProjectId);

    const dbProject = await prisma.project.findUnique({ where: { id: createdProjectId } });

    assert(
      !isZeusInDefault && dbProject && dbProject.archived === true,
      '6. Archived project remains in database and is hidden from default active list'
    );

    // 7. Manager can restore project
    const restoreRes = await fetch(`${baseUrl}/api/projects/${createdProjectId}/restore`, {
      method: 'PATCH',
      headers: {
        Cookie: `token=${managerToken}`
      }
    });
    const restoreData = await restoreRes.json();

    assert(
      restoreRes.status === 200 &&
      restoreData.project?.archived === false,
      '7. Manager can restore an archived project (archived = false)'
    );

    // 8. Test Member Add & Remove with Task Unassignment & History Tracking
    // First, find user David Kim and add him to Apollo project
    const davidUser = await prisma.user.findUnique({
      where: { email: 'david.kim@busyinfotech.com' }
    });
    const apolloProject = await prisma.project.findUnique({
      where: { key: 'APOLLO' }
    });

    // Add David to Apollo
    await fetch(`${baseUrl}/api/projects/${apolloProject.id}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${managerToken}`
      },
      body: JSON.stringify({ userId: davidUser.id })
    });

    // Assign David to an Apollo task
    const apolloTask = await prisma.task.findFirst({
      where: { projectId: apolloProject.id, deletedAt: null }
    });
    await prisma.taskAssignee.upsert({
      where: {
        taskId_userId: { taskId: apolloTask.id, userId: davidUser.id }
      },
      create: { taskId: apolloTask.id, userId: davidUser.id },
      update: {}
    });

    // Remove David from Apollo project
    const removeMemberRes = await fetch(
      `${baseUrl}/api/projects/${apolloProject.id}/members/${davidUser.id}`,
      {
        method: 'DELETE',
        headers: {
          Cookie: `token=${managerToken}`
        }
      }
    );
    const removeMemberData = await removeMemberRes.json();

    // Verify ProjectMember is gone
    const memberCheck = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: davidUser.id, projectId: apolloProject.id }
      }
    });

    // Verify TaskAssignee is gone
    const assigneeCheck = await prisma.taskAssignee.findUnique({
      where: {
        taskId_userId: { taskId: apolloTask.id, userId: davidUser.id }
      }
    });

    // Verify TaskHistory unassignment record created
    const historyCheck = await prisma.taskHistory.findFirst({
      where: {
        taskId: apolloTask.id,
        action: 'UNASSIGNED',
        field: 'assignee',
        oldValue: davidUser.name
      }
    });

    assert(
      removeMemberRes.status === 200 &&
      !memberCheck &&
      !assigneeCheck &&
      historyCheck !== null,
      '8. Removing a member deletes project membership, unassigns from project tasks, and creates TaskHistory audit log'
    );

    // Clean up created test project
    await prisma.projectMember.deleteMany({ where: { projectId: createdProjectId } });
    await prisma.project.delete({ where: { id: createdProjectId } });

  } catch (err) {
    console.error('Projects test error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }

  console.log(`\n=== Projects Test Summary: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
