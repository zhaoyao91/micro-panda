const EJSONSerializer = require('micro-panda-serializer-ejson')
const Protocol = require('micro-panda-protocol')
const {BrokerError, RemoteMethodError} = require('./errors')
const {errorToObject, objectToError} = require('error-utils')

module.exports = class Broker {
  /**
   * @param transporter
   * @param [serializer] - default to EJSON serializer
   * @param [errorHandler] - async func(err) - default behavior is `logger.error(err)`
   * @param [remoteMethodErrorHandler] - fields could be overridden individually
   * @param remoteMethodErrorHandler.map - func(err) => err
   * - the returned error will be sent to client
   * - if it returns non-error, a RemoteMethodError without any details will be sent
   * @param remoteMethodErrorHandler.errorToObject - func(err) => object
   * @param remoteMethodErrorHandler.objectToError - func(object) => err
   * @param [logger] - default to console
   */
  constructor ({errorHandler, remoteMethodErrorHandler, transporter, serializer, logger}) {
    this.errorHandler = errorHandler ? errorHandler : err => this.logger.error(err)
    this.remoteMethodErrorHandler = Object.assign({}, defaultRemoteMethodErrorHandler, remoteMethodErrorHandler)
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
        const output = await handler(reqMessage.payload, reqMessage)
        const resMessage = this.protocol.buildResponseEnvelope({payload: output})
        return this.serializer.serialize(resMessage)
      }
      catch (err) {
        await this.errorHandler(err)
        err = this.remoteMethodErrorHandler.map(err)
        if (!(err instanceof Error)) err = new RemoteMethodError('failed to handle request')
        const errObj = this.remoteMethodErrorHandler.errorToObject(err)
        const resMessage = this.protocol.buildResponseEnvelope({error: errObj})
        return this.serializer.serialize(resMessage)
      }
    }
    this.transporter.define(name, transporterHandler)
  }

  /**
   * should be called after started
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
    const reqMessage = this.protocol.buildRequestEnvelope({payload: input})
    const reqData = this.serializer.serialize(reqMessage)
    const resData = await this.transporter.call(name, reqData)
    const resMessage = this.serializer.deserialize(resData)
    this.protocol.checkResponseEnvelope(resMessage)

    if (returnMessage) return resMessage
    else {
      if (resMessage.error) {
        const error = this.remoteMethodErrorHandler.objectToError(resMessage.error)
        error.isRemote = true
        throw error
      }
      else return resMessage.payload
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
        await handler(reqMessage.payload, reqMessage)
      }
      catch (err) {
        await this.errorHandler(err)
      }
    }
    this.transporter.on(name, transporterHandler)
  }

  /**
   * should be called after started
   * @async
   * @param name
   * @param input
   */
  async emit (name, input) {
    const reqMessage = this.protocol.buildEventEnvelope({payload: input})
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

const defaultRemoteMethodErrorHandler = {
  map: err => err,
  errorToObject,
  objectToError,
}