const Transporter = require('micro-panda-transporter-nats')
const Broker = require('./index')

describe('Broker', function () {
  let transporter = null
  let broker = null

  afterEach(async () => {
    await transporter.stop()
  })

  test('basic request', async () => {
    transporter = new Transporter()
    await transporter.start()
    broker = new Broker({transporter})

    broker.define('test.method', input => input)
    const output = await broker.call('test.method', {name: 'Bob'})

    expect(output).toEqual({name: 'Bob'})
  })

  test('request for message', async () => {
    transporter = new Transporter()
    await transporter.start()
    broker = new Broker({transporter})

    broker.define('test.method', input => input)
    const message = await broker.call('test.method', {name: 'Bob'}, true)

    expect(message.protocol).toBeDefined()
    expect(message.type).toBe('response')
    expect(message.output).toEqual({name: 'Bob'})
  })

  test('error from server to client', async () => {
    expect.assertions(2)

    transporter = new Transporter()
    await transporter.start()
    broker = new Broker({transporter, errorHandler: err => err})

    broker.define('test.method', input => {throw new TypeError('test type error')})
    try {
      await broker.call('test.method', {name: 'Bob'})
    }
    catch (err) {
      expect(err.name).toBe('TypeError')
      expect(err.message).toBe('test type error')
    }
  })

  test('method not found', async () => {
    expect.assertions(2)

    transporter = new Transporter({timeout: 100})
    await transporter.start()
    broker = new Broker({transporter})

    broker.define('test.method', input => input)
    try {
      await broker.call('wrong.method', {name: 'Bob'})
    }
    catch (err) {
      expect(err.name).toBe('NatsError')
      expect(err.message).toMatch(/timed out/)
    }
  })

  test('change error handler', async () => {
    expect.assertions(2)

    transporter = new Transporter()
    await transporter.start()
    broker = new Broker({transporter, errorHandler: err => null})

    broker.define('test.method', input => {throw new TypeError('test type error')})
    try {
      await broker.call('test.method', {name: 'Bob'})
    }
    catch (err) {
      expect(err.name).toBe('BrokerError')
      expect(err.message).toBe('internal server error')
    }
  })

  test('basic event', async () => {
    expect.assertions(4)

    transporter = new Transporter()
    await transporter.start()
    broker = new Broker({transporter})

    broker.on('test.event', (input, message) => {
      expect(input).toEqual({name: 'Bob'})
      expect(message.protocol).toBeDefined()
      expect(message.type).toBe('event')
      expect(message.input).toEqual({name: 'Bob'})
    })
    await broker.emit('test.event', {name: 'Bob'})
  })
})