const dashboardService = require('./dashboard.service');

async function getDashboard(req, res, next) {
  try {
    const data = await dashboardService.getDashboardData(req.user);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard
};
