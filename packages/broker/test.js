const Transporter = require('micro-panda-transporter-nats')
const Broker = require('./index')
const _ = require('lodash')

describe('Broker', function () {
  let broker = null

  afterEach(async () => {
    await broker.stop()
  })

  test('basic request', async () => {
    broker = new Broker({transporter: new Transporter()})
    await broker.start()

    broker.define('test.method', input => input)
    const output = await broker.call('test.method', {name: 'Bob'})

    expect(output).toEqual({name: 'Bob'})
  })

  test('request for message', async () => {
    broker = new Broker({transporter: new Transporter()})
    await broker.start()

    broker.define('test.method', input => input)
    const message = await broker.call('test.method', {name: 'Bob'}, true)

    expect(message.protocol).toBeDefined()
    expect(message.type).toBe('response')
    expect(message.payload).toEqual({name: 'Bob'})
  })

  test('error from server to client', async () => {
    expect.assertions(2)

    broker = new Broker({transporter: new Transporter(), errorHandler: () => {}})
    await broker.start()

    broker.define('test.method', input => {throw new TypeError('test type error')})
    try {
      await broker.call('test.method', {name: 'Bob'})
    }
    catch (err) {
      expect(err.name).toBe('TypeError')
      expect(err.isRemote).toBe(true)
    }
  })

  test('method not found', async () => {
    expect.assertions(2)

    broker = new Broker({transporter: new Transporter({timeout: 100})})
    await broker.start()

    broker.define('test.method', input => input)
    try {
      await broker.call('wrong.method', {name: 'Bob'})
    }
    catch (err) {
      expect(err.name).toBe('NatsError')
      expect(err.message).toMatch(/timed out/)
    }
  })

  test('change remote method error handler', async () => {
    expect.assertions(2)

    broker = new Broker({
      transporter: new Transporter(),
      errorHandler: () => {},
      remoteMethodErrorHandler: {map: err => null}
    })
    await broker.start()

    broker.define('test.method', input => {throw new TypeError('test type error')})
    try {
      await broker.call('test.method', {name: 'Bob'})
    }
    catch (err) {
      expect(err.name).toBe('RemoteMethodError')
      expect(err.message).toBe('failed to handle request')
    }
  })

  test('change error handler', async () => {
    expect.assertions(2)

    broker = new Broker({
      transporter: new Transporter(),
      errorHandler: (err) => {expect(err instanceof Error).toBe(true)}
    })
    await broker.start()

    broker.define('test.method', input => {throw new TypeError('test type error')})
    try {
      await broker.call('test.method', {name: 'Bob'})
    }
    catch (err) {
      expect(err.name).toBe('TypeError')
    }
  })

  test('basic event', async () => {
    expect.assertions(4)

    broker = new Broker({transporter: new Transporter()})
    await broker.start()

    broker.on('test.event', (input, message) => {
      expect(input).toEqual({name: 'Bob'})
      expect(message.protocol).toBeDefined()
      expect(message.type).toBe('event')
      expect(message.payload).toEqual({name: 'Bob'})
    })
    await broker.emit('test.event', {name: 'Bob'})
  })

  test('group event', async () => {
    broker = new Broker({transporter: new Transporter()})
    await broker.start()

    const results = []
    broker.on('test.event', 'test-group', () => results.push('hello world'))
    broker.on('test.event', 'test-group', () => results.push('hi world'))

    const promises = _.range(100).map(() => broker.emit('test.event', 'yes'))
    await Promise.all(promises)
    expect(results.length).toBe(100)
    expect(results.includes('hi world')).toBe(true)
    expect(results.includes('hello world')).toBe(true)
  })

  test('define method before started', async () => {
    broker = new Broker({transporter: new Transporter()})

    broker.define('test.method', input => input)

    await broker.start()

    const output = await broker.call('test.method', {name: 'Bob'})

    expect(output).toEqual({name: 'Bob'})
  })

  test('listen to event before started', async () => {
    expect.assertions(4)

    broker = new Broker({transporter: new Transporter()})

    broker.on('test.event', (input, message) => {
      expect(input).toEqual({name: 'Bob'})
      expect(message.protocol).toBeDefined()
      expect(message.type).toBe('event')
      expect(message.payload).toEqual({name: 'Bob'})
    })

    await broker.start()

    await broker.emit('test.event', {name: 'Bob'})
  })
})