const joi = require('joi')

module.exports = function (schema) {
  if (!schema.isJoi) schema = joi.object().keys(schema)
  return function (handler) {
    return async (input, message) => {
      const result = joi.validate(input, schema)
      if (result.error) throw result.error
      return await handler(input, message)
    }
  }
}