# Joi Validator

Validate input via [Joi](https://github.com/hapijs/joi).

## API

#### validate(schema)(handler) => handler

schema is a [Joi schema](https://github.com/hapijs/joi).

if the schema is a plain object like {...}, then is a shortcut for joi.object().keys({...}).