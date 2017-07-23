# Serializer Contract

```ecmascript 6
class Serializer {
  /**
   * @param data - application data
   * @returns result - data that can be transferred by the underlying transporter
   */
  serialize (data) {}

  /**
   * @param data - data received from transporter
   * @returns result - application data
   */
  deserialize (data) {}
}
```