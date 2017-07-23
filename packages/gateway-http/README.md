# HTTP Gateway

Provide a http gateway for micro panda services.

## API

#### buildService

params

- broker
- [allow] - func(type, name) => result - decide if the message is allowed to be sent 
- [prefix] - default to ''
- [logger] - default to logger

returns

- service - a [http.Server](https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_class_http_server) instance
