module.exports = serializer => Broker => class BrokerWithSerializer extends Broker {
  handleRequest (topic, handler) {
    super.handleRequest(topic, wrapHandler(serializer, handler))
  }

  handleNotification (topic, group, handler) {
    if (!handler) {
      handler = group
      group = undefined
    }
    super.handleNotification(topic, group, wrapHandler(serializer, handler))
  }

  async request (topic, input) {
    const output = await super.request(topic, serializer.serialize(input))
    return serializer.deserialize(output)
  }

  async notify (topic, input) {
    return super.notify(topic, serializer.serialize(input))
  }
}

function wrapHandler (serializer, handler) {
  return async (input, subject) => {
    input = serializer.deserialize(input)
    const output = await handler(input, subject)
    return serializer.serialize(output)
  }
}