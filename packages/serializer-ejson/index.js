const EJSON = require('ejson')

/**
 * note:
 * - undefined will be serialized and deserialized as undefined
 * - undefined in an array will be serialized as null (JSON spec)
 * - field in object with undefined value will be omitted (JSON spec)
 */
class EJSONSerializer {
  serialize (input) {
    if (input === undefined) return undefined
    else return EJSON.stringify(input)
  }

  deserialize (input) {
    if (input === undefined) return undefined
    else return EJSON.parse(input)
  }
}

EJSONSerializer.EJSON = EJSON

module.exports =  EJSONSerializer