const Transporter = require('./index')
const NATS = require('nats')

describe('Transporter', () => {
  let transporter = null
  let transporter2 = null
  let transporter3 = null

  afterEach(() => {
    if (transporter) {
      transporter.stop()
      transporter = null
    }
    if (transporter2) {
      transporter2.stop()
      transporter2 = null
    }
    if (transporter3) {
      transporter3.stop()
      transporter3 = null
    }
  })

  test('basic method', async () => {
    transporter = new Transporter()
    await transporter.start()

    transporter.define('test.method', name => `hello ${name}`)

    const output = await transporter.call('test.method', 'Bob')

    expect(output).toBe('hello Bob')
  })

  test('method not found', async () => {
    expect.assertions(1)

    transporter = new Transporter({timeout: 100})
    await transporter.start()

    transporter.define('test.method', name => `hello ${name}`)

    try {
      await transporter.call('no.method', 'Bob')
    }
    catch (err) {
      expect(err.code).toBe(NATS.REQ_TIMEOUT)
    }
  })

  test('error in handler', async () => {
    expect.assertions(2)

    const errors = []
    transporter = new Transporter({timeout: 100, errorHandler: err => errors.push(err)})
    await transporter.start()

    transporter.define('test.method', () => {throw new Error('test error')})

    try {
      await transporter.call('test.method', 'Bob')
    }
    catch (err) {
      expect(err.code).toBe(NATS.REQ_TIMEOUT)
    }

    expect(errors[0].message).toBe('test error')
  })

  test('multiple handlers of same method name', async () => {
    transporter = new Transporter()
    transporter2 = new Transporter()
    transporter3 = new Transporter()
    await transporter.start()
    await transporter2.start()
    await transporter3.start()

    let counter = 0
    transporter.define('test.method', async () => {
      counter++
      return 'hello'
    })
    transporter2.define('test.method', () => {
      counter++
      return 'world'
    })

    let outputs = []
    for (let i = 0; i < 100; i++) {
      outputs.push(transporter3.call('test.method'))
    }
    outputs = await Promise.all(outputs)

    expect(outputs.includes('hello')).toBe(true)
    expect(outputs.includes('world')).toBe(true)
    expect(counter).toBe(100)
  })

  test('basic event', async () => {
    expect.assertions(1)

    transporter = new Transporter()
    await transporter.start()

    transporter.on('test.event', input => expect(input).toBe('hello world'))
    await transporter.emit('test.event', 'hello world')
  })

  test('event to many listeners', async () => {
    expect.assertions(3)

    transporter = new Transporter()
    await transporter.start()

    transporter.on('test.event', input => expect(input).toBe('hello world'))
    transporter.on('test.event', input => expect(input).toBe('hello world'))
    transporter.on('test.event', input => expect(input).toBe('hello world'))

    await transporter.emit('test.event', 'hello world')
  })

  test('for a event, only one of members of a group will receive it', async () => {
    expect.assertions(2)

    transporter = new Transporter()
    await transporter.start()

    transporter.on('test.event', input => expect(input).toBe('hello world'))
    transporter.on('test.event', 'test-group', input => expect(input).toBe('hello world'))
    transporter.on('test.event', 'test-group', input => expect(input).toBe('hello world'))

    await transporter.emit('test.event', 'hello world')
  })

  test('event name with *', async () => {
    expect.assertions(2)

    transporter = new Transporter()
    await transporter.start()

    transporter.on('test.*', input => expect(input).toBe('hello world'))

    await transporter.emit('test.event', 'hello world')
    await transporter.emit('test.other', 'hello world')
  })

  test('event name with * (2)', async () => {
    expect.assertions(0)

    transporter = new Transporter()
    await transporter.start()

    transporter.on('test.*', input => expect(input).toBe('hello world'))

    await transporter.emit('test.event.other', 'hello world')
  })

  test('event name with >', async () => {
    expect.assertions(2)

    transporter = new Transporter()
    await transporter.start()

    transporter.on('test.>', input => expect(input).toBe('hello world'))

    await transporter.emit('test.event', 'hello world')
    await transporter.emit('test.event.other', 'hello world')
  })

  test('event name with > (2)', async () => {
    expect.assertions(0)

    transporter = new Transporter()
    await transporter.start()

    transporter.on('test.>', input => expect(input).toBe('hello world'))

    await transporter.emit('test', 'hello world')
    await transporter.emit('wrong.event.other', 'hello world')
  })

  test('define before started', async () => {
    transporter = new Transporter()

    transporter.define('test.method', name => `hello ${name}`)

    await transporter.start()

    await expect(transporter.call('test.method', 'Bob')).resolves.toBe('hello Bob')

    await transporter.stop()
    await transporter.start()

    await expect(transporter.call('test.method', 'Bob')).resolves.toBe('hello Bob')
  })

  test('listen to event before started', async () => {
    expect.assertions(2)

    transporter = new Transporter()
    transporter.on('test.event', input => expect(input).toBe('hello world'))
    transporter.on('test.event2', input => expect(input).toBe('hi world'))

    await transporter.start()
    await transporter.emit('test.event', 'hello world')

    await transporter.stop()
    await transporter.start()
    await transporter.emit('test.event2', 'hi world')
  })
})