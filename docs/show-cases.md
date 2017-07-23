# Show Cases

These show cases use NATS transporter and assume you have already started 
a NATS server with default ports exposed in localhost.

See [how to run a NATS server](http://nats.io/documentation/tutorials/gnatsd-install/).

## Method

Methods are auto load balanced. That means, if you have multiple method definitions with the same name (even spread 
among multiple hosts), only one handler of them will be called for a method invocation.

### basic request and response

```ecmascript 6
const Transporter = require('micro-panda-transporter-nats')
const Broker = require('micro-panda-broker')

const broker = new Broker({transporter: new Transporter()})
broker.define('hello', (name) => `hello ${name}`)

broker.start().then(async () => {
  const output = await broker.call('hello', 'Bob')
  console.log(output) // 'hello Bob'
})
```

### error transfer

Error thrown in server will be delivered to client as it was, this make the caller feel like he is calling a local method.

```ecmascript 6
const Transporter = require('micro-panda-transporter-nats')
const Broker = require('micro-panda-broker')

const broker = new Broker({transporter: new Transporter()})
broker.define('hello', (name) => {
  // just throw the error as needed in server handler
  // it will be thrown to the client
  if (typeof name !== 'string') throw new TypeError('name must be a string')
  return `hello ${name}`
})

broker.start().then(async () => {
  try {
    await broker.call('hello', 20)
  }
  catch (err) {
    // err has all the fields as it was thrown
    // err.isRemote denote it is a remote error
    console.error(err)
  }
})
```

## Event

### emit events

```ecmascript 6
const Transporter = require('micro-panda-transporter-nats')
const Broker = require('micro-panda-broker')

const broker = new Broker({transporter: new Transporter()})
broker.on('hello', (name) => console.log(`hello ${name}`))
broker.on('hello.world', (name) => console.log(`hello.world $name`))

// note: * and > are NATS specific features
// they may not be implemented in other transporter unless transporter contract updated
broker.on('hello.*', (name) => console.log(`hello.* $name`))
broker.on('hello.>', (name) => console.log(`hello.> ${name}`))

broker.start().then(async () => {
  await broker.emit('hello', 'Bob') // 'hello Bob'
  await broker.emit('hello.world', 'Bob') // 'hello.world Bob', 'hello.* Bob', 'hello.> Bob'
  await broker.emit('hello.other', 'Bob') // 'hello.* Bob', 'hello.> Bob'
  await broker.emit('hello.other.world', 'Bob') // 'hello.> bob'
})
```

### load balance with group

Events handlers could declare themselves in some group. For an event, if there are many listeners but they are in the
the same group, only one of them will receive this event.

```ecmascript 6
const Transporter = require('micro-panda-transporter-nats')
const Broker = require('micro-panda-broker')

const broker = new Broker({transporter: new Transporter()})
broker.on('hello', 'test-group', (name) => console.log(`hello ${name}`))
broker.on('hello', 'test-group', (name) => console.log(`I love ${name}`))
broker.on('hello', 'test-group', (name) => console.log(`kick ${name}`))

broker.start().then(async () => {
  await broker.emit('hello', 'Bob')
  // 'hello Bob', 'I love Bob' or 'kick Bob'
})
```

## More

### input validation (with Joi)

Validating input is easy with [Joi](https://github.com/hapijs/joi) and our joi validator.

```ecmascript 6
const Transporter = require('micro-panda-transporter-nats')
const Broker = require('micro-panda-broker')
const validate = require('micro-panda-validator-joi')
const joi = require('joi')

const broker = new Broker({transporter: new Transporter()})

// input should be a string
broker.define('hello', validate(
  joi.string()
)(name => `hello ${name}`))

// input should be an object
// this example shows a shortcut for joi.object().keys({...})
broker.define('hi', validate({
  name: joi.string(),
  age: joi.number(),
})(user => `hi ${user.name} at ${user.age}`))

broker.start().then(async () => {
  console.log(await broker.call('hello', 'Bob'))
  // 'hello Bob'
  
  console.log(await broker.call('hello', 1024))
  // Error: ValidationError
  
  console.log(await broker.call('hi', {name: 'Bob', age: 22}))
  // 'hi Bob at 22'
  
  console.log(await broker.call('hi', {name: 'Bob', age: 'secret'}))
  // Error: ValidationError
})
```

### http gateway

You can use our http gateway to expose your api via http.

```ecmascript 6
const Transporter = require('micro-panda-transporter-nats')
const Broker = require('micro-panda-broker')
const buildService = require('micro-panda-gateway-http')

const broker = new Broker({transporter: new Transporter()})
const service = buildService({broker})

broker.define('hello', name => `hello ${name}`)
broker.on('hello', user => console.log(user))

broker.start()
service.listen(3000)

// post http://localhost:3000/call/hello with body "Bob"
// response body is "hello Bob"

// post http://localhost:3000/emit/hello with body {"name": "Bob", "age": 22}
// response body is {"name": "Bob", "age": 22}

// Note: both request and response body should be valid JSON
```
