const prisma = require('../../prisma');

async function getDashboardData(user) {
  const baseWhere = {
    deletedAt: null,
    project: {
      archived: false,
      ...(user.role !== 'MANAGER'
        ? {
            members: {
              some: {
                userId: user.id
              }
            }
          }
        : {})
    }
  };

  const now = new Date();

  // Determine current week window (Sunday 00:00:00 to Saturday 23:59:59)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  // 1. Headline Metric Counts
  const [openTasks, overdueTasks, dueThisWeek, completedThisWeek] = await Promise.all([
    // Open tasks
    prisma.task.count({
      where: {
        ...baseWhere,
        status: { not: 'DONE' }
      }
    }),
    // Overdue tasks
    prisma.task.count({
      where: {
        ...baseWhere,
        status: { not: 'DONE' },
        dueDate: { lt: now }
      }
    }),
    // Due this week
    prisma.task.count({
      where: {
        ...baseWhere,
        status: { not: 'DONE' },
        dueDate: {
          gte: startOfWeek,
          lt: endOfWeek
        }
      }
    }),
    // Completed this week
    prisma.task.count({
      where: {
        ...baseWhere,
        status: 'DONE',
        updatedAt: {
          gte: startOfWeek
        }
      }
    })
  ]);

  // 2. Status Breakdown
  const statusGroups = await prisma.task.groupBy({
    by: ['status'],
    where: baseWhere,
    _count: { id: true }
  });

  const statusOrder = ['BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE'];
  const statusMap = new Map(statusGroups.map((g) => [g.status, g._count.id]));
  const statusBreakdown = statusOrder.map((st) => ({
    status: st,
    count: statusMap.get(st) || 0
  }));

  // 3. Assignee Workload Breakdown
  // Get relevant users (project members for visible projects or all active users for manager)
  const visibleProjects = await prisma.project.findMany({
    where: {
      archived: false,
      ...(user.role !== 'MANAGER'
        ? {
            members: {
              some: {
                userId: user.id
              }
            }
          }
        : {})
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      }
    }
  });

  const memberUserMap = new Map();
  for (const p of visibleProjects) {
    for (const m of p.members) {
      if (!memberUserMap.has(m.user.id)) {
        memberUserMap.set(m.user.id, m.user);
      }
    }
  }

  const assigneeBreakdown = await Promise.all(
    Array.from(memberUserMap.values()).map(async (u) => {
      const [totalAssigned, openAssigned] = await Promise.all([
        prisma.task.count({
          where: {
            ...baseWhere,
            assignees: { some: { userId: u.id } }
          }
        }),
        prisma.task.count({
          where: {
            ...baseWhere,
            status: { not: 'DONE' },
            assignees: { some: { userId: u.id } }
          }
        })
      ]);

      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        totalTasks: totalAssigned,
        openTasks: openAssigned
      };
    })
  );

  // 4. Completion Trend for Last 8 Weeks
  const completionTrend = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(startOfWeek);
    weekStart.setDate(startOfWeek.getDate() - i * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekLabel = i === 0 ? 'This Week' : `W-${i}`;

    const count = await prisma.task.count({
      where: {
        ...baseWhere,
        status: 'DONE',
        updatedAt: {
          gte: weekStart,
          lt: weekEnd
        }
      }
    });

    completionTrend.push({
      week: weekLabel,
      completed: count,
      startDate: weekStart.toISOString().split('T')[0]
    });
  }

  // 5. Recent Overdue Tasks (top 5 for dashboard highlight)
  const recentOverdue = await prisma.task.findMany({
    where: {
      ...baseWhere,
      status: { not: 'DONE' },
      dueDate: { lt: now }
    },
    take: 5,
    orderBy: { dueDate: 'asc' },
    include: {
      project: { select: { key: true, name: true } },
      assignees: {
        include: {
          user: { select: { id: true, name: true } }
        }
      }
    }
  });

  return {
    metrics: {
      openTasks,
      overdueTasks,
      dueThisWeek,
      completedThisWeek
    },
    statusBreakdown,
    assigneeBreakdown: assigneeBreakdown.sort((a, b) => b.openTasks - a.openTasks),
    completionTrend,
    recentOverdue
  };
}

module.exports = {
  getDashboardData
};
