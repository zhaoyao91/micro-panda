function makeError (ErrorClass, name) {
  if (ErrorClass instanceof Error && name === undefined) {
    return _makeError(ErrorClass)
  }
  else if (ErrorClass instanceof Error && typeof name === 'string') {
    return _inheritError(ErrorClass, name)
  }
  else if (typeof ErrorClass === 'string' && name === undefined) {
    return _inheritError(Error, ErrorClass)
  }
  else {
    throw new MakeErrorError('unsupported params')
  }
}

const MakeErrorError = makeError('MakeErrorError')

function _makeError (Error) {
  if (Error.name) {
    Error.prototype.name = Error.name
  }
  return Error
}

function _inheritError (BaseError, name) {
  class Error extends BaseError {}
  Error.prototype.name = name
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
  if (object.stack) Object.defineProperty(error, 'stack', {get: () => object.stack})
  if (object.ownStack) Object.defineProperty(error, 'ownStack', {get: () => object.ownStack})
  if (error.cause) error.cause = objectToError(error.cause)
  if (error.rootCause) error.rootCause = objectToError(error.rootCause)
  return error
}

const ErrorFromObject = makeError('ErrorFromObject')

module.exports = {
  makeError,
  causedBy,
  errorToObject,
  objectToError,
}