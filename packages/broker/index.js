const EJSONSerializer = require('micro-panda-serializer-ejson')
const Protocol = require('micro-panda-protocol')
const {makeError, objectToError, errorToObject} = require('error-utils')

module.exports = class Broker {
  /**
   * @param transporter
   * @param [serializer] - default EJSON
   * @param [errorHandler] - async func(err) => err
   * - about the effect of the return value (only for response error):
   * - if it returns an error, it will be send to client
   * - if it returns non-error, an InternalServerError will be send to client
   * - default behavior is returning the received error
   */
  constructor ({errorHandler, transporter, serializer}) {
    this.errorHandler = errorHandler || defaultErrorHandler
    this.transporter = transporter
    this.serializer = serializer || new EJSONSerializer()
    this.protocol = new Protocol()
  }

  /**
   * should be called after transporter started
   * @param name
   * @param handler - async func(input, message) => output
   */
  define (name, handler) {
    const transporterHandler = async reqData => {
      let reqMessage
      try {
        reqMessage = this.serializer.deserialize(reqData)
        this.protocol.checkRequestEnvelope(reqMessage)
        const output = await handler(reqMessage.input, reqMessage)
        const resMessage = this.protocol.buildResponseEnvelope({requestId: reqMessage.id, output})
        return this.serializer.serialize(resMessage)
      }
      catch (err) {
        err = await this.errorHandler(err)
        if (!err) err = new BrokerError('internal server error')
        const errObj = errorToObject(err)
        const resMessage = this.protocol.buildResponseEnvelope({requestId: reqMessage && reqMessage.id, error: errObj})
        return this.serializer.serialize(resMessage)
      }
    }
    this.transporter.define(name, transporterHandler)
  }

  /**
   * should be called after transporter started
   * @async
   * @param name
   * @param input
   * @param returnMessage
   * - if true, the original response message will be returned directly
   * - else, this function will parse the received response message and return the output
   * - and if the message contains error, it will rebuild the error and throw it
   * @returns output | message
   */
  async call (name, input, returnMessage) {
    const reqMessage = this.protocol.buildRequestEnvelope({input})
    const reqData = this.serializer.serialize(reqMessage)
    const resData = await this.transporter.call(name, reqData)
    const resMessage = this.serializer.deserialize(resData)
    this.protocol.checkResponseEnvelope(resMessage)

    if (returnMessage) return resMessage
    else {
      if (resMessage.error) throw objectToError(resMessage.error)
      else return resMessage.output
    }
  }

  /**
   * should be called after transporter started
   * @param name
   * @param handler - async func(input, message)
   */
  on (name, handler) {
    const transporterHandler = async reqData => {
      try {
        const reqMessage = this.serializer.deserialize(reqData)
        this.protocol.checkEventEnvelope(reqMessage)
        await handler(reqMessage.input, reqMessage)
      }
      catch (err) {
        await this.errorHandler(err)
      }
    }
    this.transporter.on(name, transporterHandler)
  }

  /**
   * should be called after transporter started
   * @async
   * @param name
   * @param input
   */
  async emit (name, input) {
    const reqMessage = this.protocol.buildEventEnvelope({input})
    const reqData = this.serializer.serialize(reqMessage)
    await this.transporter.emit(name, reqData)
  }

  /**
   * proxy for inner transporter
   */
  async start(...args) {
    return await this.transporter.start(...args)
  }

  /**
   * proxy for inner transporter
   */
  async stop(...args) {
    return await this.transporter.stop(...args)
  }
}

function defaultErrorHandler (err) {
  return err
}

const BrokerError = makeError('BrokerError')