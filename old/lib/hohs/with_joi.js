const Joi = require('joi')

module.exports = function (schema) {
  return function (handler) {
    return async (input, subject) => {
      const result = Joi.validate(input, schema)
      if (result.error) throw result.error
      return await handler(input, subject)
    }
  }
}