const Joi = require('joi')
const withJoi = require('./with_joi')
const Broker = require('../brokers/memory')
const withSerializer = require('../hobs/with_serializer')
const jsonSerializer = require('../serializers/json')
const withProtocol = require('../hobs/with_protocol')
const {compose} = require('lodash/fp')

describe('withJoi', function () {
  const WrappedBroker = compose(
    withProtocol(),
    withSerializer(jsonSerializer())
  )(Broker)

  let broker = null

  afterEach(async () => {
    await broker.stop()
  })

  test('pass valid input', async () => {
    broker = new WrappedBroker()
    broker.handleRequest('test.joi', withJoi(
      Joi.object().keys({
        name: Joi.string()
      })
    )(input => input))

    await broker.start()

    const output = await broker.request('test.joi', {name: 'Bob'})

    expect(output).toEqual({name: 'Bob'})
  })

  test('block invalid input', async () => {
    expect.assertions(3)
    const errors = []
    broker = new WrappedBroker({errorHandler: (err) => {errors.push(err)}})
    broker.handleRequest('test.joi', withJoi(
      Joi.object().keys({
        name: Joi.string()
      })
    )(input => input))

    await broker.start()

    try {
      await broker.request('test.joi', {name: 22})
    }
    catch (err) {
      expect(err.name).toBe('MMPResponseError')
      expect(err.cause.name).toBe('ValidationError')
    }

    expect(errors[0].name).toBe('ValidationError')
  })
})