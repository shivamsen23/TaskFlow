const express = require('express');
const projectsController = require('./projects.controller');
const { authenticate, requireManager } = require('../../middleware/auth.middleware');

const router = express.Router();

// All project routes require authentication
router.use(authenticate);

// List and view
router.get('/', projectsController.getProjects);
router.get('/:id', projectsController.getProjectById);

// Manager-only operations
router.post('/', requireManager, projectsController.createProject);
router.put('/:id', requireManager, projectsController.updateProject);
router.patch('/:id/archive', requireManager, projectsController.archiveProject);
router.patch('/:id/restore', requireManager, projectsController.restoreProject);

// Manager-only project membership operations
router.post('/:id/members', requireManager, projectsController.addMember);
router.delete('/:id/members/:userId', requireManager, projectsController.removeMember);

module.exports = router;
