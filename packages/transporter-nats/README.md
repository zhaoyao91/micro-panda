# NATS Transporter

## API

#### constructor

params:

- errorHandler - func(err)
- timeout - default to 1 minute. if a method call does not receive any response for such a time, it fails.

#### define

define a method.

params: 

- name
- handler - async func(input) => output

#### async call

call a method. should be called after started.

params:

- name
- input

returns

- output

#### on

listen to events.

params: 

- name
- [group]
- handler - async func(input)

#### emit

emit event. should be called after started.

params:

- name
- input

#### async start

start the transporter.

params:

- options - the same as that of [node-nats.connect](https://github.com/nats-io/node-nats)

#### async stop

stop the transporter.