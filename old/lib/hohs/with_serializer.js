module.exports = function (serializer) {
  return function (handler) {
    return async (input, subject) => {
      input = serializer.deserialize(input)
      const output = await handler(input, subject)
      return serializer.serialize(output)
    }
  }
}