const prisma = require('../../prisma');

/**
 * Retrieves all overdue alerts for the logged-in user with dismissal status.
 */
async function getAlerts(user) {
  const now = new Date();

  // Find overdue tasks in visible projects
  const overdueTasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      status: { not: 'DONE' },
      dueDate: { lt: now },
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
    },
    orderBy: { dueDate: 'asc' },
    include: {
      project: {
        select: { id: true, key: true, name: true }
      },
      assignees: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      }
    }
  });

  // Query all dismissals by the current user for these tasks
  const taskIds = overdueTasks.map((t) => t.id);
  const dismissals = await prisma.alertDismissal.findMany({
    where: {
      userId: user.id,
      taskId: { in: taskIds }
    }
  });

  const dismissalMap = new Map(dismissals.map((d) => [d.taskId, d]));

  const mappedAlerts = overdueTasks.map((task) => {
    const isAssignedToUser = task.assignees.some((a) => a.userId === user.id);
    const dismissal = dismissalMap.get(task.id);

    // Alert is dismissed IF AND ONLY IF dismissal exists AND dismissedDueDate exactly matches current dueDate
    let isDismissed = false;
    if (
      dismissal &&
      dismissal.dismissedDueDate &&
      task.dueDate &&
      new Date(dismissal.dismissedDueDate).getTime() === new Date(task.dueDate).getTime()
    ) {
      isDismissed = true;
    }

    return {
      ...task,
      isDismissed,
      isAssignedToUser,
      daysOverdue: Math.max(1, Math.floor((now - new Date(task.dueDate)) / (1000 * 60 * 60 * 24)))
    };
  });

  // Active count is undismissed overdue tasks assigned to the user (or total for manager)
  const activeCount = mappedAlerts.filter(
    (a) => !a.isDismissed && (user.role === 'MANAGER' || a.isAssignedToUser)
  ).length;

  return {
    alerts: mappedAlerts,
    activeCount,
    totalOverdue: mappedAlerts.length
  };
}

/**
 * Dismisses an overdue alert for a specific task.
 * User must be assigned to the task (or manager).
 */
async function dismissAlert(taskId, user) {
  const now = new Date();

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      deletedAt: null
    },
    include: {
      assignees: true,
      project: { include: { members: true } }
    }
  });

  if (!task) {
    const error = new Error('Task not found');
    error.status = 404;
    throw error;
  }

  // Ensure task is overdue
  if (!task.dueDate || new Date(task.dueDate) >= now || task.status === 'DONE') {
    const error = new Error('Task is not currently overdue');
    error.status = 400;
    throw error;
  }

  // User assignment authorization check
  const isAssigned = task.assignees.some((a) => a.userId === user.id);
  if (!isAssigned && user.role !== 'MANAGER') {
    const error = new Error('Access denied: You can only dismiss alerts for tasks assigned to you');
    error.status = 403;
    throw error;
  }

  // Record or update AlertDismissal with current dueDate snapshot
  await prisma.alertDismissal.upsert({
    where: {
      taskId_userId: {
        taskId: task.id,
        userId: user.id
      }
    },
    update: {
      dismissedDueDate: task.dueDate,
      dismissedAt: new Date()
    },
    create: {
      taskId: task.id,
      userId: user.id,
      dismissedDueDate: task.dueDate,
      dismissedAt: new Date()
    }
  });

  return {
    message: 'Alert dismissed successfully',
    taskId: task.id
  };
}

module.exports = {
  getAlerts,
  dismissAlert
};
