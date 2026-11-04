const userService = require('../services/userService');

async function list(req, res) {
  res.json({ users: await userService.listUsers(req.query) });
}

async function create(req, res) {
  res.status(201).json({ user: await userService.createUser(req.body) });
}

async function get(req, res) {
  res.json({ user: await userService.getUserById(req.params.id) });
}

async function update(req, res) {
  res.json({ user: await userService.updateUser(req.user, req.params.id, req.body) });
}

async function remove(req, res) {
  await userService.deleteUser(req.user, req.params.id);
  res.status(204).end();
}

module.exports = { list, create, get, update, remove };
