const prisma = require('../../prisma');
const taskRulesService = require('./task-rules.service');

/**
 * Shared helper to build Prisma `where` and `orderBy` clauses
 * for task queries, ensuring strict member authorization and filter consistency.
 */
async function buildTasksWhereAndOrderBy(user, query = {}) {
  const {
    search,
    project,
    projectId,
    status,
    assignee,
    assigneeId,
    priority,
    overdue,
    assignedToMe,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = query;

  const targetProject = project || projectId;
  const targetAssignee = assignee || assigneeId;

  const where = {
    deletedAt: null,
    project: {
      archived: false
    }
  };

  // 1. Project Filter & Authorization
  if (targetProject) {
    const projRecord = await prisma.project.findFirst({
      where: {
        OR: [{ id: targetProject }, { key: targetProject.toUpperCase() }]
      },
      include: { members: true }
    });

    if (!projRecord) {
      const error = new Error('Project not found');
      error.status = 404;
      throw error;
    }

    if (user.role !== 'MANAGER') {
      const isMember = projRecord.members.some((m) => m.userId === user.id);
      if (!isMember) {
        const error = new Error('Access denied: You are not a member of this project');
        error.status = 403;
        throw error;
      }
    }

    where.projectId = projRecord.id;
  } else {
    // Cross-project visibility: Members only see tasks in projects they belong to
    if (user.role !== 'MANAGER') {
      where.project = {
        archived: false,
        members: {
          some: {
            userId: user.id
          }
        }
      };
    }
  }

  // 2. Search Filter (Title & Description)
  if (search && search.trim()) {
    const q = search.trim();
    where.AND = where.AND || [];
    where.AND.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ]
    });
  }

  // 3. Status Filter
  if (status) {
    where.status = status;
  }

  // 4. Priority Filter
  if (priority) {
    where.priority = priority;
  }

  // 5. Assignee Filter
  if (targetAssignee) {
    where.assignees = {
      some: {
        userId: targetAssignee
      }
    };
  } else if (assignedToMe === 'true' || assignedToMe === true) {
    where.assignees = {
      some: {
        userId: user.id
      }
    };
  }

  // 6. Overdue Filter
  if (overdue === 'true' || overdue === true) {
    where.dueDate = { lt: new Date() };
    where.status = { not: 'DONE' };
  }

  // 7. Sorting
  const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';
  let orderByClause = { createdAt: 'desc' };

  if (sortBy === 'dueDate') {
    orderByClause = { dueDate: orderDirection };
  } else if (sortBy === 'priority') {
    orderByClause = { priority: orderDirection };
  } else if (sortBy === 'updatedAt' || sortBy === 'lastUpdated') {
    orderByClause = { updatedAt: orderDirection };
  } else if (sortBy === 'createdAt') {
    orderByClause = { createdAt: orderDirection };
  } else if (sortBy === 'title') {
    orderByClause = { title: orderDirection };
  }

  return { where, orderBy: orderByClause };
}

async function getTasks(user, query = {}) {
  const { page = 1, limit = 10 } = query;
  const { where, orderBy } = await buildTasksWhereAndOrderBy(user, query);

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;
  const take = limitNum;

  const [total, tasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        project: {
          select: { id: true, key: true, name: true }
        },
        creator: {
          select: { id: true, name: true, email: true }
        },
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        blockingDependencies: {
          include: {
            blockingTask: {
              select: { id: true, title: true, status: true, priority: true }
            }
          }
        },
        _count: {
          select: {
            comments: true,
            blockingDependencies: true,
            blockedByDependencies: true
          }
        }
      }
    })
  ]);

  const tasksWithLegal = tasks.map((t) => ({
    ...t,
    legalNextStatuses: taskRulesService.getLegalNextStatuses(t)
  }));

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    data: tasksWithLegal,
    tasks: tasksWithLegal,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages
    }
  };
}

