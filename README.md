# Bloody simple SQS

A bloody simple Amazon SQS client for Node.js, based on the official AWS SDK.

#### Features

* Simple and sane interface to Amazon SQS;
* Exposes promise and callback API;
* Battle-tested under heavy load;
* Distributed under the MIT license.

## Installation

```
$ npm install bloody-simple-sqs
```

#### Requirements

* Node.js 0.8+

## Quick start

#### Create a new SQS instance

```javascript
var SQS = require('bloody-simple-sqs');

var queue = new SQS({
 queueName: 'i-am-queue',
 accessKeyId: 'AKIA-access-key',
 secretAccessKey: 'secret-access-key',
 region: 'us-east-1'
});
```

#### Append message to queue

```javascript
queue.add({a: 1, b: 2})
  .then(function (data) {
    console.log('Message sucessfully appended to queue with id ' + data.id); 
  })
  .catch(function (err) {
    console.error(err);
  });
```

#### Retrieve and remove message from queue

```javascript
queue.poll({limit: 1, timeout: 20})
  .then(function (message) {
    if (message) {
      console.log(message); 
    } else {
      console.log('The queue has no messages');
    }
  })
  .catch(function (err) {
    console.error(err);
  });
```

## API Docs

For further information on Bloody Simple SQS methods please refer to the [API Docs](https://github.com/jmike/bloody-simple-sqs/blob/master/API.md).

## Philosophy

Amazon SQS is an excellent queue service, simpler than the well-known RabbitMQ, but still very powerfull, reliable and inexpensive. AWS has already provided a Node.js SDK - yet it's complex and repetitive.

Bloody-simple-sqs aims to hide the complexity under a simple well defined API, so that the developers write less code and focus on using SQS, rather than understandind the internal mechanisms of AWS-SDK.

## Acknowledgements

This project would not be without the extraordinary work of:

* Petka Antonov (https://github.com/petkaantonov/bluebird)
* Nicolas Morel (https://github.com/hapijs/joi)

## License

MIT
