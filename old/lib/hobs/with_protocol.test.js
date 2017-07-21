const Broker = require('../brokers/nats')
const withSerializer = require('./with_serializer')
const jsonSerializer = require('../serializers/json')
const withProtocol = require('./with_protocol')
const {compose} = require('lodash/fp')

describe('withProtocol', () => {
  const WrappedBroker = compose(
    withProtocol(),
    withSerializer(jsonSerializer())
  )(Broker)

  let broker = null

  afterEach(async () => {
    await broker.stop()
  })

  test('succeeded request and response', async () => {
    broker = new WrappedBroker()

    broker.handleRequest('topic.test', input => input)

    await broker.start()

    const output = await broker.request('topic.test', {name: 'Bob'})

    expect(output).toEqual({name: 'Bob'})
  })

  test('succeeded notifications', async () => {
    expect.assertions(1)

    broker = new WrappedBroker()

    broker.handleNotification('topic.test', input => expect(input).toEqual({name: 'Bob'}))

    await broker.start()

    const output = await broker.notify('topic.test', {name: 'Bob'})
  })

  test('respond with error', async () => {
    expect.assertions(4)

    const errors = []
    broker = new WrappedBroker({errorHandler: err => {errors.push(err)}})

    broker.handleRequest('topic.test', input => JSON.parse('{'))

    await broker.start()

    try {
      await broker.request('topic.test', {name: 'Bob'})
    }
    catch (err) {
      expect(err.name).toBe('MMPResponseError')
      expect(err.cause.name).toBe('SyntaxError')
    }

    expect(errors.length).toBe(1)
    expect(errors[0].name).toBe('SyntaxError')
  })
})
