const EJSONSerializer = require('micro-panda-serializer-ejson')
const Protocol = require('micro-panda-protocol')
const {RemoteMethodError} = require('./errors')
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
  }

  /**
   * @param name
   * @param handler - async func(input, message) => output
   */
  define (name, handler) {
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
   * @param [group]
   * @param handler - async func(input, message)
   */
  on (name, group, handler) {
    if (!handler) {
      handler = group
      group = undefined
    }
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
    this.transporter.on(name, group, transporterHandler)
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
    return await this.transporter.start(...args)
  }

  async stop (...args) {
    return await this.transporter.stop(...args)
  }
}

const defaultRemoteMethodErrorHandler = {
  map: err => err,
  errorToObject,
  objectToError,
}