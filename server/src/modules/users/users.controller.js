const usersService = require('./users.service');

async function getUsers(req, res, next) {
  try {
    const users = await usersService.getAllUsers();
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await usersService.getUserById(req.params.id);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUsers,
  getUserById
};
