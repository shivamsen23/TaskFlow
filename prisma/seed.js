const { PrismaClient } = require('@prisma/client');
let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch (e) {
  bcrypt = require('../server/node_modules/bcryptjs');
}

const prisma = new PrismaClient();

const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('Password123!', 10);

async function main() {
  console.log('--- Cleaning existing database records ---');
  await prisma.alertDismissal.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskHistory.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('--- Seeding Users ---');
  const sarah = await prisma.user.create({
    data: {
      name: 'Shivam Sen',
      email: 'shivam.sen@busyinfotech.com',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: 'MANAGER',
    },
  });

  const alex = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul.sharma@busyinfotech.com',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: 'MANAGER',
    },
  });

  const elena = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'elena.rostova@busyinfotech.com',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: 'MEMBER',
    },
  });

  const marcus = await prisma.user.create({
    data: {
      name: 'Marcus Johnson',
      email: 'marcus.johnson@busyinfotech.com',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: 'MEMBER',
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'priya.patel@busyinfotech.com',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: 'MEMBER',
    },
  });

  const david = await prisma.user.create({
    data: {
      name: 'Arjun Mehta',
      email: 'arjun.mehta@busyinfotech.com',
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: 'MEMBER',
    },
  });

  console.log('--- Seeding Projects ---');
  // Project 1: Apollo (Active)
  const apollo = await prisma.project.create({
    data: {
      key: 'APOLLO',
      name: 'Project Apollo - Client Portal',
      description: 'Modernizing the client-facing customer onboarding portal and self-service analytics dashboard.',
      ownerId: sarah.id,
      archived: false,
    },
  });

  // Project 2: Nexus (Active)
  const nexus = await prisma.project.create({
    data: {
      key: 'NEXUS',
      name: 'Nexus ERP Integration',
      description: 'Internal ERP synchronization pipeline for automated cross-department invoicing and reporting.',
      ownerId: alex.id,
      archived: false,
    },
  });

  // Project 3: Titan (Active)
  const titan = await prisma.project.create({
    data: {
      key: 'TITAN',
      name: 'Titan Mobile Suite',
      description: 'Cross-platform mobile application for field engineers with offline support and sync.',
      ownerId: sarah.id,
      archived: false,
    },
  });

  // Project 4: Legacy (Archived)
  const legacy = await prisma.project.create({
    data: {
      key: 'LEGACY',
      name: 'Legacy V1 Migration',
      description: 'Decommissioned monolithic database migration and archiving initiative.',
      ownerId: alex.id,
      archived: true,
    },
  });

  console.log('--- Seeding Project Memberships ---');
  // Apollo members: Sarah (Owner), Elena, Marcus, Priya
  for (const user of [sarah, elena, marcus, priya]) {
    await prisma.projectMember.create({
      data: { userId: user.id, projectId: apollo.id },
    });
  }

  // Nexus members: Alex (Owner), Marcus, David
  for (const user of [alex, marcus, david]) {
    await prisma.projectMember.create({
      data: { userId: user.id, projectId: nexus.id },
    });
  }

  // Titan members: Sarah (Owner), Elena, David, Priya
  for (const user of [sarah, elena, david, priya]) {
    await prisma.projectMember.create({
      data: { userId: user.id, projectId: titan.id },
    });
  }

  // Legacy members: Alex (Owner), Priya
  for (const user of [alex, priya]) {
    await prisma.projectMember.create({
      data: { userId: user.id, projectId: legacy.id },
    });
  }

  console.log('--- Seeding Tasks ---');
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const daysFromNow = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  // APOLLO TASKS
  // Task 1: Foundation (Done)
  const apolloTask1 = await prisma.task.create({
    data: {
      projectId: apollo.id,
      title: 'Design API Schema and Contracts',
      description: 'Define OpenAPI specs for auth, user profile, and analytics data streams.',
      priority: 'HIGH',
      status: 'DONE',
      dueDate: daysAgo(10),
      creatorId: sarah.id,
      createdAt: daysAgo(14),
    },
  });

  // Task 2: Auth Endpoints (In Progress - blocked by Task 1 which is Done)
  const apolloTask2 = await prisma.task.create({
    data: {
      projectId: apollo.id,
      title: 'Implement OAuth & JWT Authentication',
      description: 'Create login, refresh token rotation, and password reset endpoints.',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      dueDate: daysFromNow(2),
      creatorId: sarah.id,
      createdAt: daysAgo(7),
    },
  });

  // Task 3: Overdue Task (In Progress - Overdue by 4 days)
  const apolloTask3 = await prisma.task.create({
    data: {
      projectId: apollo.id,
      title: 'Customer Onboarding Wizard UI',
      description: 'Implement multi-step onboarding wizard with form state persistence.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: daysAgo(4),
      creatorId: sarah.id,
      createdAt: daysAgo(12),
    },
  });

  // Task 4: Blocked Task (Blocked by Task 2)
  const apolloTask4 = await prisma.task.create({
    data: {
      projectId: apollo.id,
      title: 'Client Dashboard Analytics Widgets',
      description: 'Visual charts for real-time engagement and throughput statistics.',
      priority: 'MEDIUM',
      status: 'BLOCKED',
      previousStatus: 'IN_PROGRESS',
      dueDate: daysFromNow(5),
      creatorId: sarah.id,
      createdAt: daysAgo(5),
    },
  });

  // Task 5: Backlog Task
  const apolloTask5 = await prisma.task.create({
    data: {
      projectId: apollo.id,
      title: 'Export Audit Logs to CSV',
      description: 'Allow workspace administrators to download historical user activity in CSV format.',
      priority: 'LOW',
      status: 'BACKLOG',
      dueDate: daysFromNow(14),
      creatorId: sarah.id,
      createdAt: daysAgo(3),
    },
  });

  // NEXUS TASKS
  // Nexus Task 1: Overdue & Urgent
  const nexusTask1 = await prisma.task.create({
    data: {
      projectId: nexus.id,
      title: 'Fix SAP Connector Sync Latency',
      description: 'Investigate and resolve thread pooling bottlenecks during nightly sync.',
      priority: 'URGENT',
      status: 'IN_REVIEW',
      dueDate: daysAgo(2),
      creatorId: alex.id,
      createdAt: daysAgo(6),
    },
  });

  // Nexus Task 2: Backlog
  const nexusTask2 = await prisma.task.create({
    data: {
      projectId: nexus.id,
      title: 'Automated Invoice Reconciliation',
      description: 'Match bank feed records with ERP line items automatically.',
      priority: 'MEDIUM',
      status: 'BACKLOG',
      dueDate: daysFromNow(7),
      creatorId: alex.id,
      createdAt: daysAgo(2),
    },
  });

  // TITAN TASKS
  const titanTask1 = await prisma.task.create({
    data: {
      projectId: titan.id,
      title: 'Offline SQLite Storage Layer',
      description: 'Configure local SQLite synchronization queue for offline mobile operations.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: daysFromNow(3),
      creatorId: sarah.id,
      createdAt: daysAgo(4),
    },
  });

  // LEGACY (Archived) TASK
  const legacyTask1 = await prisma.task.create({
    data: {
      projectId: legacy.id,
      title: 'Archive 2024 Audit Data',
      description: 'Cold storage backup for compliance regulations.',
      priority: 'LOW',
      status: 'DONE',
      dueDate: daysAgo(40),
      creatorId: alex.id,
      createdAt: daysAgo(60),
    },
  });

  console.log('--- Seeding Task Assignees ---');
  // Apollo Task 1 assignees: Elena
  await prisma.taskAssignee.create({ data: { taskId: apolloTask1.id, userId: elena.id } });

  // Apollo Task 2 assignees: Elena & Marcus
  await prisma.taskAssignee.create({ data: { taskId: apolloTask2.id, userId: elena.id } });
  await prisma.taskAssignee.create({ data: { taskId: apolloTask2.id, userId: marcus.id } });

  // Apollo Task 3 assignees (Overdue): Priya
  await prisma.taskAssignee.create({ data: { taskId: apolloTask3.id, userId: priya.id } });

  // Apollo Task 4 assignees: Marcus
  await prisma.taskAssignee.create({ data: { taskId: apolloTask4.id, userId: marcus.id } });

  // Nexus Task 1 assignees: David & Marcus
  await prisma.taskAssignee.create({ data: { taskId: nexusTask1.id, userId: david.id } });
  await prisma.taskAssignee.create({ data: { taskId: nexusTask1.id, userId: marcus.id } });

  // Titan Task 1 assignees: Elena & David
  await prisma.taskAssignee.create({ data: { taskId: titanTask1.id, userId: elena.id } });
  await prisma.taskAssignee.create({ data: { taskId: titanTask1.id, userId: david.id } });

  console.log('--- Seeding Task Dependencies ---');
  // Apollo Task 2 depends on Apollo Task 1 (Task 1 blocks Task 2)
  await prisma.taskDependency.create({
    data: {
      taskId: apolloTask2.id,
      blockingTaskId: apolloTask1.id,
    },
  });

  // Apollo Task 4 depends on Apollo Task 2 (Task 2 blocks Task 4)
  await prisma.taskDependency.create({
    data: {
      taskId: apolloTask4.id,
      blockingTaskId: apolloTask2.id,
    },
  });

  console.log('--- Seeding Task History ---');
  // Task 1 History
  await prisma.taskHistory.create({
    data: {
      taskId: apolloTask1.id,
      userId: sarah.id,
      action: 'CREATED',
      field: null,
      oldValue: null,
      newValue: null,
      createdAt: daysAgo(14),
    },
  });
  await prisma.taskHistory.create({
    data: {
      taskId: apolloTask1.id,
      userId: sarah.id,
      action: 'STATUS_CHANGE',
      field: 'status',
      oldValue: 'BACKLOG',
      newValue: 'IN_PROGRESS',
      createdAt: daysAgo(12),
    },
  });
  await prisma.taskHistory.create({
    data: {
      taskId: apolloTask1.id,
      userId: elena.id,
      action: 'STATUS_CHANGE',
      field: 'status',
      oldValue: 'IN_PROGRESS',
      newValue: 'DONE',
      createdAt: daysAgo(10),
    },
  });

  // Task 4 History (Moving to BLOCKED)
  await prisma.taskHistory.create({
    data: {
      taskId: apolloTask4.id,
      userId: sarah.id,
      action: 'CREATED',
      field: null,
      oldValue: null,
      newValue: null,
      createdAt: daysAgo(5),
    },
  });
  await prisma.taskHistory.create({
    data: {
      taskId: apolloTask4.id,
      userId: marcus.id,
      action: 'STATUS_CHANGE',
      field: 'status',
      oldValue: 'BACKLOG',
      newValue: 'IN_PROGRESS',
      createdAt: daysAgo(4),
    },
  });
  await prisma.taskHistory.create({
    data: {
      taskId: apolloTask4.id,
      userId: marcus.id,
      action: 'STATUS_CHANGE',
      field: 'status',
      oldValue: 'IN_PROGRESS',
      newValue: 'BLOCKED',
      createdAt: daysAgo(2),
    },
  });

  console.log('--- Seeding Comments ---');
  await prisma.comment.create({
    data: {
      taskId: apolloTask1.id,
      userId: elena.id,
      content: 'API contracts reviewed with frontend team. All schemas approved.',
      createdAt: daysAgo(10),
    },
  });
  await prisma.comment.create({
    data: {
      taskId: apolloTask4.id,
      userId: marcus.id,
      content: 'Blocking this until Task APOLLO-2 (Auth Endpoints) is finished so we can bind real user scopes.',
      createdAt: daysAgo(2),
    },
  });
  await prisma.comment.create({
    data: {
      taskId: apolloTask3.id,
      userId: priya.id,
      content: 'Waiting on UX assets for the billing step. Will complete immediately once SVGs arrive.',
      createdAt: daysAgo(3),
    },
  });

  console.log('--- Seeding Alert Dismissals ---');
  // Priya dismissed the overdue alert on apolloTask3 for its current dueDate
  await prisma.alertDismissal.create({
    data: {
      taskId: apolloTask3.id,
      userId: priya.id,
      dismissedDueDate: apolloTask3.dueDate,
      dismissedAt: daysAgo(1),
    },
  });

  console.log('--- Database Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
