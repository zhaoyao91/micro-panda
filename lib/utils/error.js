function makeError (Error) {
  Error.prototype.name = Error.name
  return Error
}

function causedBy (error, cause) {
  if (!(error instanceof Error)) {
    throw new TypeError('error must be an instance of Error')
  }

  if (!(cause instanceof Error)) {
    throw new TypeError('cause must be an instance of Error')
  }

  error.cause = cause
  if (cause.rootCause instanceof Error) {
    error.rootCause = cause.rootCause
  }
  else {
    error.rootCause = cause
  }

  const ownStack = error.stack
  Object.defineProperty(error, 'ownStack', {get: () => ownStack})

  const stack = ownStack + '\nCause: ' + cause.stack
  Object.defineProperty(error, 'stack', {get: () => stack})

  return error
}

function errorToObject (error) {
  return Object.assign({}, error, {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ownStack: error.ownStack,
    cause: error.cause && errorToObject(error.cause),
    rootCause: error.rootCause && errorToObject(error.rootCause)
  })
}

function objectToError (object) {
  const error = new ErrorFromObject()
  Object.assign(error, object)
  Object.defineProperty(error, 'stack', {get: () => object.stack})
  Object.defineProperty(error, 'ownStack', {get: () => object.stack})
  if (error.cause) error.cause = objectToError(error.cause)
  if (error.rootCause) error.rootCause = objectToError(error.rootCause)
  return error
}

const ErrorFromObject = class ErrorFromObject extends Error {}

module.exports = {
  makeError,
  causedBy,
  errorToObject,
  objectToError,
  ErrorFromObject,
}