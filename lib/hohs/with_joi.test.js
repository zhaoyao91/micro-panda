const Joi = require('joi')
const withJoi = require('./with_joi')
const Broker = require('../brokers/memory')
const withSerializer = require('../hobs/with_serializer')
const jsonSerializer = require('../serializers/json')

describe('withJoi', function () {
  test('pass valid input', async () => {
    const broker = new (withSerializer(jsonSerializer())(Broker))

    broker.handleRequest('test.joi', withJoi(
      Joi.object().keys({
        name: Joi.string()
      })
    )(input => input))

    await broker.start()

    const output = await broker.request('test.joi', {name: 'Bob'})

    await broker.stop()

    expect(output).toEqual({name: 'Bob'})
  })

  test('block invalid input', async () => {
    const broker = new (withSerializer(jsonSerializer())(Broker))

    broker.handleRequest('test.joi', withJoi(
      Joi.object().keys({
        name: Joi.string()
      })
    )(input => input))

    await broker.start()

    expect(broker.request('test.joi', {name: 123})).rejects.toMatch('error')

    await broker.stop()
  })
})