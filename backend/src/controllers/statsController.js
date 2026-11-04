const statsService = require('../services/statsService');

async function summary(req, res) {
  res.json(await statsService.getSummary(req.user));
}

async function vehicleTimeline(req, res) {
  res.json(await statsService.getVehicleTimeline(req.user, req.params.id));
}

module.exports = { summary, vehicleTimeline };
