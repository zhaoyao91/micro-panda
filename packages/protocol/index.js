/**
 * Micro Panda Protocol
 *
 * Message
 * {
 *   protocol: 'mmp.1',
 *   type: 'request' | 'response' | 'event',
 *   id: String,
 *   requestId: String, // the message id of the request to respond, for type.response
 *   timestamp: Number,
 *
 *   input: Any, // optional, for type.request, type.event
 *   output: Any, // optional, for type.response
 *   error: ErrorObject, // optional, for type.response
 * }
 *
 * ErrorObject
 * {
 *   name: String,
 *   message: String,
 *   stack: String,
 *   ownStack: String, // optional
 *   cause: ErrorObject, // optional
 *   rootCause: ErrorObject, // optional
 * }
 */

const uuid = require('uuid/v4')
const {makeError} = require('error-utils')

class Protocol {
  buildRequestEnvelope ({input}) {
    return {
      protocol: Protocol.protocol,
      type: 'request',
      id: uuid(),
      timestamp: (new Date()).getTime(),
      input,
    }
  }

  buildResponseEnvelope ({requestId, output, error}) {
    return {
      protocol: Protocol.protocol,
      type: 'response',
      id: uuid(),
      requestId,
      timestamp: (new Date()).getTime(),
      output,
      error,
    }
  }

  buildEventEnvelope ({input}) {
    return {
      protocol: Protocol.protocol,
      type: 'event',
      id: uuid(),
      timestamp: (new Date()).getTime(),
      input,
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

Protocol.protocol = 'mmp.1'

module.exports = Protocol

const MMPBuildError = makeError('MMPBuildError')
const MMPParseError = makeError('MMPParseError')

function isPlainObject (object) {
  return typeof object === 'object' && object !== null && !Array.isArray(object)
}