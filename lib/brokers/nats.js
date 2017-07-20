const NATS = require('nats')
const {NatsError} = NATS

/**
 * input and output are both msg or buffer
 */
module.exports = class NATSBroker {
  constructor (options = {}) {
    const {errorHandler} = options
    this._errorHandler = errorHandler || defaultErrorHandler
    this._requestHandlers = []
    this._notificationHandlers = []
  }

  /**
   * @param topic
   * @param handler - async func(input, subject) => output
   */
  handleRequest (topic, handler) {
    this._requestHandlers.push({topic, handler})
  }

  /**
   * @param topic
   * @param [group]
   * @param handler - async func(input, subject)
   */
  handleNotification (topic, group, handler) {
    if (!handler) {
      handler = group
      group = undefined
    }
    this._notificationHandlers.push({topic, group, handler})
  }

  _registerRequestHandlers () {
    this._requestHandlers.forEach(({topic, handler}) => {
      this._nats.subscribe(topic, {queue: topic}, (input, replyTo, subject) => {
        Promise.resolve()
          .then(() => handler(input, subject))
          .then(output => replyTo && this._nats.publish(replyTo, output))
          .catch(this._errorHandler)
      })
    })
  }

  _registerNotificationHandlers () {
    this._notificationHandlers.forEach(({topic, group, handler}) => {
      this._nats.subscribe(topic, {queue: group}, (input, replyTo, subject) => {
        Promise.resolve()
          .then(() => replyTo && this._nats.publish(replyTo))
          .then(() => handler(input, subject))
          .catch(this._errorHandler)
      })
    })
  }

  request (topic, input) {
    return new Promise((resolve, reject) => {
      this._nats.request(topic, input, {max: 1}, function (output) {
        if (output instanceof Error || output instanceof NatsError) reject(output)
        else resolve(output)
      })
    })
  }

  notify (topic, input) {
    return new Promise((resolve, reject) => {
      this._nats.publish(topic, input, (output) => {
        if (output instanceof Error || output instanceof NatsError) reject(output)
        else resolve(output)
      })
    })
  }

  start (options) {
    this._nats = NATS.connect(options)
    this._nats.on('error', err => this._errorHandler(err))
    return new Promise((resolve, reject) => {
      this._nats.on('connect', () => {
        this._registerRequestHandlers()
        this._registerNotificationHandlers()
        resolve()
      })
    })
  }

  stop () {
    this._nats.close()
    return new Promise((resolve, reject) => {this._nats.on('close', resolve)})
  }
}

const defaultErrorHandler = (err) => {
  throw err
}