async function getTaskById(taskId, user) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      deletedAt: null
    },
    include: {
      project: {
        select: {
          id: true,
          key: true,
          name: true,
          ownerId: true,
          archived: true,
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true }
              }
            }
          }
        }
      },
      creator: {
        select: { id: true, name: true, email: true, role: true }
      },
      assignees: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      },
      blockingDependencies: {
        include: {
          blockingTask: {
            select: { id: true, title: true, status: true, priority: true, dueDate: true }
          }
        }
      },
      blockedByDependencies: {
        include: {
          task: {
            select: { id: true, title: true, status: true, priority: true, dueDate: true }
          }
        }
      },
      histories: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      comments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!task) {
    const error = new Error('Task not found');
    error.status = 404;
    throw error;
  }

  // Role check: If member, must belong to project
  if (user.role !== 'MANAGER') {
    const isMember = task.project.members.some((m) => m.userId === user.id);
    if (!isMember) {
      const error = new Error('Access denied: You are not a member of this project');
      error.status = 403;
      throw error;
    }
  }

  return {
    ...task,
    legalNextStatuses: taskRulesService.getLegalNextStatuses(task)
  };
}

async function createTask(data, creatorUser) {
  const {
    projectId,
    title,
    description,
    priority = 'MEDIUM',
    dueDate,
    status = 'BACKLOG',
    assigneeIds = [],
    blockingTaskIds = []
  } = data;

  if (!projectId) {
    const error = new Error('Task must belong to a project (projectId is required)');
    error.status = 400;
    throw error;
  }

  if (!title || !title.trim()) {
    const error = new Error('Task title is required');
    error.status = 400;
    throw error;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true }
  });
  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  if (creatorUser.role !== 'MANAGER') {
    const isMember = project.members.some((m) => m.userId === creatorUser.id);
    if (!isMember) {
      const error = new Error('Access denied: You cannot create tasks in a project you do not belong to');
      error.status = 403;
      throw error;
    }
  }

  const projectMemberUserIds = new Set(project.members.map((m) => m.userId));
  for (const assigneeId of assigneeIds) {
    if (!projectMemberUserIds.has(assigneeId)) {
      const error = new Error(`Cannot assign user ${assigneeId}: only project members may be assigned to project tasks`);
      error.status = 400;
      throw error;
    }
  }

  if (blockingTaskIds.length > 0) {
    const blockingTasks = await prisma.task.findMany({
      where: {
        id: { in: blockingTaskIds },
        deletedAt: null
      }
    });

    if (blockingTasks.length !== blockingTaskIds.length) {
      const error = new Error('One or more blocking tasks do not exist');
      error.status = 400;
      throw error;
    }

    for (const bTask of blockingTasks) {
      if (bTask.projectId !== projectId) {
        const error = new Error(`Blocking task "${bTask.title}" belongs to a different project. Task dependencies must belong to the same project.`);
        error.status = 400;
        throw error;
      }
    }
  }

  const createdTaskId = await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        projectId,
        title: title.trim(),
        description: description ? description.trim() : null,
        priority,
        status,
        previousStatus: status === 'BLOCKED' ? 'IN_PROGRESS' : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        creatorId: creatorUser.id
      }
    });

    await tx.taskHistory.create({
      data: {
        taskId: task.id,
        userId: creatorUser.id,
        action: 'CREATED',
        field: null,
        oldValue: null,
        newValue: null
      }
    });

    if (assigneeIds.length > 0) {
      const usersToAssign = await tx.user.findMany({
        where: { id: { in: assigneeIds } },
        select: { id: true, name: true }
      });

      for (const u of usersToAssign) {
        await tx.taskAssignee.create({
          data: {
            taskId: task.id,
            userId: u.id
          }
        });

        await tx.taskHistory.create({
          data: {
            taskId: task.id,
            userId: creatorUser.id,
            action: 'ASSIGNED',
            field: 'assignee',
            oldValue: null,
            newValue: u.name
          }
        });
      }
    }

    if (blockingTaskIds.length > 0) {
      for (const blockingId of blockingTaskIds) {
        await tx.taskDependency.create({
          data: {
            taskId: task.id,
            blockingTaskId: blockingId
          }
        });
      }
    }

    return task.id;
  });

  return getTaskById(createdTaskId, creatorUser);
}

