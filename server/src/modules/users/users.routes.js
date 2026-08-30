const express = require('express');
const usersController = require('./users.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', usersController.getUsers);
router.get('/:id', usersController.getUserById);

module.exports = router;
