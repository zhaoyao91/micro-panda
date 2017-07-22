const EJSONSerializer = require('micro-panda-serializer-ejson')
const Protocol = require('micro-panda-protocol')
const {makeError, objectToError, errorToObject} = require('error-utils')

module.exports = class Broker {
  /**
   * @param transporter
   * @param [serializer] - default to EJSON serializer
   * @param [errorHandler] - async func(err) => err
   * - the returned error will have some effect on the response
   * - if it returns an error, it will be send to client
   * - if it returns non-error, an BrokerError will be send to client
   * - the default behavior is logging the error and returning the received error
   * @param [logger] - default to console
   */
  constructor ({errorHandler, transporter, serializer, logger}) {
    this.errorHandler = errorHandler ? errorHandler : err => {
      this.logger.error(err)
      return err
    }
    this.transporter = transporter
    this.serializer = serializer || new EJSONSerializer()
    this.protocol = new Protocol()
    this.logger = logger || console
    this.methodHandlers = []
    this.eventHandlers = []
  }

  /**
   * @param name
   * @param handler - async func(input, message) => output
   */
  define (name, handler) {
    this.methodHandlers.push([name, handler])
    if (this._started) this._define(name, handler)
  }

  _define (name, handler) {
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
   * @param name
   * @param handler - async func(input, message)
   */
  on (name, handler) {
    this.eventHandlers.push([name, handler])
    if (this._started) this._on(name, handler)
  }

  _on (name, handler) {
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

  async start (...args) {
    if (this._started) throw new BrokerError('broker is already started')
    const result = await this.transporter.start(...args)
    this._started = true
    this.methodHandlers.forEach(pair => this._define(...pair))
    this.eventHandlers.forEach(pair => this._on(...pair))
    return result
  }

  async stop (...args) {
    if (!this._started) throw new BrokerError('broker is not started yet')
    this._started = false
    return await this.transporter.stop(...args)
  }
}

const BrokerError = makeError('BrokerError')