async function updateTask(taskId, data, user) {
  const {
    title,
    description,
    priority,
    dueDate,
    status,
    assigneeIds,
    blockingTaskIds
  } = data;

  const existingTask = await getTaskById(taskId, user);

  if (status !== undefined && status !== existingTask.status) {
    await taskRulesService.validateStatusTransition(existingTask, status);
  }

  if (assigneeIds !== undefined) {
    const project = await prisma.project.findUnique({
      where: { id: existingTask.projectId },
      include: { members: true }
    });
    const memberIds = new Set(project.members.map((m) => m.userId));

    for (const aId of assigneeIds) {
      if (!memberIds.has(aId)) {
        const error = new Error('Cannot assign non-member user to project task');
        error.status = 400;
        throw error;
      }
    }
  }

  if (blockingTaskIds !== undefined) {
    if (blockingTaskIds.includes(taskId)) {
      const error = new Error('A task cannot depend on or block itself');
      error.status = 400;
      throw error;
    }

    if (blockingTaskIds.length > 0) {
      const blockingTasks = await prisma.task.findMany({
        where: {
          id: { in: blockingTaskIds },
          deletedAt: null
        }
      });

      if (blockingTasks.length !== blockingTaskIds.length) {
        const error = new Error('One or more blocking tasks do not exist');
        error.status = 400;
        throw error;
      }

      for (const bTask of blockingTasks) {
        if (bTask.projectId !== existingTask.projectId) {
          const error = new Error('Blocking tasks must belong to the same project');
          error.status = 400;
          throw error;
        }
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    const updatePayload = {};

    if (title !== undefined && title.trim() !== existingTask.title) {
      updatePayload.title = title.trim();
      await tx.taskHistory.create({
        data: {
          taskId,
          userId: user.id,
          action: 'FIELD_UPDATE',
          field: 'title',
          oldValue: existingTask.title,
          newValue: title.trim()
        }
      });
    }

    if (description !== undefined && description !== existingTask.description) {
      updatePayload.description = description ? description.trim() : null;
      await tx.taskHistory.create({
        data: {
          taskId,
          userId: user.id,
          action: 'FIELD_UPDATE',
          field: 'description',
          oldValue: existingTask.description,
          newValue: description ? description.trim() : null
        }
      });
    }

    if (priority !== undefined && priority !== existingTask.priority) {
      updatePayload.priority = priority;
      await tx.taskHistory.create({
        data: {
          taskId,
          userId: user.id,
          action: 'FIELD_UPDATE',
          field: 'priority',
          oldValue: existingTask.priority,
          newValue: priority
        }
      });
    }

    if (status !== undefined && status !== existingTask.status) {
      updatePayload.status = status;

      if (status === 'BLOCKED') {
        updatePayload.previousStatus = existingTask.status;
      } else if (existingTask.status === 'BLOCKED') {
        updatePayload.previousStatus = null;
      }

      await tx.taskHistory.create({
        data: {
          taskId,
          userId: user.id,
          action: 'STATUS_CHANGE',
          field: 'status',
          oldValue: existingTask.status,
          newValue: status
        }
      });
    }

    if (dueDate !== undefined) {
      const newDue = dueDate ? new Date(dueDate) : null;
      const oldDue = existingTask.dueDate ? new Date(existingTask.dueDate) : null;
      if (newDue?.toISOString() !== oldDue?.toISOString()) {
        updatePayload.dueDate = newDue;
        await tx.taskHistory.create({
          data: {
            taskId,
            userId: user.id,
            action: 'FIELD_UPDATE',
            field: 'dueDate',
            oldValue: oldDue ? oldDue.toISOString() : null,
            newValue: newDue ? newDue.toISOString() : null
          }
        });
      }
    }

    if (Object.keys(updatePayload).length > 0) {
      await tx.task.update({
        where: { id: taskId },
        data: updatePayload
      });
    }

    if (assigneeIds !== undefined) {
      const currentAssigneeMap = new Map(existingTask.assignees.map((a) => [a.userId, a.user.name]));
      const currentIds = new Set(currentAssigneeMap.keys());
      const newIds = new Set(assigneeIds);

      for (const [currId, currName] of currentAssigneeMap.entries()) {
        if (!newIds.has(currId)) {
          await tx.taskAssignee.delete({
            where: {
              taskId_userId: { taskId, userId: currId }
            }
          });

          await tx.taskHistory.create({
            data: {
              taskId,
              userId: user.id,
              action: 'UNASSIGNED',
              field: 'assignee',
              oldValue: currName,
              newValue: null
            }
          });
        }
      }

      for (const newId of newIds) {
        if (!currentIds.has(newId)) {
          const u = await tx.user.findUnique({
            where: { id: newId },
            select: { id: true, name: true }
          });

          await tx.taskAssignee.create({
            data: { taskId, userId: newId }
          });

          await tx.taskHistory.create({
            data: {
              taskId,
              userId: user.id,
              action: 'ASSIGNED',
              field: 'assignee',
              oldValue: null,
              newValue: u.name
            }
          });
        }
      }
    }

    if (blockingTaskIds !== undefined) {
      await tx.taskDependency.deleteMany({
        where: { taskId }
      });

      for (const bId of blockingTaskIds) {
        await tx.taskDependency.create({
          data: { taskId, blockingTaskId: bId }
        });
      }
    }
  });

  return getTaskById(taskId, user);
}

async function updateTaskStatus(taskId, status, user) {
  if (!status) {
    const error = new Error('status is required');
    error.status = 400;
    throw error;
  }
  return updateTask(taskId, { status }, user);
}

/**
 * Bulk updates a list of tasks with partial success support.
 * Each task is processed independently so failures do not roll back successful updates.
 */
async function bulkUpdateTasks(user, body) {
  const { taskIds, action, status, assigneeIds, dueDate } = body;

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    const error = new Error('taskIds must be a non-empty array');
    error.status = 400;
    throw error;
  }

  if (!action) {
    const error = new Error('action is required (status, assignees, or dueDate)');
    error.status = 400;
    throw error;
  }

  const results = [];

  for (const taskId of taskIds) {
    let taskRecord = null;
    try {
      taskRecord = await getTaskById(taskId, user);

      let payload = {};
      if (action === 'status') {
        if (!status) throw new Error('status value is required for status action');
        payload = { status };
      } else if (action === 'assignees') {
        payload = { assigneeIds: assigneeIds || [] };
      } else if (action === 'dueDate') {
        payload = { dueDate: dueDate || null };
      } else {
        throw new Error(`Unsupported bulk action: ${action}`);
      }

      await updateTask(taskId, payload, user);

      results.push({
        taskId,
        title: taskRecord.title,
        success: true
      });
    } catch (err) {
      results.push({
        taskId,
        title: taskRecord ? taskRecord.title : taskId,
        success: false,
        reason: err.message
      });
    }
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    results,
    summary: {
      total: taskIds.length,
      successful,
      failed
    }
  };
}

