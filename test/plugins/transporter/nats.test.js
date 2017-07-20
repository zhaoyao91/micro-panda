const PluginStack = require('../../../lib/plugin_stack')
const NATSTransporterPlugin = require('../../../lib/plugins/transporters/nats')

/**
 * NATS server is needed running at localhost:4222
 */

describe('NATSTransporterPlugin', function () {
  test('connection', async () => {
    const ps = new PluginStack([
      new NATSTransporterPlugin()
    ])

    await expect(ps.start()).resolves.toBe()
    await expect(ps.stop()).resolves.toBe()
  })
})