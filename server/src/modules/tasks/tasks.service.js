const prisma = require('../../prisma');

async function getTasks(user, query = {}) {
  const { projectId, assignedToMe } = query;

  const where = {
    deletedAt: null,
    project: {
      archived: false
    }
  };

  // If specific project requested
  if (projectId) {
    // Check access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) {
      const error = new Error('Project not found');
      error.status = 404;
      throw error;
    }

    if (user.role !== 'MANAGER') {
      const isMember = project.members.some((m) => m.userId === user.id);
      if (!isMember) {
        const error = new Error('Access denied: You are not a member of this project');
        error.status = 403;
        throw error;
      }
    }

    where.projectId = projectId;
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

  // Filter assigned to current user
  if (assignedToMe === 'true' || assignedToMe === true) {
    where.assignees = {
      some: {
        userId: user.id
      }
    };
  }

  return prisma.task.findMany({
    where,
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
    },
    orderBy: { createdAt: 'desc' }
  });
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

  return task;
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

  // 1. Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true }
  });
  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  // 2. Role check for creator
  if (creatorUser.role !== 'MANAGER') {
    const isMember = project.members.some((m) => m.userId === creatorUser.id);
    if (!isMember) {
      const error = new Error('Access denied: You cannot create tasks in a project you do not belong to');
      error.status = 403;
      throw error;
    }
  }

  // 3. Verify all assignees are project members
  const projectMemberUserIds = new Set(project.members.map((m) => m.userId));
  for (const assigneeId of assigneeIds) {
    if (!projectMemberUserIds.has(assigneeId)) {
      const error = new Error(`Cannot assign user ${assigneeId}: only project members may be assigned to project tasks`);
      error.status = 400;
      throw error;
    }
  }

  // 4. Verify all blocking tasks belong to the same project
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

  // 5. Execute creation inside transaction
  const createdTaskId = await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        projectId,
        title: title.trim(),
        description: description ? description.trim() : null,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        creatorId: creatorUser.id
      }
    });

    // Record creation history
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

    // Assign initial assignees & record history
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

    // Link dependencies
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

  // Validate assignees if provided
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

  // Validate blocking dependencies if provided
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

    // Track field history changes
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

    // Apply task scalar field updates
    if (Object.keys(updatePayload).length > 0) {
      await tx.task.update({
        where: { id: taskId },
        data: updatePayload
      });
    }

    // Handle Assignees delta
    if (assigneeIds !== undefined) {
      const currentAssigneeMap = new Map(existingTask.assignees.map((a) => [a.userId, a.user.name]));
      const currentIds = new Set(currentAssigneeMap.keys());
      const newIds = new Set(assigneeIds);

      // Identify unassigned
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

      // Identify newly assigned
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

    // Handle Dependencies delta
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

async function deleteTask(taskId, user) {
  // Enforce manager-only task deletion (Requirement 1 & Goal 3)
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
    // Soft delete
    await tx.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() }
    });

    // Record deletion event in history
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
  deleteTask
};
