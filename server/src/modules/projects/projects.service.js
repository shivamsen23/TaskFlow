const prisma = require('../../prisma');

async function getProjects(user, options = {}) {
  const { archived, search } = options;

  const where = {};

  // Archive filter
  if (archived === 'true' || archived === true) {
    where.archived = true;
  } else if (archived === 'all') {
    // Return both active and archived (only managers should usually request 'all')
  } else {
    // Default active projects only
    where.archived = false;
  }

  // Role visibility: Members only see projects they belong to
  if (user.role !== 'MANAGER') {
    where.members = {
      some: {
        userId: user.id
      }
    };
    // Non-managers should never see archived projects in default views
    where.archived = false;
  }

  // Search filter
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { key: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ];
  }

  return prisma.project.findMany({
    where,
    include: {
      owner: {
        select: { id: true, name: true, email: true, role: true }
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
        orderBy: { joinedAt: 'asc' }
      },
      _count: {
        select: {
          tasks: { where: { deletedAt: null } },
          members: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function getProjectById(projectId, user) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: {
        select: { id: true, name: true, email: true, role: true }
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
        orderBy: { joinedAt: 'asc' }
      },
      _count: {
        select: {
          tasks: { where: { deletedAt: null } },
          members: true
        }
      }
    }
  });

  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  // Role check: If member, must belong to the project
  if (user.role !== 'MANAGER') {
    const isMember = project.members.some((m) => m.userId === user.id);
    if (!isMember) {
      const error = new Error('Access denied: You are not a member of this project');
      error.status = 403;
      throw error;
    }
  }

  return project;
}

async function createProject(data, creatorUser) {
  const { key, name, description, ownerId } = data;

  if (!key || !key.trim()) {
    const error = new Error('Project key is required');
    error.status = 400;
    throw error;
  }

  if (!name || !name.trim()) {
    const error = new Error('Project name is required');
    error.status = 400;
    throw error;
  }

  const normalizedKey = key.trim().toUpperCase();

  // Validate key format (2-10 alphanumeric characters)
  if (!/^[A-Z0-9_-]{2,10}$/.test(normalizedKey)) {
    const error = new Error('Project key must be between 2 and 10 alphanumeric characters');
    error.status = 400;
    throw error;
  }

  // Check unique key
  const existingKey = await prisma.project.findUnique({
    where: { key: normalizedKey }
  });
  if (existingKey) {
    const error = new Error(`Project key "${normalizedKey}" already exists`);
    error.status = 400;
    throw error;
  }

  const assignedOwnerId = ownerId || creatorUser.id;

  // Verify owner is a MANAGER
  const owner = await prisma.user.findUnique({
    where: { id: assignedOwnerId }
  });
  if (!owner) {
    const error = new Error('Specified project owner does not exist');
    error.status = 400;
    throw error;
  }
  if (owner.role !== 'MANAGER') {
    const error = new Error('Project owner must have the MANAGER role');
    error.status = 400;
    throw error;
  }

  // Create project and membership inside transaction
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        key: normalizedKey,
        name: name.trim(),
        description: description ? description.trim() : null,
        ownerId: assignedOwnerId,
        archived: false
      }
    });

    // Ensure owner is added as a ProjectMember
    await tx.projectMember.create({
      data: {
        projectId: project.id,
        userId: assignedOwnerId
      }
    });

    // If creator is different from owner, add creator as member too
    if (creatorUser.id !== assignedOwnerId) {
      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: creatorUser.id
        }
      });
    }

    return tx.project.findUnique({
      where: { id: project.id },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } }
          }
        },
        _count: { select: { tasks: true, members: true } }
      }
    });
  });
}

async function updateProject(projectId, data) {
  const { name, description, ownerId } = data;

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });
  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  const updateData = {};
  if (name !== undefined) {
    if (!name.trim()) {
      const error = new Error('Project name cannot be empty');
      error.status = 400;
      throw error;
    }
    updateData.name = name.trim();
  }

  if (description !== undefined) {
    updateData.description = description ? description.trim() : null;
  }

  if (ownerId && ownerId !== project.ownerId) {
    const newOwner = await prisma.user.findUnique({
      where: { id: ownerId }
    });
    if (!newOwner || newOwner.role !== 'MANAGER') {
      const error = new Error('Project owner must be an existing user with the MANAGER role');
      error.status = 400;
      throw error;
    }
    updateData.ownerId = ownerId;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.project.update({
      where: { id: projectId },
      data: updateData
    });

    // Ensure new owner is in ProjectMember
    if (updateData.ownerId) {
      const isMember = await tx.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: updateData.ownerId,
            projectId
          }
        }
      });
      if (!isMember) {
        await tx.projectMember.create({
          data: {
            projectId,
            userId: updateData.ownerId
          }
        });
      }
    }

    return tx.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } }
          }
        },
        _count: { select: { tasks: true, members: true } }
      }
    });
  });
}

async function archiveProject(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });
  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { archived: true },
    include: {
      owner: { select: { id: true, name: true, email: true, role: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } }
        }
      },
      _count: { select: { tasks: true, members: true } }
    }
  });
}

async function restoreProject(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });
  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { archived: false },
    include: {
      owner: { select: { id: true, name: true, email: true, role: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } }
        }
      },
      _count: { select: { tasks: true, members: true } }
    }
  });
}

async function addMember(projectId, targetUserId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });
  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId }
  });
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  const existingMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: targetUserId,
        projectId
      }
    }
  });
  if (existingMember) {
    const error = new Error('User is already a member of this project');
    error.status = 400;
    throw error;
  }

  await prisma.projectMember.create({
    data: {
      projectId,
      userId: targetUserId
    }
  });

  return getProjectById(projectId, { role: 'MANAGER' });
}

async function removeMember(projectId, targetUserId, managerUser) {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });
  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  if (project.ownerId === targetUserId) {
    const error = new Error('Cannot remove the project owner from the project. Transfer ownership first.');
    error.status = 400;
    throw error;
  }

  const memberRecord = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: targetUserId,
        projectId
      }
    },
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });
  if (!memberRecord) {
    const error = new Error('User is not a member of this project');
    error.status = 404;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    // 1. Delete ProjectMember
    await tx.projectMember.delete({
      where: {
        userId_projectId: {
          userId: targetUserId,
          projectId
        }
      }
    });

    // 2. Find all tasks in this project where this user is assigned
    const assignedTasks = await tx.task.findMany({
      where: {
        projectId,
        deletedAt: null,
        assignees: {
          some: {
            userId: targetUserId
          }
        }
      },
      select: { id: true, title: true }
    });

    // 3. For each assigned task, unassign and create TaskHistory record
    for (const task of assignedTasks) {
      // Remove assignment
      await tx.taskAssignee.delete({
        where: {
          taskId_userId: {
            taskId: task.id,
            userId: targetUserId
          }
        }
      });

      // Record immutable history
      await tx.taskHistory.create({
        data: {
          taskId: task.id,
          userId: managerUser.id,
          action: 'UNASSIGNED',
          field: 'assignee',
          oldValue: memberRecord.user.name,
          newValue: null
        }
      });
    }

    return {
      message: `Member ${memberRecord.user.name} removed from project and unassigned from ${assignedTasks.length} task(s)`,
      unassignedTaskCount: assignedTasks.length
    };
  });
}

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  archiveProject,
  restoreProject,
  addMember,
  removeMember
};
