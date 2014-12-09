# Bloody simple SQS

A bloody simple SQS client for Node.js, based on the official AWS sdk.

#### Features

* Exposes promise and callback interfaces;
* Battle-tested under heavy load;
* Distributed under the MIT license, i.e. you can use it in open-source and commercial projects.

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

var sqs = new SQS({
 queueName: 'i-am-queue',
 accessKeyId: 'AKIA-access-key',
 secretAccessKey: 'secret-access-key',
 region: 'us-east-1'
});
```

#### Append message to queue

```javascript
sqs.add({a: 1, b: 2})
  .then(function (data) {
    console.log('Message sucessfully appended to queue with id ' + data.id); 
  })
  .catch(function (err) {
    console.error(err);
  });
```

#### Retrieve and remove message from queue

```javascript
sqs.poll({limit: 1, timeout: 20})
  .then(function (message) {
    if (message) {
      console.log(message); 
    } else {
      console.log('The queue is empty');
    }
  })
  .catch(function (err) {
    console.error(err);
  });
```

## API Docs

For further information on Bloody Simple SQS methods please refer to the [API Docs](https://github.com/jmike/bloody-simple-sqs/blob/master/API.md).

## Contributors

Author: [Dimitrios C. Michalakos](https://github.com/jmike)

## Acknowledgements

This project would not be without the extraordinary work of:

* Amazon Web Services (https://github.com/aws/aws-sdk-js)
* Petka Antonov (https://github.com/petkaantonov/bluebird)

## License

MIT
