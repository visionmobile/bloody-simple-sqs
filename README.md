# Bloody simple SQS

A bloody simple Amazon SQS client for Node.js, based on the official AWS SDK.

[ ![Build Status for visionmobile/bloody-simple-sqs](https://codeship.com/projects/ce3c9d80-bb71-0132-8afa-3ee0b98d9f7e/status?branch=master)](https://codeship.com/projects/72166)

#### Features

* Simple interface to Amazon SQS;
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

#### Pull message from queue

```javascript
queue.pollOne()
  .then(function (message) {
    if (!message) {
      console.log('The queue has no messages');
      return;
    }

    console.log(message);
  })
  .catch(function (err) {
    console.error(err);
  });
```

## API Docs

For further information on Bloody Simple SQS methods please refer to the [API Docs](https://github.com/jmike/bloody-simple-sqs/blob/master/docs/API.md).

## About this project

Amazon Simple Queue Service is an excellent queue-as-a-service solution - simpler than the notorious RabbitMQ, yet powerfull, reliable and inexpensive.

AWS provides a Node.js SDK, but it's complex and repetitive. Bloody-simple-sqs aims to hide the complexity under a simple well-defined API, so that the developers focus on using the SQS, rather than understanding the internal mechanisms of AWS-SDK.

## License

MIT
