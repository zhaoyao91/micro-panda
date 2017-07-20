/**
 * the middleware abilities is provided by plugin too!
 */

module.exports = class MiddlewarePlugin {
  constructor (options = {}) {
    const {name, middleware = []} = options
    this.name = name || 'middleware'
    this.middleware = middleware
    this.rebuildEntry()
  }

  rebuildEntry () {
    this.entry = this.middleware.reduceRight((next, middleware) => context => middleware(context, next), MiddlewarePlugin.endMiddleware)
  }

  add (...middleware) {
    this.middleware.push(...middleware)
    this.rebuildEntry()
  }

  static endMiddleware () {}
}

// common middleware format
// function buildMiddleware (options) {
//   return async function middleware (context, next) {
//     // before next
//     // ...
//
//     // run next
//     const result = await next(context)
//
//     // after next
//     // ...
//
//     // return
//     return result
//   }
// }