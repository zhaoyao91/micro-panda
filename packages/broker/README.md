# Broker

Message broker which help micro services communicate with each other.

## API

#### constructor

params:

 - transporter
 - [serializer] - default to EJSONSerializer
 - [logger] - default to console
 - [errorHandler] - async func(err) - default behavior is `logger.error(err)`
 - [remoteMethodErrorHandler] - fields could be overridden individually
   - map - func(err) => err - the returned error will be sent to client. if it returns non-error, a RemoteMethodError without any details will be sent
   - errorToObject - func(err) => object
   - objectToError - func(object) => err

#### define

define a method.

params: 

- name
- handler - async func(input, message) => output

#### async call

call a method. should be called after started.

params:

- name
- input
- [returnMessage] - default to false. if true, the method will return the response message instead of parsed output.

returns:

- output | message

#### on

listen to events.

params: 

- name
- [group]
- handler - async func(input, message)

#### async emit

emit an event. should be called after started.

params:

- name
- input

#### async start

start the transporter and register all methods and event listeners.

async function

any params will be passed to underlying transporter.start

#### async stop

start the transporter.

async function

any params will be passed to underlying transporter.stop