const express = require('express');
const alertsController = require('./alerts.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', alertsController.getAlerts);
router.post('/:taskId/dismiss', alertsController.dismissAlert);

module.exports = router;
