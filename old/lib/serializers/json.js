module.exports = options => ({
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => data === undefined ? undefined : JSON.parse(data),
})