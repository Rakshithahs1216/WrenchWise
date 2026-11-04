/**
 * Mongoose plugin that shapes documents for the API: exposes `id` instead of
 * `_id`, drops `__v` and strips any fields listed in `hidden`.
 */
function toJSONPlugin(schema, { hidden = [] } = {}) {
  schema.set('toJSON', {
    versionKey: false,
    transform(_doc, ret) {
      const { _id, ...rest } = ret;
      for (const field of hidden) delete rest[field];
      return _id === undefined ? rest : { id: String(_id), ...rest };
    },
  });
}

module.exports = toJSONPlugin;
