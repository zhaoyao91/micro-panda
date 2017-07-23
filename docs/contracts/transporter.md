# Transporter Contract

```ecmascript 6
class Transporter {
  /**
   * should be called after started
   * @param name
   * @param handler - async func(input) => output
   */
  define(name, handler) {}
  
  /**
   * should be called after started
   * @async
   * @param name
   * @param input
   * @returns output
   */
  async call (name, input) {}
  
  /**
   * should be called after started
   * @param name
   * @param [group]
   * @param handler - async func(input)
   */
  on (name, group, handler) {}

  /**
   * should be called after started
   * @async
   * @param name
   * @param input
   */
  async emit (name, input) {}
  
  /**
   * @async
   * @param args - any args it need to properly start the transporter
   */
  async start (...args) {}

  /**
   * @async
   * @param args - any args it need to properly stop the transporter
   */
  async stop (...args) {}
}
```