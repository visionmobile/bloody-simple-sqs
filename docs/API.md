# API reference

## Table of Contents

* [Intro](#intro)
* [Constructor](#constructor)
* [Methods](#methods)
  * [add(payload, [callback])](#add)
  * [addAll(arr, [callback])](#addAll)
  * [clear([callback])](#clear)
  * [createReadStream()](#createReadStream)
  * [getUrl([callback])](#getUrl)
  * [isEmpty([callback])](#isEmpty)
  * [peek([options], [callback])](#peek)
  * [peekOne([options], [callback])](#peekOne)
  * [poll([options], [callback])](#poll)
  * [pollOne([options], [callback])](#pollOne)
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

* `options` _(Object)_ SQS client options (required)
  * `queueName` _(String)_ the name of the queue (required)
  * `accessKeyId` _(String)_ the AWS access key (required)
  * `secretAccessKey` _(String)_ the AWS secret access key (required)
  * `region` _(String)_ optional AWS region; defaults to "us-east-1"

##### Example

```javascript
var SQS = require('bloody-simple-sqs');

var queue = new SQS({
 queueName: 'i-am-queue',
 accessKeyId: 'AKIA-access-key',
 secretAccessKey: 'secret-access-key'
});
```

## Methods

### <a name="add" href="add">#</a>add(payload, [callback]) -> Promise

Appends a new message, with the given payload, at the end of the queue.

##### Parameters

* `payload` _(Boolean, String, Number, Object, null)_ the message payload
* `options` _(Object)_ optional request options
  * `delaySeconds` _(Integer)_ the number of seconds (0 to 900 - 15 minutes) to delay the delivery of the message
* `callback` _(Function)_ optional callback function with (err, data) arguments

##### Returns

A bluebird promise resolving to an object with the following properties.

* `id` _(String)_ the id of the message in Amazon SQS
* `body`_(Boolean, String, Number, Object, null)_ the message payload
* `md5`_(String)_ an MD5 digest of the payload; this can be used to verify that Amazon SQS received the message correctly

##### Example

```javascript
queue.add({a: 1, b: 2})
  .then(function (data) {
    console.log('Message successfully appended to queue with id ' + data.id);
  })
  .catch(function (err) {
    console.error(err);
  });
```

### <a name="addAll" href="addAll">#</a>addAll(arr, [callback]) -> Promise

Appends new messages, with the given payload, to the queue.

##### Parameters

* `arr` _(Array)_ an array of payload entities to append to queue
* `options` _(Object)_ optional request options
  * `delaySeconds` _(Integer)_ the number of seconds (0 to 900 - 15 minutes) to delay the delivery of the message
* `callback` _(Function)_ optional callback function with (err, data) arguments

##### Returns

An empty bluebird promise.

##### Example

```javascript
queue.addAll([
  {a: 1, b: 2},
  {a: 3, b: 4}
])
  .then(function () {
    console.log('Messages successfully appended to queue');
  })
  .catch(function (err) {
    console.error(err);
  });
```

### <a name="clear" href="clear">#</a>clear([callback]) -> Promise

Removes all messages from queue.

##### Parameters

* `callback` _(Function)_ optional callback function with (err) arguments

##### Returns

A bluebird promise.

##### Example

```javascript
queue.clear()
  .then(function () {
    console.log('All messages removed');
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
var rs = queue.createReadStream();

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

### <a name="getUrl" href="getUrl">#</a>getUrl([callback]) -> Promise

Retrieves the URL of the queue from Amazon.

##### Parameters

* `callback` _(Function)_ optional callback function with (err, url) arguments

##### Returns

A bluebird promise resolving to a URL string.

##### Example

```javascript
queue.getUrl()
  .then(function (url) {
    // do something with url
  })
  .catch(function (err) {
    console.error(err);
  });
```

### <a name="isEmpty" href="isEmpty">#</a>isEmpty([callback]) -> Promise

Indicates whether the queue is empty.

##### Parameters

* `callback` _(Function)_ optional callback function with (err, isEmpty) arguments

##### Returns

A bluebird promise resolving to a boolean flag.

##### Example

```javascript
queue.isEmpty()
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

### <a name="peek" href="peek">#</a>peek([options], [callback]) -> Promise

Retrieves, but does not remove, the specified number of messages from the head of the queue.

##### Parameters

* `options` _(Object)_ optional peek options
  * `timeout` _(Integer)_ number of seconds to wait until a message becomes available for retrieval; must be between 0 and 20; defaults to 0
  * `limit` _(Integer)_ maximum number of messages to return; defaults to 1
* `callback` _(Function)_ optional callback function with (err, messages) arguments

##### Returns

A bluebird promise resolving to an array of messages with the following properties.

* `id` _(String)_ the id of the message in Amazon SQS
* `body`_(Boolean, String, Number, Object, null)_ the message payload
* `md5`_(String)_ an MD5 digest of the payload; this can be used to verify that Amazon SQS received the message correctly
* `receiptHandle`_(String)_ the receipt handle associated with the current message - used to remove the message from queue

##### Example

```javascript
queue.peek({limit: 1, timeout: 20})
  .each(function (message) {
    console.log(JSON.stringify(message));
  })
  .catch(function (err) {
    console.error(err);
  });
```

### <a name="peekOne" href="peekOne">#</a>peekOne([options], [callback]) -> Promise

Retrieves, but does not remove, the first message from the head of the queue.

##### Parameters

* `options` _(Object)_ optional peek options
  * `timeout` _(Integer)_ number of seconds to wait until a message becomes available for retrieval; must be between 0 and 20; defaults to 0
* `callback` _(Function)_ optional callback function with (err, message) arguments

##### Returns

A bluebird promise resolving to a message object with the following properties.

* `id` _(String)_ the id of the message in Amazon SQS
* `body`_(Boolean, String, Number, Object, null)_ the message payload
* `md5`_(String)_ an MD5 digest of the payload; this can be used to verify that Amazon SQS received the message correctly
* `receiptHandle`_(String)_ the receipt handle associated with the current message - used to remove the message from queue

##### Example

```javascript
queue.peekOne({timeout: 20})
  .then(function (message) {
    if (message === null) {
      console.log('Queue is empty');
      return;
    }

    console.log(JSON.stringify(message));
  })
  .catch(function (err) {
    console.error(err);
  });
```

### <a name="poll" href="poll">#</a>poll([options], [callback]) -> Promise

Retrieves and removes the specified number of messages from the head of the queue.

##### Parameters

* `options` _(Object)_ optional peek options
  * `timeout` _(Integer)_ number of seconds to wait until a message becomes available for retrieval; must be between 0 and 20; defaults to 0
  * `limit` _(Integer)_ maximum number of messages to return; defaults to 1
* `callback` _(Function)_ optional callback function with (err, messages) arguments

##### Returns

A bluebird promise resolving to an array of messages with the following properties.

* `id` _(String)_ the id of the message in Amazon SQS
* `body`_(Boolean, String, Number, Object, null)_ the message payload
* `md5`_(String)_ an MD5 digest of the payload; this can be used to verify that Amazon SQS received the message correctly
* `receiptHandle`_(String)_ the receipt handle associated with the current message - used to remove the message from queue

##### Example

```javascript
queue.poll({limit: 5, timeout: 20})
  .each(function (message) {
    console.log(JSON.stringify(message));
  })
  .catch(function (err) {
    console.error(err);
  });
```

### <a name="pollOne" href="pollOne">#</a>pollOne([options], [callback]) -> Promise

Retrieves and removes the specified number of messages from the head of the queue.

##### Parameters

* `options` _(Object)_ optional peek options
  * `timeout` _(Integer)_ number of seconds to wait until a message becomes available for retrieval; must be between 0 and 20; defaults to 0
* `callback` _(Function)_ optional callback function with (err, message) arguments

##### Returns

A bluebird promise resolving to a message object with the following properties.

* `id` _(String)_ the id of the message in Amazon SQS
* `body`_(Boolean, String, Number, Object, null)_ the message payload
* `md5`_(String)_ an MD5 digest of the payload; this can be used to verify that Amazon SQS received the message correctly
* `receiptHandle`_(String)_ the receipt handle associated with the current message - used to remove the message from queue

##### Example

```javascript
queue.pollOne({timeout: 20})
  .then(function (message) {
    if (message === null) {
      console.log('Queue is empty');
      return;
    }

    console.log(JSON.stringify(message));
  })
  .catch(function (err) {
    console.error(err);
  });
```

### <a name="remove" href="remove">#</a>remove(receiptHandle, [callback]) -> Promise

Remove message with the designated receipt handle from queue.

##### Parameters

* `receiptHandle` _(String)_ the message's receipt handle, as provided by [#peek()](#peek)
* `callback` _(Function)_ optional callback function with (err) arguments

##### Returns

A bluebird promise resolving to no arguments.

##### Example

```javascript
queue.peekOne()
  .then(function (message) {
    if (message) {
      console.log('Removing message from queue');

      return queue.remove(message.receiptHandle)
       .then(function () {
         console.log('Message successfully removed from queue');
       })
    }
  })
  .catch(function (err) {
    console.error(err);
  });
```

### <a name="size" href="size">#</a>size([callback]) -> Promise

Retrieves the number of messages in the queue.

##### Parameters

* `callback` _(Function)_ optional callback function with (err, num) arguments

##### Returns

A bluebird promise resolving to the number of messages in the queue.

##### Example

```javascript
queue.size()
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
queue.add('hello')
  .then(function (data) {
    console.log('Message successfully appended to queue with id ' + data.id);
  })
  .catch(function (err) {
    console.error(err);
  });
```
The above could be rewritten as:

```javascript
queue.add('hello', function (err, data) {
  if (err) {
    console.error(err);
    return;
  }

  console.log('Message successfully appended to queue with id ' + data.id);
});
```
