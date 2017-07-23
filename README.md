# Micro Panda

Node.js toolkit to help build micro services.

## Features

- light and extensible
- useful communication modes
  - method
    - request-response mode
    - error serialization and rebuilding
  - events
    - subscribe via topic
    - load balance via group
- replaceable transporter
- replaceable serializer
- gateways
- input validators

## Protocol

[Micro Panda Protocol](docs/protocol.md)

## Components

- [Broker](packages/broker/README.md)
- Transporters
  - [NATS](packages/transporter-nats/README.md)
- Serializer
  - [EJSON](packages/serializer-ejson/README.md)
- Validator
  - [Joi](packages/validator-joi/README.md)
- Gateways
  - [HTTP](packages/gateway-http/README.md)
  
## More Docs

- [Show Cases](docs/show-cases.md)
- [Communication Modes](docs/communication-modes.md)
- [Protocol](docs/protocol.md)
- [Contracts](docs/contracts)

## License

MIT