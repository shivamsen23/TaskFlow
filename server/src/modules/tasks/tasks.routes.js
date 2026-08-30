const express = require('express');
const tasksController = require('./tasks.controller');
const { authenticate, requireManager } = require('../../middleware/auth.middleware');

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

// List & Bulk / Export routes (before :id)
router.get('/', tasksController.getTasks);
router.get('/export/csv', tasksController.exportTasksCsv);
router.post('/bulk', tasksController.bulkUpdateTasks);

// Individual task routes
router.get('/:id', tasksController.getTaskById);
router.post('/', tasksController.createTask);
router.put('/:id', tasksController.updateTask);
router.patch('/:id/status', tasksController.updateTaskStatus);
router.delete('/:id', requireManager, tasksController.deleteTask);

module.exports = router;
