module.exports = class PluginStack {
  constructor (plugins = []) {
    this._stack = plugins
    this._map = {}
    plugins.forEach(plugin => {
      if (typeof plugin !== 'object') throw new Error('plugin must be an object')
      if (!plugin.name) throw new Error('plugin must have a name')
      if (this._map.hasOwnProperty(plugin.name)) throw new Error(`duplicate plugin name: ${plugin.name}`)
      this._map[plugin.name] = plugin
    })
  }

  async start (options = {}) {
    await this._stack.reduce((startPromise, plugin) => startPromise.then(() => plugin.start && plugin.start(Object.assign({}, options, {
      plugins: this._map
    }))), Promise.resolve())
  }

  async stop (options = {}) {
    await this._stack.reduceRight((stopPromise, plugin) => stopPromise.then(() => plugin.stop && plugin.stop(Object.assign({}, options, {
      plugins: this._map
    }))), Promise.resolve())
  }
}

// common plugin format
// class Plugin {
//   constructor (options) {
//     this.name = options.name || 'default-name'
//   }
//
//   async start (options) {
//     const {plugins} = options
//   }
//
//   async stop (options) {
//     const {plugins} = options
//   }
// }