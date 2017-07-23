# Communication Modes

There are two modes by which micro services can communicate with each other: 

- Method
- Event

## Method

Method, also known as  RPC or request-response mode, is a common pattern we use everywhere. Caller sends a request to 
a specific (concrete or abstract) receiver and waits for his response.

## Event

Event is something you want to tell others, but you don't care who will listened and you don't expect any response.
Someone interested in your event should listen to it by himself without bothering you.

Listeners will often do something with the received event. If the works are heavy, we add more listeners with the same
responsibility. But the problem is, in this case, one event as a task should only be taken by only one worker, even 
there are many workers listen to it.

To handle this, they could join a group. A group contains many listeners who share the same interests and 
responsibilities. So when an event occurs, only one member of a group will get and handle it.

## Compare

#### Response

Method caller ought to receive a response, but event is 'fire and forget'.

#### Load balance

Methods are always load balanced since a request should only be handled once and the caller only
expects one response for one request.

On the opposite, events are received by all listeners by default. If needed, they could be grouped together to get 
load balanced.

#### Recognition direction

This is the often ignored thing.

For method, provider should declare it and the caller should recognize it. So the Recognition direction is the same with
that of data flow direction.

```
Caller    data=>    Provider
       recognition=>
```
       
But things are different for event. The emitter should declare that I may emit some kind of events, but the listeners 
should recognize and listen to them. So the recognition direction is opposite to that of data flow:

```
emmiter    data=>    listener
       <=recognition
```

Knowing this will help you decouple your components in a system and build a better architecture.

For example, how to extend a service? You should ask first that is the service responsible for that extension? If it is, then you may add
or change it's methods. But, extensions are often have their new focuses, in these cases, providing new services which 
add logic to the whole system by listening to events of old services may be a better choice. 