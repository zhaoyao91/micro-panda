const micro = require('micro')
const {send} = require('micro')
const listen = require('test-listen')
const fetch = require('node-fetch')
const {compose} = require('lodash/fp')

const buildHttpGatewayHandler = require('./http')
const Broker = require('../brokers/nats')
const withProtocol = require('../hobs/with_protocol')
const withSerializer = require('../hobs/with_serializer')
const jsonSerializer = require('../serializers/json')

describe('HTTP Gateway', () => {
  const WrappedBroker = compose(
    withProtocol(),
    withSerializer(jsonSerializer())
  )(Broker)

  let broker = null
  let service = null

  afterEach(async () => {
    await broker.stop()
    service.close()
  })

  test('basic request', async () => {
    broker = new WrappedBroker()
    broker.handleRequest('test.topic', input => input)
    await broker.start()

    const httpHandler = buildHttpGatewayHandler({broker})
    service = micro(httpHandler)
    const url = await listen(service)

    const res = await fetch(`${url}/request/test.topic`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: 'Bob'})
    })

    expect(res.ok).toBe(true)
    await expect(res.json()).resolves.toEqual({name: 'Bob'})
  })

  test('basic notification', async () => {
    expect.assertions(2)
    broker = new WrappedBroker()
    broker.handleNotification('test.topic', input => {expect(input).toEqual({name: 'Bob'})})
    await broker.start()

    const httpHandler = buildHttpGatewayHandler({broker})
    service = micro(httpHandler)
    const url = await listen(service)

    const res = await fetch(`${url}/notify/test.topic`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: 'Bob'})
    })

    expect(res.status).toBe(201)
  })

  test('prefix', async () => {
    broker = new WrappedBroker()
    broker.handleRequest('test.topic', input => input)
    await broker.start()

    const httpHandler = buildHttpGatewayHandler({broker, prefix: '/hello'})
    service = micro(httpHandler)
    const url = await listen(service)

    const res = await fetch(`${url}/hello/request/test.topic`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: 'Bob'})
    })

    expect(res.ok).toBe(true)
    await expect(res.json()).resolves.toEqual({name: 'Bob'})
  })

  test('invalid url', async () => {
    broker = new WrappedBroker()
    broker.handleRequest('test.topic', input => input)
    await broker.start()

    const httpHandler = buildHttpGatewayHandler({broker})
    service = micro(httpHandler)
    const url = await listen(service)

    const res = await fetch(`${url}/invalid/url`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: 'Bob'})
    })

    expect(res.status).toBe(404)
  })

  test('white topics', async () => {
    broker = new WrappedBroker()
    broker.handleRequest('test.topic', input => input)
    broker.handleRequest('test.some', input => input)
    broker.handleRequest('hello.world', input => input)
    broker.handleRequest('hello.some', input => input)
    await broker.start()

    const httpHandler = buildHttpGatewayHandler({
      broker,
      whiteTopics: ['test.*', 'hello.world']
    })
    service = micro(httpHandler)
    const url = await listen(service)

    {
      const res = await fetch(`${url}/request/test.topic`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: 'Bob'})
      })
      expect(res.status).toBe(200)
    }

    {
      const res = await fetch(`${url}/request/test.some`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: 'Bob'})
      })
      expect(res.status).toBe(200)
    }

    {
      const res = await fetch(`${url}/request/hello.world`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: 'Bob'})
      })
      expect(res.status).toBe(200)
    }

    {
      const res = await fetch(`${url}/request/hello.some`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: 'Bob'})
      })
      expect(res.status).toBe(403)
    }
  })

  test('black topics', async () => {
    broker = new WrappedBroker()
    broker.handleRequest('test.topic', input => input)
    broker.handleRequest('test.some.topic', input => input)
    broker.handleRequest('hello.world', input => input)
    broker.handleRequest('hello.some', input => input)
    await broker.start()

    const httpHandler = buildHttpGatewayHandler({
      broker,
      blackTopics: ['test.*.>', 'hello.some']
    })
    service = micro(httpHandler)
    const url = await listen(service)

    {
      const res = await fetch(`${url}/request/test.topic`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: 'Bob'})
      })
      expect(res.status).toBe(200)
    }

    {
      const res = await fetch(`${url}/request/test.some.topic`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: 'Bob'})
      })
      expect(res.status).toBe(403)
    }

    {
      const res = await fetch(`${url}/request/hello.world`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: 'Bob'})
      })
      expect(res.status).toBe(200)
    }

    {
      const res = await fetch(`${url}/request/hello.some`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: 'Bob'})
      })
      expect(res.status).toBe(403)
    }
  })

  test('parse input', async () => {
    broker = new WrappedBroker()
    broker.handleRequest('test.topic', input => input)
    await broker.start()

    const httpHandler = buildHttpGatewayHandler({broker, parseInput: input => input + input})
    service = micro(httpHandler)
    const url = await listen(service)

    const res = await fetch(`${url}/request/test.topic`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(2)
    })

    expect(res.ok).toBe(true)
    await expect(res.json()).resolves.toEqual(4)
  })

  test('parse output', async () => {
    broker = new WrappedBroker()
    broker.handleRequest('test.topic', input => input)
    await broker.start()

    const httpHandler = buildHttpGatewayHandler({broker, parseOutput: input => input + input})
    service = micro(httpHandler)
    const url = await listen(service)

    const res = await fetch(`${url}/request/test.topic`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(2)
    })

    expect(res.ok).toBe(true)
    await expect(res.json()).resolves.toEqual(4)
  })

  test('handle error', async () => {
    const errors = []
    broker = new WrappedBroker({errorHandler: (err) => errors.push(err)})
    broker.handleRequest('test.topic', () => {throw new Error('test error')})
    await broker.start()

    const httpHandler = buildHttpGatewayHandler({broker, errorHandler: (err, req, res) => {
      errors.push(err)
      send(res, 200, 'handled')
    }})
    service = micro(httpHandler)
    const url = await listen(service)

    const res = await fetch(`${url}/request/test.topic`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: 'Bob'})
    })

    expect(res.ok).toBe(true)
    await expect(res.text()).resolves.toBe('handled')

    expect(errors[0].message).toBe('test error')
    expect(errors[1].name).toBe('MMPResponseError')
  })
})