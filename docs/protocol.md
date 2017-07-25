# Mirco Panda Protocol

## Current Version

1

## Definition

### Message

```ecmascript 6
{
  protocol: 'mpp.1',
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
  
  // any other customized fields
  // ...
}
```