const listen = require('test-listen')
const fetch = require('node-fetch')

const Broker = require('micro-panda-broker')
const Transporter = require('micro-panda-transporter-nats')
const buildService = require('./index')

describe('HTTP Gateway', () => {
  let broker = null
  let service = null

  afterEach(async () => {
    await broker.stop()
    service.close()
  })

  test('basic method', async () => {
    broker = new Broker({transporter: new Transporter()})
    await broker.start()
    service = buildService({broker})
    const url = await listen(service)

    broker.define('test.method', input => input)

    const res = await fetch(`${url}/call/test.method`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: 'Bob'})
    })

    expect(res.ok).toBe(true)
    await expect(res.json()).resolves.toEqual({name: 'Bob'})
  })

  test('basic event', async () => {
    expect.assertions(2)

    broker = new Broker({transporter: new Transporter()})
    await broker.start()
    service = buildService({broker})
    const url = await listen(service)

    broker.on('test.event', input => {expect(input).toEqual({name: 'Bob'})})

    const res = await fetch(`${url}/emit/test.event`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: 'Bob'})
    })

    expect(res.status).toBe(201)
  })

  test('prefix', async () => {
    broker = new Broker({transporter: new Transporter()})
    await broker.start()
    service = buildService({broker, prefix: '/prefix'})
    const url = await listen(service)

    broker.define('test.prefix', input => input)

    const res = await fetch(`${url}/prefix/call/test.prefix`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify('hello world')
    })

    expect(res.ok).toBe(true)
    await expect(res.json()).resolves.toBe('hello world')
  })

  test('not found url', async () => {
    broker = new Broker({transporter: new Transporter()})
    await broker.start()
    service = buildService({broker})
    const url = await listen(service)

    const res = await fetch(`${url}/invalid/url`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify('hello world')
    })

    expect(res.status).toBe(404)
  })

  test('allow func', async () => {
    broker = new Broker({transporter: new Transporter()})
    await broker.start()
    service = buildService({broker, allow: (req) => req.url === '/call/test'})
    const url = await listen(service)

    broker.define('test', () => {})

    {
      const res = await fetch(`${url}/call/test`)
      expect(res.status).toBe(200)
    }

    {
      const res = await fetch(`${url}/call/test.wrong`)
      expect(res.status).toBe(403)
    }
  })

  test('error', async () => {
    broker = new Broker({transporter: new Transporter(), logger: {error(){}}})
    await broker.start()
    service = buildService({broker, logger: {error(){}}})
    const url = await listen(service)

    broker.define('error.method', () => {throw new TypeError('test error')})

    const res = await fetch(`${url}/call/error.method`)

    expect(res.status).toBe(500)
    const output = await res.json()
    expect(output.name).toBe('TypeError')
  })
})