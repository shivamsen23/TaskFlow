const prisma = require('../../prisma');

/**
 * Returns array of legal next statuses from the current task state.
 * @param {Object} task
 * @returns {string[]}
 */
function getLegalNextStatuses(task) {
  const current = task.status;
  const previous = task.previousStatus || 'IN_PROGRESS';

  switch (current) {
    case 'BACKLOG':
      return ['IN_PROGRESS'];

    case 'IN_PROGRESS':
      return ['IN_REVIEW', 'BLOCKED'];

    case 'IN_REVIEW':
      return ['DONE', 'BLOCKED', 'IN_PROGRESS'];

    case 'BLOCKED':
      // Unblocking returns to the exact state it was blocked from
      return [previous];

    case 'DONE':
      // A finished task can be reopened
      return ['IN_PROGRESS', 'BACKLOG'];

    default:
      return [];
  }
}

/**
 * Validates a status transition against lifecycle state rules and dependency completion.
 * Throws 400 Error if transition is illegal or blocked by dependencies.
 * @param {Object} task
 * @param {string} targetStatus
 */
async function validateStatusTransition(task, targetStatus) {
  const current = task.status;

  if (current === targetStatus) {
    return true;
  }

  const legalNext = getLegalNextStatuses(task);

  if (!legalNext.includes(targetStatus)) {
    let reason = `Cannot transition task directly from ${current} to ${targetStatus}.`;

    if (current === 'BACKLOG' && targetStatus === 'DONE') {
      reason = 'Cannot transition task directly from BACKLOG to DONE. Task must go through IN_PROGRESS and IN_REVIEW first.';
    } else if (current === 'BACKLOG' && targetStatus === 'IN_REVIEW') {
      reason = 'Cannot transition task directly from BACKLOG to IN_REVIEW. Task must be moved to IN_PROGRESS first.';
    } else if (current === 'IN_PROGRESS' && targetStatus === 'DONE') {
      reason = 'Cannot transition task directly from IN_PROGRESS to DONE. Task must go through IN_REVIEW before completion.';
    } else if (current === 'BACKLOG' && targetStatus === 'BLOCKED') {
      reason = 'Cannot block a task from BACKLOG. Only active tasks in IN_PROGRESS or IN_REVIEW can be marked as BLOCKED.';
    } else if (current === 'BLOCKED' && targetStatus !== (task.previousStatus || 'IN_PROGRESS')) {
      reason = `Task is BLOCKED and can only be unblocked back to its previous state (${task.previousStatus || 'IN_PROGRESS'}).`;
    }

    const error = new Error(reason);
    error.status = 400;
    throw error;
  }

  // If attempting to transition to DONE, check all blocking dependencies
  if (targetStatus === 'DONE') {
    const dependencies = await prisma.taskDependency.findMany({
      where: { taskId: task.id },
      include: {
        blockingTask: {
          select: {
            id: true,
            title: true,
            status: true,
            deletedAt: true,
            project: { select: { key: true } }
          }
        }
      }
    });

    const activeUnfinished = dependencies.filter(
      (d) => !d.blockingTask.deletedAt && d.blockingTask.status !== 'DONE'
    );

    if (activeUnfinished.length > 0) {
      const unfinishedTitles = activeUnfinished
        .map((d) => `"${d.blockingTask.title}" [${d.blockingTask.status}]`)
        .join(', ');

      const error = new Error(
        `Task cannot be marked as DONE because blocking task(s) ${unfinishedTitles} are not finished.`
      );
      error.status = 400;
      throw error;
    }
  }

  return true;
}

module.exports = {
  getLegalNextStatuses,
  validateStatusTransition
};
