# Mirco Panda Protocol

## Current Version

1

## Definition

### Message

```ecmascript 6
{
  protocol: 'mmp.1',
  type: 'request' | 'response' | 'event',
  payload: Any,
  error: ErrorObject, // optional, for type.response
}
```

### ErrorObject
```ecmascript 6
{
  name: String,
  message: String,
  stack: String,
  ownStack: String, // optional
  cause: ErrorObject, // optional
  rootCause: ErrorObject, // optional
}
```