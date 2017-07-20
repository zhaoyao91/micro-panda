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
- brokers
  - :white_check_mark: memory
  - :white_check_mark: nats
  - amqp
  - redis
  - tcp
  - http
- serializers
  - :white_check_mark: json
- HOBs (high order brokers)
  - :white_check_mark: withSerializer
- HOHs (high order handlers)
  - validation
  - logger
  - error handler
  - authentication
  - cache
- api gateways
  - http
  - tcp
- monitor

## TODO

- use lerna
- docs

## Tech List

- nats
- lerna
- pino
- jest
- Joi
- super-error