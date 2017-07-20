const NATS = require('nats')
const {NatsError} = NATS

module.exports = class NATSTransporterPlugin {
  constructor (options = {}) {
    const {name, nats, errorHandler} = options
    this.name = name || 'transporter'
    this._natsOptions = nats
    this._errorHandler = errorHandler || defaultErrorHandler
  }

  async start () {
    this.nats = NATS.connect(this._natsOptions)
    this.nats.on('error', err => this._errorHandler(err))
    await new Promise((resolve, reject) => {this.nats.on('connect', resolve)})
  }

  async stop () {
    this.nats.close()
    await new Promise((resolve, reject) => {this.nats.on('close', resolve)})
  }

  /**
   * @param topic
   * @param group
   * @param handler - async func(input, subject) => output
   */
  handleRequest ({topic, group}, handler) {
    const nats = this.nats
    nats.subscribe(topic, {queue: group}, (request, replyTo, subject) => {
      Promise.resolve()
        .then(() => handler(request, subject))
        .then(result => replyTo && nats.publish(replyTo, result))
        .catch(this._errorHandler)
    })
  }

  handleNotification ({topic, group}, handler) {
    const nats = this.nats
    nats.subscribe(topic, {queue: group}, (request, replyTo, subject) => {
      Promise.resolve()
      // sender should not supply reply subject for a notification
      // but if it does, reply it quickly
        .then(() => replyTo && nats.publish(replyTo))
        .then(() => handler(request, subject))
        .catch(this._errorHandler)
    })
  }

  async request ({topic, input}) {
    const nats = this.nats
    return await new Promise((resolve, reject) => {
      nats.request(topic, input, {max: 1}, function (output) {
        if (output instanceof NatsError) reject(output)
        else resolve(output)
      })
    })
  }

  async notify ({topic, input}) {
    const nats = this.nats
    return await new Promise((resolve, reject) => {
      nats.publish(topic, input, (err) => {
        if (err) reject(err)
        else resolve(err)
      })
    })
  }
}

const defaultErrorHandler = (err) => {
  throw err
}

// common transporter plugin format
// class TransporterPlugin {
//   constructor (options) {
//
//   }
//
//   listenToRequest ({topic, group}, handler) {
//
//   }
//
//   listenToNotification ({topic, group}, handler) {
//
//   }
//   async request({topic}) {
//
//   }
//
//   async notify({topic}) {
//
//   }
// }