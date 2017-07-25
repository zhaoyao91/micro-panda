# HTTP Gateway

Simple http gateway for micro panda services.

## API

#### buildService

params

- broker
- [allow] - func(req) => result - check if this http request is allowed
  - req - [node.js http incomingmessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
  - result - boolean - if false, return 403
- [prefix] - default to ''
- [logger] - default to logger

returns

- service - a [http.Server](https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_class_http_server) instance
