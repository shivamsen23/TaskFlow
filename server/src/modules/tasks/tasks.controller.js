const tasksService = require('./tasks.service');

async function getTasks(req, res, next) {
  try {
    const result = await tasksService.getTasks(req.user, req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getTaskById(req, res, next) {
  try {
    const task = await tasksService.getTaskById(req.params.id, req.user);
    res.status(200).json({ task });
  } catch (error) {
    next(error);
  }
}

async function createTask(req, res, next) {
  try {
    const task = await tasksService.createTask(req.body, req.user);
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const task = await tasksService.updateTask(req.params.id, req.body, req.user);
    res.status(200).json({ task });
  } catch (error) {
    next(error);
  }
}

async function updateTaskStatus(req, res, next) {
  try {
    const { status } = req.body;
    const task = await tasksService.updateTaskStatus(req.params.id, status, req.user);
    res.status(200).json({ task, message: `Task status updated to ${status}` });
  } catch (error) {
    next(error);
  }
}

async function bulkUpdateTasks(req, res, next) {
  try {
    const result = await tasksService.bulkUpdateTasks(req.user, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function exportTasksCsv(req, res, next) {
  try {
    const csvContent = await tasksService.exportTasksCsv(req.user, req.query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks-export.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    const result = await tasksService.deleteTask(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
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
