/**
 * this hob wrap input and output into an envelope ruled by Micro Panda Protocol
 */

/**
 * Micro Panda Protocol
 *
 * version: 1
 * protocol: mpp.1
 *
 * request
 * {
 *   protocol,
 *   type: 'request',
 *   input: xxx
 * }
 *
 * notification
 * {
 *   protocol,
 *   type: 'notification',
 *   input: xxx
 * }
 *
 * response
 * {
 *   protocol,
 *   type: 'response',
 *   output: xxx,
 *   error: {
 *     name,
 *     message,
 *     stack,
 *     ...customFields,
 *   }
 * }
 */

const _ = require('lodash')
const {makeError, causedBy, errorToObject, objectToError} = require('../utils/error')

/**
 * the returned broker will pass down envelope object directly
 * so you should wrap the inner broker with serializer
 *
 * for request handlers, if it encountered an error, the error would be handled by the broker error handler first,
 * and then, the error would be sealed as response and sent out.
 * the error handler can return a new err to cover sensitive info.
 *
 * for requester, if it received a response with error, the error will be rebuilt and thrown.
 * this gives a feeling to the user that server throws error directly to the client,
 * and it makes development easier.
 * it is safe since micro services are internal services, so get error info in client is not worse than catch an
 * error in a traditional mono app
 */
module.exports = () => Broker => class BrokerWithProtocol extends Broker {
  handleRequest (topic, handler) {
    const wrappedHandler = async (inputEnvelope, subject) => {
      try {
        const input = parseRequestEnvelope(inputEnvelope)
        const output = await handler(input, subject)
        return buildResponseEnvelope(output)
      }
      catch (err) {
        err = await this._errorHandler(err) || err
        return buildResponseEnvelope(undefined, err)
      }
    }
    super.handleRequest(topic, wrappedHandler)
  }

  handleNotification (topic, group, handler) {
    if (!handler) {
      handler = group
      group = undefined
    }
    const wrappedHandler = async (inputEnvelope, subject) => {
      const input = parseNotificationEnvelope(inputEnvelope)
      return handler(input, subject)
    }
    super.handleNotification(topic, group, wrappedHandler)
  }

  async request (topic, input) {
    const inputEnvelope = buildRequestEnvelope(input)
    const outputEnvelope = await super.request(topic, inputEnvelope)
    return parseResponseEnvelope(outputEnvelope)
  }

  async notify (topic, input) {
    return super.notify(topic, buildNotificationEnvelope(input))
  }
}

const protocol = 'mpp.1'

function buildRequestEnvelope (input) {
  return {
    protocol,
    type: 'request',
    input
  }
}

function buildNotificationEnvelope (input) {
  return {
    protocol,
    type: 'notification',
    input
  }
}

function buildResponseEnvelope (output, error) {
  return {
    protocol,
    type: 'response',
    output,
    error: error && errorToObject(error)
  }
}

function parseResponseEnvelope (envelope) {
  checkMMPEnvelope(envelope)
  if (envelope.type !== 'response') throw new MMPWrongTypeError(`expect response, but received ${envelope.type}`)
  if (envelope.error) throw causedBy(new MMPResponseError('error response'), objectToError(envelope.error))
  return envelope.output
}

function parseRequestEnvelope (envelope) {
  checkMMPEnvelope(envelope)
  if (envelope.type !== 'request') throw new MMPWrongTypeError(`expect request, but received ${envelope.type}`)
  return envelope.input
}

function parseNotificationEnvelope (envelope) {
  checkMMPEnvelope(envelope)
  if (envelope.type !== 'notification') throw new MMPWrongTypeError(`expect notification, but received ${envelope.type}`)
  return envelope.input
}

function checkMMPEnvelope (envelope) {
  if (!_.isPlainObject(envelope)) throw new ParseError('envelope must be a plain object')
  if (envelope.protocol !== protocol) throw new UnsupportedProtocolError('the protocol of this envelope is unsupported')
}

const UnsupportedProtocolError = makeError(class UnsupportedProtocolError extends Error {})
const ParseError = makeError(class ParseError extends Error {})
const MMPWrongTypeError = makeError(class MMPWrongTypeError extends Error {})
const MMPResponseError = makeError(class MMPResponseError extends Error {})
