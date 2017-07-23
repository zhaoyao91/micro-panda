const os = require('os')
const {RemoteMethodError} = require('./errors')
const {errorToObject, objectToError} = require('error-utils')

module.exports = {
  map: (err) => {
    const newError = new RemoteMethodError('failed to handle request')
    newError.node = getNodeInfo()
    chainErrors(newError, err)
    return newError
  },

  errorToObject: (err) => {
    const obj = errorToObject(err)
    if (Array.isArray(obj.causes)) {
      obj.causes = obj.causes.map(cause => errorToObject(cause))
    }
    return obj
  },

  objectToError: (obj) => {
    const err = objectToError(obj)
    if (Array.isArray(err.causes)) {
      err.causes = err.causes.map(cause => objectToError(cause))
    }
    return err
  }
}

function getNodeInfo () {
  return {
    hostname: os.hostname(),
    pid: process.pid
  }
}

function chainErrors (error, cause) {
  if (Array.isArray(cause.causes)) error.causes = cause.causes.concat(cause)
  else error.causes = [cause]
}