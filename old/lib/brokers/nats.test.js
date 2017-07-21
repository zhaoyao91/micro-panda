const NATSBroker = require('./nats')

/**
 * there should be a nats server started at localhost:4222
 */

describe('NATSBroker', function () {
  it('should connect successfully', async () => {
    const broker = new NATSBroker()

    await broker.start()
    await broker.stop()
  })

  describe('request', function () {
    it('should request and respond', async () => {
      const broker = new NATSBroker()

      broker.handleRequest('string.double', async (input) => input + input)

      await broker.start()

      const output = await broker.request('string.double', 'hello')

      await broker.stop()

      expect(output).toBe('hellohello')
    })

    it('should receive different outputs from two handlers', async () => {
      const broker1 = new NATSBroker()
      const broker2 = new NATSBroker()
      const broker3 = new NATSBroker()

      broker1.handleRequest('say.id', () => '1')
      broker2.handleRequest('say.id', () => '2')

      await Promise.all([broker1.start(), broker2.start(), broker3.start()])

      const outputPromises = []
      for (let i = 0; i < 100; i++) {
        outputPromises[i] = broker3.request('say.id')
      }
      const outputs = await Promise.all(outputPromises)

      await Promise.all([broker1.stop(), broker2.stop(), broker3.stop()])

      expect(outputs.includes('1')).toBe(true)
      expect(outputs.includes('2')).toBe(true)
    })
  })

  describe('notification', function () {
    it('should notify listeners', async () => {
      expect.assertions(3)

      const broker1 = new NATSBroker()
      const broker2 = new NATSBroker()
      const broker3 = new NATSBroker()

      broker1.handleNotification('some.event', input => expect(input).toBe('Bob'))
      broker2.handleNotification('some.event', input => expect(input).toBe('Bob'))
      broker3.handleNotification('some.event', input => expect(input).toBe('Bob'))

      await Promise.all([broker1.start(), broker2.start(), broker3.start()])

      await broker3.notify('some.event', 'Bob')

      await new Promise(resolve => setTimeout(resolve, 100))

      await Promise.all([broker1.stop(), broker2.stop(), broker3.stop()])
    })

    it('should notify only one of listeners of a group', async () => {
      expect.assertions(1)

      const broker1 = new NATSBroker()
      const broker2 = new NATSBroker()
      const broker3 = new NATSBroker()

      broker1.handleNotification('some.event', 'someGroup', input => expect(input).toBe('Bob'))
      broker2.handleNotification('some.event', 'someGroup', input => expect(input).toBe('Bob'))
      broker3.handleNotification('some.event', 'someGroup', input => expect(input).toBe('Bob'))

      await Promise.all([broker1.start(), broker2.start(), broker3.start()])

      await broker3.notify('some.event', 'Bob')

      await new Promise(resolve => setTimeout(resolve, 100))

      await Promise.all([broker1.stop(), broker2.stop(), broker3.stop()])
    })

    it('should receive all notifications with * pattern', async () => {
      expect.assertions(2)

      const broker = new NATSBroker()

      broker.handleNotification('some.*', input => expect(input).toBe('Bob'))

      await broker.start()

      await broker.notify('some.event.yes', 'Bob')
      await broker.notify('some.event', 'Bob')
      await broker.notify('some.what', 'Bob')
      await broker.notify('other.event', 'Bob') // not received

      await new Promise(resolve => setTimeout(resolve, 100))

      await broker.stop()
    })

    it('should receive all notifications with > pattern', async () => {
      expect.assertions(3)

      const broker = new NATSBroker()

      broker.handleNotification('some.>', input => expect(input).toBe('Bob'))

      await broker.start()

      await broker.notify('some.event.yes', 'Bob')
      await broker.notify('some.event', 'Bob')
      await broker.notify('some.what', 'Bob')
      await broker.notify('other.event', 'Bob') // not received

      await new Promise(resolve => setTimeout(resolve, 100))

      await broker.stop()
    })
  })
})