const vehicleService = require('../services/vehicleService');

async function list(req, res) {
  res.json({ vehicles: await vehicleService.listVehicles(req.query) });
}

async function create(req, res) {
  res.status(201).json({ vehicle: await vehicleService.createVehicle(req.body) });
}

async function get(req, res) {
  res.json({ vehicle: await vehicleService.getVehicleById(req.params.id) });
}

async function update(req, res) {
  res.json({ vehicle: await vehicleService.updateVehicle(req.params.id, req.body) });
}

async function assign(req, res) {
  res.json({ vehicle: await vehicleService.assignVehicle(req.params.id, req.body.userId) });
}

async function remove(req, res) {
  await vehicleService.deleteVehicle(req.params.id);
  res.status(204).end();
}

module.exports = { list, create, get, update, assign, remove };
