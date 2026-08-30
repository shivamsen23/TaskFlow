const alertsService = require('./alerts.service');

async function getAlerts(req, res, next) {
  try {
    const data = await alertsService.getAlerts(req.user);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function dismissAlert(req, res, next) {
  try {
    const result = await alertsService.dismissAlert(req.params.taskId, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAlerts,
  dismissAlert
};
