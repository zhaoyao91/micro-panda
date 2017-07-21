const Broker = require('../brokers/memory')
const withSerializer = require('./with_serializer')
const jsonSerializer = require('../serializers/json')

describe('withSerialization', () => {
  test('work well', async () => {
    expect.assertions(3)

    const BrokerWithSerializer = withSerializer(jsonSerializer())(Broker)
    const broker = new BrokerWithSerializer()

    broker.handleRequest('topic.request', input => {
      expect(input).toEqual({name: 'Bob'})
      return input
    })

    broker.handleNotification('topic.notification', input => {
      expect(input).toEqual({name: 'Bob'})
    })

    await broker.start()

    await expect(broker.request('topic.request', {name: 'Bob'})).resolves.toEqual({name: 'Bob'})
    await broker.notify('topic.notification', {name: 'Bob'})

    await new Promise(resolve => setTimeout(resolve, 10))

    await broker.stop()
  })
})