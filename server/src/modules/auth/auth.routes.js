const express = require('express');
const authController = require('./auth.controller');
const { authenticate, requireManager } = require('../../middleware/auth.middleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);
router.get('/manager-only-test', authenticate, requireManager, authController.testManagerOnly);

module.exports = router;