function escapeCsvField(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates a CSV export string for the filtered task query.
 */
async function exportTasksCsv(user, query = {}) {
  const { where, orderBy } = await buildTasksWhereAndOrderBy(user, query);

  const tasks = await prisma.task.findMany({
    where,
    orderBy,
    take: 10000,
    include: {
      project: {
        select: { id: true, key: true, name: true }
      },
      creator: {
        select: { id: true, name: true, email: true }
      },
      assignees: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  });

  const headers = [
    'Task ID',
    'Project Key',
    'Project Name',
    'Title',
    'Description',
    'Priority',
    'Status',
    'Due Date',
    'Assignees',
    'Created By',
    'Created At',
    'Updated At'
  ];

  const rows = tasks.map((t) => [
    escapeCsvField(t.id),
    escapeCsvField(t.project?.key),
    escapeCsvField(t.project?.name),
    escapeCsvField(t.title),
    escapeCsvField(t.description || ''),
    escapeCsvField(t.priority),
    escapeCsvField(t.status),
    escapeCsvField(t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : ''),
    escapeCsvField(t.assignees.map((a) => a.user.name).join('; ')),
    escapeCsvField(t.creator?.name || ''),
    escapeCsvField(new Date(t.createdAt).toISOString()),
    escapeCsvField(new Date(t.updatedAt).toISOString())
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(','))
  ].join('\r\n');

  return csvContent;
}

async function deleteTask(taskId, user) {
  if (user.role !== 'MANAGER') {
    const error = new Error('Access denied: Only managers can delete tasks');
    error.status = 403;
    throw error;
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null }
  });
  if (!task) {
    const error = new Error('Task not found');
    error.status = 404;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() }
    });

    await tx.taskHistory.create({
      data: {
        taskId,
        userId: user.id,
        action: 'DELETED',
        field: null,
        oldValue: null,
        newValue: null
      }
    });

    return { message: 'Task deleted successfully' };
  });
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  bulkUpdateTasks,
  exportTasksCsv,
  deleteTask
};
