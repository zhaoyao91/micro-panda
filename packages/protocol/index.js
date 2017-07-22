/**
 * Micro Panda Protocol
 *
 * Message
 * {
 *   protocol: 'mmp.1',
 *   type: 'request' | 'response' | 'event',
 *   name: String, // target name or event name
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

module.exports = class Protocol {
  static protocol = 'mmp.1'

  buildRequestEnvelope ({name, input}) {
    return {
      protocol: Protocol.protocol,
      type: 'request',
      name,
      id: uuid(),
      timestamp: (new Date()).getTime(),
      input,
    }
  }

  buildResponseEnvelope ({requestId, name, output, error}) {
    return {
      protocol: Protocol.protocol,
      type: 'response',
      name,
      id: uuid(),
      requestId,
      timestamp: (new Date()).getTime(),
      output,
      error,
    }
  }

  buildEventEnvelope ({name, input}) {
    return {
      protocol: Protocol.protocol,
      type: 'event',
      name,
      id: uuid(),
      timestamp: (new Date()).getTime(),
      input,
    }
  }
}

const MMPBuildError = makeError('MMPBuildError')
const MMPParseError = makeError('MMPParseError')