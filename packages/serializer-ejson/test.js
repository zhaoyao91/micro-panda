const EJSONSerializer = require('./index')

describe('EJSONSerializer', () => {
  const serializer = new EJSONSerializer()
  test('undefined', () => {
    const input = undefined
    const data = serializer.serialize(input)
    const output = serializer.deserialize(data)

    expect(data).toBe(undefined)
    expect(output).toBe(undefined)
  })

  test('null', () => {
    const input = null
    const data = serializer.serialize(input)
    const output = serializer.deserialize(data)

    expect(typeof data).toBe('string')
    expect(output).toEqual(input)
  })

  test('NaN', () => {
    const input = NaN
    const data = serializer.serialize(input)
    const output = serializer.deserialize(data)

    expect(typeof data).toBe('string')
    expect(output).toEqual(input)
  })

  test('Infinity', () => {
    const input = Infinity
    const data = serializer.serialize(input)
    const output = serializer.deserialize(data)

    expect(typeof data).toBe('string')
    expect(output).toEqual(input)
  })

  test('Boolean', () => {
    const input = true
    const data = serializer.serialize(input)
    const output = serializer.deserialize(data)

    expect(typeof data).toBe('string')
    expect(output).toEqual(input)
  })

  test('Number', () => {
    const input = 22
    const data = serializer.serialize(input)
    const output = serializer.deserialize(data)

    expect(typeof data).toBe('string')
    expect(output).toEqual(input)
  })

  test('String', () => {
    const input = 'hello world'
    const data = serializer.serialize(input)
    const output = serializer.deserialize(data)

    expect(typeof data).toBe('string')
    expect(output).toEqual(input)
  })

  test('Date', () => {
    const input = new Date()
    const data = serializer.serialize(input)
    const output = serializer.deserialize(data)

    expect(typeof data).toBe('string')
    expect(output).toEqual(input)
  })

  test('Array', () => {
    const input = [[], [[]]]
    const data = serializer.serialize(input)
    const output = serializer.deserialize(data)

    expect(typeof data).toBe('string')
    expect(output).toEqual(input)
  })

  test('Object', () => {
    const input = {a: {}, b: {c: {}}}
    const data = serializer.serialize(input)
    const output = serializer.deserialize(data)

    expect(typeof data).toBe('string')
    expect(output).toEqual(input)
  })

  test('complex array', () => {
    const input = [undefined, null, NaN, Infinity, false, 33, 'Bob', new Date(), [{
      name: 'Alan',
      age: 44,
      school: undefined
    }]]
    const expectedOutput = [null, null, NaN, Infinity, false, 33, 'Bob', new Date(), [{
      name: 'Alan',
      age: 44,
    }]]
    const data = serializer.serialize(input)
    const output = serializer.deserialize(data)

    expect(typeof data).toBe('string')
    expect(output).toEqual(expectedOutput)
  })

  test('complex object', () => {
    const input = {
      name: 'Bob',
      age: 22,
      birthday: new Date('1991-06-05'),
      pet: null,
      enemy: undefined,
      friends: [undefined, null, {name: 'Panda'}],
      nightmare: NaN,
      lucky: Infinity,
      married: true,
    }
    const expectedOutput = {
      name: 'Bob',
      age: 22,
      birthday: new Date('1991-06-05'),
      pet: null,
      friends: [null, null, {name: 'Panda'}],
      nightmare: NaN,
      lucky: Infinity,
      married: true,
    }
    const data = serializer.serialize(input)
    const output = serializer.deserialize(data)

    expect(typeof data).toBe('string')
    expect(output).toEqual(expectedOutput)
  })
})