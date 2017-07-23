const validate = require('./index')
const Broker = require('micro-panda-broker')
const Transporter = require('micro-panda-transporter-nats')
const joi = require('joi')

describe('JoiValidator', function () {
  let broker = null

  afterEach(async () => {
    await broker.stop()
  })

  test('validate string', async () => {
    broker = new Broker({transporter: new Transporter()})
    await broker.start()

    broker.define('test.joi', validate(joi.string())(input => input))

    const output = await broker.call('test.joi', 'hello world')

    expect(output).toEqual('hello world')
  })

  test('validate object', async () => {
    broker = new Broker({transporter: new Transporter()})
    await broker.start()

    broker.define('test.joi', validate({
      name: joi.string()
    })(input => input))

    const output = await broker.call('test.joi', {name: 'Bob'})

    expect(output).toEqual({name: 'Bob'})
  })

  test('block invalid input', async () => {
    expect.assertions(1)

    broker = new Broker({transporter: new Transporter(), logger: {error(){}}})
    await broker.start()

    broker.define('test.joi', validate({
      name: joi.string(),
      age: joi.number(),
    })(input => input))

    try {
      await broker.call('test.joi', {name: 'Bob', age: 'twenty-two'})
    }
    catch (err) {
      expect(err.name).toBe('ValidationError')
    }
  })
})