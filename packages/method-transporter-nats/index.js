const NATS = require('nats')

module.exports = class NATSMessageTransporter {
  constructor (options = {}) {
    // micro services are usually deployed in an internal network
    // in such a circumstance the communication should be fast
    // and heavy work should be handled asynchronously
    // so this default timeout should be long enough
    if (!options.hasOwnProperty('timeout')) options.timeout = 5000

    this.options = options
    this.errorHandler = defaultErrorHandler
    this.methods = {}
  }

  /**
   * @param errorHandler - async func(err)
   */
  setErrorHandler (errorHandler) {
    this.errorHandler = errorHandler
  }

  /**
   * @param name
   * @param handler - async func(input) => output
   */
  define (name, handler) {
    if (this.methods[name]) throw new Error(`duplicate method name: ${name}`)
    this.methods[name] = handler
  }

  async call (name, input) {
    return new Promise((resolve, reject) => {
      this.nats.requestOne(name, input, {max: 1}, this.options.timeout, output => {
        if (output instanceof Error) reject(output)
        else resolve(output)
      })
    })
  }

  async start () {
    this.nats = NATS.connect(this.options)
    this.nats.on('error', this.errorHandler)
    return new Promise((resolve, reject) => {
      this.nats.on('connect', () => {
        this._registerMethods()
        resolve()
      })
    })
  }

  async stop () {
    this.nats.close()
    return new Promise((resolve, reject) => {this.nats.on('close', () => resolve())})
  }

  _registerMethods () {
    for (let name in this.methods) {
      if (this.methods.hasOwnProperty(name)) {
        const handler = this.methods[name]
        this.nats.subscribe(name, {queue: name}, (input, replyTo, subject) => {
          Promise.resolve(input)
            .then(handler)
            .then(output => replyTo && this.nats.publish(replyTo, output))
            .catch(this.errorHandler)
        })
      }
    }
  }
}

function defaultErrorHandler (err) {
  throw err
}