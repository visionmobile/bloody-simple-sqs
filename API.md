# API reference

## Table of Contents

* [Intro](#intro)
* [Constructor](#constructor)
* [Methods](#methods)
  * [add(payload, [callback])](#add)
  * [createReadStream()](#createReadStream)
  * [getUrl([callback])](#getUrl)
  * [isEmpty([callback])](#isEmpty)
  * [peek([options], [callback])](#peek)
  * [poll([options], [callback])](#poll)
  * [remove(receiptHandle, [callback])](#remove)
  * [size([callback])](#size)
* [Notes](#notes)

## Intro

Install bloody-simple-sqs using npm.

```
$ npm install bloody-simple-sqs
```

Reference bloody-simple-sqs in your code.

```javascript
var SQS = require('bloody-simple-sqs');
```

## Constructor

Creates a new bloody simple SQS instance.

##### Parameters

* `options` _(object)_ SQS client options (required)
  * `queueName` _(string)_ the name of the queue (required)
  * `accessKeyId` _(string)_ the AWS access key (required)
  * `secretAccessKey` _(string)_ the AWS secret access key (required)
  * `region` _(string)_ optional AWS region; defaults to "us-east-1"

##### Example

```javascript
var SQS = require('bloody-simple-sqs');

var sqs = new SQS({
 queueName: 'i-am-queue',
 accessKeyId: 'AKIA-access-key',
 secretAccessKey: 'secret-access-key'
});
```

## Methods

### <a name="add" href="add">#</a>add(payload, [callback]) -> promise

Appends a new message, with the given payload, at the end of the queue.

##### Parameters

* `payload` _(boolean, string, number, object, null)_ the message payload
* `callback` _(function)_ optional callback function with (err, data) arguments

##### Returns

A promise resolving to an object with the following properties.

* `id` _(string)_ the id of the message in Amazon SQS
* `body`_(boolean, string, number, object, null)_ the message payload
* `md5`_(string)_ an MD5 digest of the payload; this can be used to verify that Amazon SQS received the message correctly

##### Example

```javascript
sqs.add({a: 1, b: 2})
  .then(function (data) {
    console.log('Message sucessfully appended to queue with id ' + data.id); 
  })
  .catch(function (err) {
    console.error(err);
  });
```

### <a name="createReadStream" href="createReadStream">#</a>createReadStream() -> stream.Readable

Returns a new ReadStream object consuming the queue's messages.

##### Returns

A node.js [Readable Stream](http://nodejs.org/api/stream.html#stream_class_stream_readable).

##### Example

```javascript
var rs = sqs.createReadStream();

rs.on('readable', function() {
  console.log(rs.read())
});

rs.on('error', function (err) {
  console.error(err)
});

rs.on('end', function() {
  console.log('No more messages in queue');
});
```

### <a name="getUrl" href="getUrl">#</a>getUrl([callback]) -> promise

Retrieves the URL of the queue from Amazon.

##### Parameters

* `callback` _(function)_ optional callback function with (err, url) arguments

##### Returns

A promise resolving to a URL string.

##### Example

```javascript
sqs.getUrl()
  .then(function (url) {
    // do something with url
  })
  .catch(function (err) {
    console.error(err);
  });
```

### <a name="isEmpty" href="isEmpty">#</a>isEmpty([callback]) -> promise

Indicates whether the queue is empty.

##### Parameters

* `callback` _(function)_ optional callback function with (err, isEmpty) arguments

##### Returns

A promise resolving to a boolean flag.

##### Example

```javascript
sqs.isEmpty()
  .then(function (isEmpty) {
    if (isEmpty) {
      console.log('The queue is empty');
    } else {
      console.log('Queue has messages left unprocessed');
  })
  .catch(function (err) {
    console.error(err);
  });
```

### <a name="peek" href="peek">#</a>peek([options], [callback]) -> promise

Retrieves, but does not remove, the head of the queue.

##### Parameters

* `options` _(object)_ optional peek options
  * `timeout` _(number)_ number of seconds to wait until a message arrives in the queue; must be between 0 and 20; defaults to 0
  * `limit` _(number)_ maximum number of messages to return; must be between 1 and 10; defaults to 1
* `callback` _(function)_ optional callback function with (err, data) arguments

##### Returns

A promise resolving to a message object with the following properties, or null if the queue is empty.

* `id` _(string)_ the id of the message in Amazon SQS
* `body`_(boolean, string, number, object, null)_ the message payload
* `md5`_(string)_ an MD5 digest of the payload; this can be used to verify that Amazon SQS received the message correctly
* `receiptHandle`_(string)_ the receipt handle associated with the current message - used to remove the message from queue

##### Example

```javascript
sqs.peek({limit: 1, timeout: 20})
  .then(function (message) {
    if (message) {
      console.log(JSON.stringify(message)); 
    } else {
      console.log('The queue is empty');
    }
  })
  .catch(function (err) {
    console.error(err);
  });
```

### <a name="poll" href="poll">#</a>poll([options], [callback]) -> promise

Retrieves and removes the head of the queue, or null if queue is empty.

##### Parameters

* `options` _(object)_ optional peek options
  * `timeout` _(number)_ number of seconds to wait until a message arrives in the queue; must be between 0 and 20; defaults to 0
  * `limit` _(number)_ maximum number of messages to return; must be between 1 and 10; defaults to 1
* `callback` _(function)_ optional callback function with (err, data) arguments

##### Returns

A promise resolving to a message object with the following properties, or null if the queue is empty.

* `id` _(string)_ the id of the message in Amazon SQS
* `body`_(boolean, string, number, object, null)_ the message payload
* `md5`_(string)_ an MD5 digest of the payload; this can be used to verify that Amazon SQS received the message correctly
* `receiptHandle`_(string)_ the receipt handle associated with the current message - used to remove the message from queue

##### Example

```javascript
sqs.poll({limit: 1, timeout: 20})
  .then(function (message) {
    if (message) {
      console.log(JSON.stringify(message)); 
    } else {
      console.log('The queue is empty');
    }
  })
  .catch(function (err) {
    console.error(err);
  });
```

### <a name="remove" href="remove">#</a>remove(receiptHandle, [callback]) -> promise

Remove message with the designated receipt handle from queue.

##### Parameters

* `receiptHandle` _(object)_ the message's receipt handle, as provided by [#peek()](#peek)
* `callback` _(function)_ optional callback function with (err) arguments

##### Returns

A promise resolving to no arguments.

##### Example

```javascript
sqs.peek({limit: 1, timeout: 20})
  .then(function (message) {
    if (message) {
      console.log('Removing message from queue');

      return sqs.remove(message.receiptHandle)
       .then(function () {
         console.log('Message successfully removed from queue'); 
       })
    }
  })
  .catch(function (err) {
    console.error(err);
  });
```

### <a name="size" href="size">#</a>size([callback]) -> promise

Retrieves the number of messages in the queue.

##### Parameters

* `callback` _(function)_ optional callback function with (err, num) arguments

##### Returns

A promise resolving to the number of messages in the queue.

##### Example

```javascript
sqs.size()
  .then(function (num) {
    console.log(num + ' message(s) found in queue');
  })
  .catch(function (err) {
    console.error(err);
  });
```

## Notes

### Promises VS Callbacks

Bloody simple SQS exposes both promise and callback interfaces. Choose the coding style that suits you best.

```javascript
sqs.add('hello')
  .then(function (data) {
    console.log('Message sucessfully appended to queue with id ' + data.id); 
  })
  .catch(function (err) {
    console.error(err);
  });
```
The above could be rewritten as:

```javascript
sqs.add('hello', function (err, data) {
  if (err) {
    console.error(err);
    return;
  }

  console.log('Message sucessfully appended to queue with id ' + data.id); 
});
```
