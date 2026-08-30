const express = require('express');
const dashboardController = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', dashboardController.getDashboard);

module.exports = router;
