# Micro Panda

Node.js micro service toolkit.

## Status

Under active development.

## Goals

- easy to use
  - :white_check_mark: high level abstraction
  - :white_check_mark: modern api
  - :white_check_mark: flexibility via composition
- message modes
  - :white_check_mark: one to one request-response
  - :white_check_mark: one to instances notification
  - :white_check_mark: one to groups notification
- error handling
  - :white_check_mark: via broker error handler
  - :white_check_mark: via hoh
- brokers
  - :white_check_mark: memory
  - :white_check_mark: nats
  - amqp
  - redis
  - tcp
  - http
- serializers
  - :white_check_mark: json
  - bjson
  - ejson
- HOBs (high order brokers)
  - :white_check_mark: withSerializer
  - :white_check_mark: withProtocol
- HOHs (high order handlers)
  - :white_check_mark: withSerializer
  - auto logging
  - authentication
  - cache
- validations
  - :white_check_mark: Joi
- loggers
  - pino
- api gateways
  - :white_check_mark: http
  - tcp
- monitors
- interactions
  - repl
  - web
- testing
  - jest

## TODO

- use lerna
- build facade
- simplify previous tests with setup and teardown
- remove lodash dependencies
- docs
  - basic usage
  - error handling

## Tech List

- nats
- lerna
- pino
- jest
- Joi
