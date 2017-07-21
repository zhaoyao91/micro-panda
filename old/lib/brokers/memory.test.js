const MemoryBroker = require('./memory')

describe('MemoryBroker', function () {
  it('should connect successfully', async () => {
    const broker = new MemoryBroker()

    await broker.start()
    await broker.stop()
  })

  describe('request', function () {
    it('should request and respond', async () => {
      const broker = new MemoryBroker()

      broker.handleRequest('string.double', async (input) => input + input)

      await broker.start()

      const output = await broker.request('string.double', 'hello')

      await broker.stop()

      expect(output).toBe('hellohello')
    })

    it('should receive different outputs from two handlers', async () => {
      const broker = new MemoryBroker()

      broker.handleRequest('say.id', () => '1')
      broker.handleRequest('say.id', () => '2')

      await broker.start()

      const outputPromises = []
      for (let i = 0; i < 100; i++) {
        outputPromises[i] = broker.request('say.id')
      }
      const outputs = await Promise.all(outputPromises)

      await broker.stop()

      expect(outputs.includes('1')).toBe(true)
      expect(outputs.includes('2')).toBe(true)
    })
  })

  describe('notification', function () {
    it('should notify listeners', async () => {
      expect.assertions(3)

      const broker = new MemoryBroker()

      broker.handleNotification('some.event', input => expect(input).toBe('Bob'))
      broker.handleNotification('some.event', input => expect(input).toBe('Bob'))
      broker.handleNotification('some.event', input => expect(input).toBe('Bob'))

      await broker.start()

      await broker.notify('some.event', 'Bob')

      await new Promise(resolve => setTimeout(resolve, 10))

      await broker.stop()
    })

    it('should notify only one of listeners of a group', async () => {
      expect.assertions(1)

      const broker = new MemoryBroker()

      broker.handleNotification('some.event', 'someGroup', input => expect(input).toBe('Bob'))
      broker.handleNotification('some.event', 'someGroup', input => expect(input).toBe('Bob'))
      broker.handleNotification('some.event', 'someGroup', input => expect(input).toBe('Bob'))

      await broker.start()

      await broker.notify('some.event', 'Bob')

      await new Promise(resolve => setTimeout(resolve, 10))

      await broker.stop()
    })

    it('should receive all notifications with * pattern', async () => {
      expect.assertions(2)

      const broker = new MemoryBroker()

      broker.handleNotification('some.*', input => expect(input).toBe('Bob'))

      await broker.start()

      await broker.notify('some.event.yes', 'Bob')
      await broker.notify('some.event', 'Bob')
      await broker.notify('some.what', 'Bob')
      await broker.notify('other.event', 'Bob') // not received

      await new Promise(resolve => setTimeout(resolve, 10))

      await broker.stop()
    })

    it('should receive all notifications with > pattern', async () => {
      expect.assertions(3)

      const broker = new MemoryBroker()

      broker.handleNotification('some.>', input => expect(input).toBe('Bob'))

      await broker.start()

      await broker.notify('some.event.yes', 'Bob')
      await broker.notify('some.event', 'Bob')
      await broker.notify('some.what', 'Bob')
      await broker.notify('other.event', 'Bob') // not received

      await new Promise(resolve => setTimeout(resolve, 10))

      await broker.stop()
    })
  })
})