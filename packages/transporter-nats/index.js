const NATS = require('nats')

module.exports = class NATSTransporter {
  /**
   * @param options
   * @param options.errorHandler - function(err)
   * @param options.timeout - milliseconds
   */
  constructor (options = {}) {
    const {errorHandler, timeout} = options
    this.timeout = timeout || 5000
    this.errorHandler = errorHandler || defaultErrorHandler
  }

  /**
   * should be called after started
   * @param name
   * @param handler - async func(input) => output
   */
  define (name, handler) {
    this.nats.subscribe(name, {queue: name}, (input, replyTo, subject) => {
      Promise.resolve(input)
        .then(handler)
        .then(output => replyTo && this.nats.publish(replyTo, output))
        .catch(this.errorHandler)
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
    return new Promise((resolve, reject) => {
      this.nats.requestOne(name, input, {max: 1}, this.timeout, output => {
        if (output instanceof Error) reject(output)
        else resolve(output)
      })
    })
  }

  async start (options) {
    this.nats = NATS.connect(options)
    this.nats.on('error', this.errorHandler)
    return new Promise((resolve, reject) => { this.nats.on('connect', () => resolve()) })
  }

  async stop () {
    this.nats.close()
    return new Promise((resolve, reject) => {this.nats.on('close', () => resolve())})
  }
}

function defaultErrorHandler (err) {
  throw err
}