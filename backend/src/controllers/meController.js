const vehicleService = require('../services/vehicleService');
const serviceService = require('../services/serviceService');

async function vehicles(req, res) {
  res.json({ vehicles: await vehicleService.listVehiclesForUser(req.user._id) });
}

async function services(req, res) {
  res.json({ services: await serviceService.listMyServices(req.user, req.query.scope) });
}

module.exports = { vehicles, services };
