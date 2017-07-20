const _ = require('lodash')

module.exports = class MemoryBroker {
  constructor (options = {}) {
    const {errorHandler} = options
    this._errorHandler = errorHandler || defaultErrorHandler
    this._handlers = []
  }

  /**
   * @param topic
   * @param handler - async func(input, subject) => output
   */
  handleRequest (topic, handler) {
    this._handlers.push({type: 'request', group: topic, topic, handler})
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
    if (group === undefined) group = String(Math.random())
    this._handlers.push({type: 'notification', topic, group, handler})
  }

  async request (topic, input) {
    const matchedHandlers = this._handlers.filter(({topic: pattern}) => matchPattern(pattern, topic)).map(({handler}) => handler)
    const handler = randomlySelect(matchedHandlers)
    if (handler) return handler(input, topic)
  }

  async notify (topic, input) {
    const matchedHandlers = _.groupBy(this._handlers.filter(({topic: pattern}) => matchPattern(pattern, topic)), 'group')
    _.forEach(matchedHandlers, handlers => {
      const {handler} = randomlySelect(handlers)
      handler(input, topic)
    })
  }

  async start () {}

  async stop () {}
}

const defaultErrorHandler = (err) => {
  throw err
}

function matchPattern (pattern, topic) {
  const patternTokens = pattern.split('.')
  const topicTokens = topic.split('.')

  for (let i = 0; i < patternTokens.length; i++) {
    const patternToken = patternTokens[i]
    const topicToken = topicTokens[i]
    if (patternToken === '>') {
      return true
    }
    else if (patternToken === '*') {
      if (!topicToken) return false
    }
    else if (patternToken !== topicToken) {
      return false
    }
  }

  return topicTokens.length === patternTokens.length
}

function randomlySelect (array) {
  return array[Math.floor(Math.random() * array.length)]
}