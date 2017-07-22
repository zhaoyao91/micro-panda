const Transporter = require('./index')
const NATS = require('nats')

describe('Transporter', () => {
  let transporter = null
  let transporter2 = null

  afterEach(() => {
    if (transporter) {
      transporter.stop()
      transporter = null
    }
    if (transporter2) {
      transporter2.stop()
      transporter2 = null
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
    transporter = new Transporter({timeout: 100})
    transporter.setErrorHandler(err => errors.push(err))
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
    await transporter.start()
    await transporter2.start()

    let counter = 0
    transporter.define('test.method', () => {
      counter++
      return 'hello'
    })
    transporter2.define('test.method', () => {
      counter++
      return 'world'
    })

    let outputs = []
    for (let i = 0; i < 100; i++) {
      outputs.push(transporter.call('test.method'))
    }
    outputs = await Promise.all(outputs)

    expect(outputs.includes('hello')).toBe(true)
    expect(outputs.includes('world')).toBe(true)
    expect(counter).toBe(100)
  })
})