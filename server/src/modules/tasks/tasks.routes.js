const express = require('express');
const tasksController = require('./tasks.controller');
const { authenticate, requireManager } = require('../../middleware/auth.middleware');

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

router.get('/', tasksController.getTasks);
router.get('/:id', tasksController.getTaskById);
router.post('/', tasksController.createTask);
router.put('/:id', tasksController.updateTask);
router.delete('/:id', requireManager, tasksController.deleteTask);

module.exports = router;
