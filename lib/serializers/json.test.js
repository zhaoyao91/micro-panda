const jsonSerializer = require('./json')

describe('JSONSerializer', function () {
  const {serialize, deserialize} = jsonSerializer()

  describe('serialize', function () {
    test('object', () => {
      expect(serialize({})).toBe('{}')
    })
    test('array', () => {
      expect(serialize([])).toBe('[]')
    })
    test('string', () => {
      expect(serialize('hello')).toBe('"hello"')
    })
    test('number', () => {
      expect(serialize(3)).toBe('3')
    })
    test('boolean', () => {
      expect(serialize(true)).toBe('true')
    })
    test('null', () => {
      expect(serialize(null)).toBe('null')
    })
    test('undefined', () => {
      expect(serialize()).toBe()
    })
  })

  describe('deserialize', function () {
    test('object', () => {
      expect(deserialize('{}')).toEqual({})
    })
    test('array', () => {
      expect(deserialize('[]')).toEqual([])
    })
    test('string', () => {
      expect(deserialize('"hello"')).toBe('hello')
    })
    test('number', () => {
      expect(deserialize('3')).toBe(3)
    })
    test('boolean', () => {
      expect(deserialize('true')).toBe(true)
    })
    test('null', () => {
      expect(deserialize('null')).toBe(null)
    })
    test('undefined', () => {
      expect(deserialize()).toBe()
    })
  })
})