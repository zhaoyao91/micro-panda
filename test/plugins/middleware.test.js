const PluginStack = require('../../lib/plugin_stack')
const MiddlewarePlugin = require('../../lib/plugins/middleware')

describe('MiddlewarePlugin', function () {
  test('work well', async () => {
    const records = []

    const md1 = async (ctx, next) => {
      records.push(`hi md1 ${ctx.name}`)
      await next(ctx)
      records.push('bye md1')
    }

    const md2 = async (ctx, next) => {
      records.push(`hi md2 ${ctx.name}`)
      await next(ctx)
      records.push('bye md2')
    }

    const middlewarePlugin = new MiddlewarePlugin({
      middleware: [md1, md2]
    })

    const dataFeedingPlugin = {
      name: 'data-feeding',
      async start(options) {
        await options.plugins.middleware.entry(options)
      }
    }

    const ps = new PluginStack([middlewarePlugin, dataFeedingPlugin])
    await ps.start({name: 'Bob'})

    expect(records).toEqual(['hi md1 Bob', 'hi md2 Bob', 'bye md2', 'bye md1'])
  })

  test('add middleware dynamically', async () => {
    expect.assertions(1)

    const md1 = async (ctx, next) => {
      await next({from: 'md1'})
    }

    const md2 = async (ctx, next) => {
      expect(ctx.from).toBe('md1')
      await next()
    }

    const middlewarePlugin = new MiddlewarePlugin({
      middleware: [md1]
    })

    const triggerPlugin = {
      name: 'trigger',
      start(options) {this.middleware = options.plugins.middleware},
      async trigger() {await this.middleware.entry()}
    }

    const ps = new PluginStack([middlewarePlugin, triggerPlugin])
    await ps.start()
    await triggerPlugin.trigger()
    middlewarePlugin.add(md2)
    await triggerPlugin.trigger()
  })

  test('empty middleware', () => {
    expect(() => new MiddlewarePlugin()).not.toThrow()
  })
})