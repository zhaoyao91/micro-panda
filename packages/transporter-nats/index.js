const NATS = require('nats')

module.exports = class NATSTransporter {
  /**
   * @param options
   * @param options.errorHandler - function(err)
   * @param options.timeout - milliseconds
   */
  constructor (options = {}) {
    const {errorHandler, timeout} = options
    this._timeout = timeout || 60 * 1000 // default to 1 minute
    this._errorHandler = errorHandler || defaultErrorHandler
    this._methodHandlers = []
    this._eventHandlers = []
    this._status = 'stopped'
  }

  /**
   * @param name
   * @param handler - async func(input) => output
   */
  define (name, handler) {
    name = `method.${name}`
    this._methodHandlers.push([name, handler])
    if (this._status === 'started') this._define(name, handler)
  }

  _define (name, handler) {
    this.nats.subscribe(name, {queue: name}, (input, replyTo, subject) => {
      Promise.resolve(input)
        .then(handler)
        .then(output => replyTo && this.nats.publish(replyTo, output))
        .catch(this._errorHandler)
    })
  }

  /**
   * should be called after started
   * @async
   * @param name
   * @param input
   * @returns output
   */
  async call (name, input) {
    name = `method.${name}`
    return new Promise((resolve, reject) => {
      this.nats.requestOne(name, input, {max: 1}, this._timeout, output => {
        if (output instanceof Error) reject(output)
        else resolve(output)
      })
    })
  }

  /**
   * @param name
   * @param [group]
   * @param handler - async func(input)
   */
  on (name, group, handler) {
    if (!handler) {
      handler = group
      group = undefined
    }
    name = `event.${name}`
    this._eventHandlers.push([name, group, handler])
    if (this._status === 'started') this._on(name, group, handler)
  }

  _on (name, group, handler) {
    this.nats.subscribe(name, {queue: group}, (input, replyTo, subject) => {
      Promise.resolve(input)
        .then(handler)
        .catch(this._errorHandler)
    })
  }

  /**
   * should be called after started
   * @async
   * @param name
   * @param input
   */
  async emit (name, input) {
    name = `event.${name}`
    return new Promise((resolve, reject) => {
      this.nats.publish(name, input, error => {
        if (error) reject(error)
        else resolve()
      })
    })
  }

  async start (options) {
    if (this._status !== 'stopped') throw new Error('transporter is not stopped')
    this._status = 'starting'
    this.nats = NATS.connect(options)
    this.nats.on('error', this._errorHandler)
    return new Promise((resolve, reject) => {
      this.nats.on('connect', () => {
        this._methodHandlers.forEach(([name, handler]) => this._define(name, handler))
        this._eventHandlers.forEach(([name, group, handler]) => this._on(name, group, handler))
        this._status = 'started'
        resolve()
      })
    })
  }

  async stop () {
    if (this._status !== 'started') throw new Error('transporter is not started')
    this._status = 'stopping'
    this.nats.close()
    return new Promise((resolve, reject) => {
      this.nats.on('close', () => {
        this._status = 'stopped'
        resolve()
      })
    })
  }
}

function defaultErrorHandler (err) {
  throw err
}