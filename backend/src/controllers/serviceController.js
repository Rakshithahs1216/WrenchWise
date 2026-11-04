const serviceService = require('../services/serviceService');

async function list(req, res) {
  res.json({ services: await serviceService.listServices(req.user, req.query) });
}

async function create(req, res) {
  res.status(201).json({ service: await serviceService.createService(req.body) });
}

async function get(req, res) {
  res.json({ service: await serviceService.getServiceForUser(req.user, req.params.id) });
}

async function update(req, res) {
  res.json({ service: await serviceService.updateService(req.params.id, req.body) });
}

async function remove(req, res) {
  await serviceService.deleteService(req.params.id);
  res.status(204).end();
}

async function updateStatus(req, res) {
  res.json({ service: await serviceService.updateStatus(req.user, req.params.id, req.body.status) });
}

async function addNote(req, res) {
  res.status(201).json({ service: await serviceService.addNote(req.user, req.params.id, req.body.text) });
}

module.exports = { list, create, get, update, remove, updateStatus, addNote };
