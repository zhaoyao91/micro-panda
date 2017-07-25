const uuid = require('uuid/v4')
const {makeError} = require('error-utils')

class Protocol {
  buildRequestEnvelope ({payload}) {
    return {
      protocol: Protocol.protocol,
      type: 'request',
      payload,
    }
  }

  buildResponseEnvelope ({payload, error}) {
    return {
      protocol: Protocol.protocol,
      type: 'response',
      payload,
      error,
    }
  }

  buildEventEnvelope ({payload}) {
    return {
      protocol: Protocol.protocol,
      type: 'event',
      payload,
    }
  }

  checkRequestEnvelope (envelope) {
    if (!isPlainObject(envelope) || envelope.protocol !== Protocol.protocol || envelope.type !== 'request') {
      throw new MMPParseError('invalid envelope')
    }
  }

  checkResponseEnvelope (envelope) {
    if (!isPlainObject(envelope) || envelope.protocol !== Protocol.protocol || envelope.type !== 'response') {
      throw new MMPParseError('invalid envelope')
    }
  }

  checkEventEnvelope (envelope) {
    if (!isPlainObject(envelope) || envelope.protocol !== Protocol.protocol || envelope.type !== 'event') {
      throw new MMPParseError('invalid envelope')
    }
  }
}

Protocol.protocol = 'mpp.1'

module.exports = Protocol

const MMPBuildError = makeError('MMPBuildError')
const MMPParseError = makeError('MMPParseError')

function isPlainObject (object) {
  return typeof object === 'object' && object !== null && !Array.isArray(object)
}