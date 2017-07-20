const PluginStack = require('../lib/plugin_stack')

describe('PluginStack', function () {
  test('work well', async () => {
    const records = []

    const p1 = {
      name: 'p1',
      async start() {
        const result = await Promise.resolve('hello p1')
        records.push(result)
      },
      async stop() {
        const result = await Promise.resolve('bye p1')
        records.push(result)
      }
    }

    const p2 = {
      name: 'p2',
      async start() {
        const result = await Promise.resolve('hello p2')
        records.push(result)
      },
      async stop() {
        const result = await Promise.resolve('bye p2')
        records.push(result)
      }
    }

    const pluginStack = new PluginStack([p1, p2])
    await pluginStack.start()
    await pluginStack.stop()

    expect(records).toEqual(['hello p1', 'hello p2', 'bye p2', 'bye p1'])
  })

  test('plugin has access to other plugin', async () => {
    const p1 = {
      name: 'p1'
    }

    const p2 = {
      name: 'p2',
      start(options) {
        expect(options.plugins.p1.name).toBe('p1')
      },
      stop(options) {
        expect(options.plugins.p1.name).toBe('p1')
      }
    }

    const pluginStack = new PluginStack([p1, p2])
    await pluginStack.start()
    await pluginStack.stop()
  })

  test('wrong plugin', async () => {
    expect(() => {
      new PluginStack(['plugin'])
    }).toThrow('plugin must be an object')

    expect(() => {
      new PluginStack([{}])
    }).toThrow('plugin must have a name')

    expect(() => {
      new PluginStack([{name: 'plugin'}, {name: 'plugin'}])
    }).toThrow('duplicate plugin name: plugin')
  })

  test('empty plugin stack', async () => {
    expect(() => {new PluginStack()}).not.toThrow()
  })
})