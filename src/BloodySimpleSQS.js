var AWS = require('aws-sdk'),
  Promise = require('bluebird');

/**
 * Constructs and returns a new bloody simple SQS client.
 * @param {Object} options SQS client options.
 * @param {String} options.queueName the name of the queue to connect to.
 * @param {String} options.accessKeyId your AWS access key ID.
 * @param {String} options.secretAccessKey your AWS secret access key.
 * @param {String} [options.region=us-east-1] the region to send service requests to.
 * @constructor
 */
function BloodySimpleSQS(options) {
  var queueName, accessKeyId, secretAccessKey, region;

  // validate "options" param
  if (typeof options !== 'object') {
    throw new Error('Invalid or unspecified "options" param');
  }

  queueName = options.queueName || process.env.SQS_QUEUE_NAME;
  accessKeyId = options.accessKeyId || process.env.SQS_ACCESS_KEY_ID;
  secretAccessKey = options.secretAccessKey || process.env.SQS_SECRET_ACCESS_KEY;
  region = options.region || process.env.SQS_REGION || 'us-east-1';

  if (typeof queueName !== 'string') throw new Error('Invalid or unspecified "queueName" option');
  if (typeof accessKeyId !== 'string') throw new Error('Invalid or unspecified "accessKeyId" option');
  if (typeof secretAccessKey !== 'string') throw new Error('Invalid or unspecified "secretAccessKey" option');
  if (typeof region !== 'string') throw new Error('Invalid or unspecified "region" option');

  this.queueName = queueName;
  this.queueUrl = null;

  this.sqs = new AWS.SQS({
    queueName: queueName,
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: region,
    apiVersion: '2012-11-05'
  });
}

/**
 * Retrieves the URL of the queue.
 * @return {Promise}
 * @private
 */
BloodySimpleSQS.prototype._getQueueUrl = function () {
  var params, resolver;

  // check if URL is already known
  if (this._queueUrl !== null) return Promise.resolve(this._queueUrl); // exit

  params = {
    QueueName: this.queueName
  };

  resolver = function(resolve, reject) {
    this.sqs.getQueueUrl(params, function(err, response) {
      if (err) return reject(err);

      resolve(response.QueueUrl);
    });
  }.bind(this);

  return new Promise(resolver);
};

/**
 * Appends a new message, with the designated body, at the end of the queue.
 * @param {Boolean|String|Number|Object|Null} body the body of the message.
 * @param {Function} [callback] an optional callback function, i.e. function (err, response).
 * @return {Promise}
 */
BloodySimpleSQS.prototype.add = function (body, callback) {
  var params, resolver;

  params = {
    QueueUrl: this.queueUrl,
    MessageBody: JSON.stringify(body)
  };

  resolver = function(resolve, reject) {
    this.sqs.sendMessage(params, function(err, response) {
      var message;

      if (err) return reject(err);

      message = {
        id: response.MessageId,
        body: body,
        md5: response.MD5OfMessageBody
      };

      resolve(message);
    });
  }.bind(this);

  return new Promise(resolver).nodeify(callback);
};

/**
 * Retrieves, but does not remove, the head of the queue.
 * @param {Object} [options] optional request options.
 * @param {Number} [options.timeout=0] number of seconds to wait until a message arrives in the queue.
 * @param {Function} [callback] an optional call back function, i.e. function (err, message, receiptHandle).
 * @return {Promise}
 */
BloodySimpleSQS.prototype.peek = function (options, callback) {
  var params, resolver;

  // handle optional "options" param
  if (typeof options === 'function') {
    callback = options;
    options = {};
  } else if (options === undefined) {
    options = {};
  }

  params = {
    QueueUrl: this.queueUrl,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: options.timeout || 0
  };

  resolver = function(resolve, reject) {
    this.sqs.receiveMessage(params, function(err, response) {
      var message;

      if (err) return reject(err);
      if (response.Messages.length === 0) return resolve();

      response = response.Messages[0];
      message = {
        id: response.MessageId,
        body: JSON.parse(response.Body),
        md5: response.MD5OfBody,
        receiptHandle: response.ReceiptHandle
      };

      resolve(message);
    });
  }.bind(this);

  return new Promise(resolver).nodeify(callback);
};

/**
 * Removes the designated message from queue.
 * @param {String} receiptHandle the message's receipt handle, as given on peek().
 * @param {Function} [callback] an optional callback function, i.e. function (err).
 * @return {Promise}
 */
BloodySimpleSQS.prototype.remove = function (receiptHandle, callback) {
  var params, resolver;

  params = {
    QueueUrl: this.queueUrl,
    ReceiptHandle: receiptHandle
  };

  resolver = function(resolve, reject) {
    this.sqs.deleteMessage(params, function(err) {
      if (err) return reject(err);

      resolve();
    });
  }.bind(this);

  return new Promise(resolver).nodeify(callback);
};


/**
 * Retrieves and removes the head of this queue, or returns null if this queue is empty.
 * @param {Object} [options] optional request options.
 * @param {Function} [callback] an optional call back function, i.e. function (err, message, receiptHandle).
 * @see {@link peek} for further information on the "options" param.
 * @return {Promise}
 */
BloodySimpleSQS.prototype.poll = function (options, callback) {
  return this.peek(options)
    .bind(this)
    .then(function (message) {
      return this.remove(message.receiptHandle)
        .then(function () {
          return message;
        });
    }).nodeify(callback);
};

module.exports = BloodySimpleSQS;


// var sqs = new BloodySimpleSQS();
// sqs.add(123).then(function (response) {
//   console.log(response);

//   sqs.poll().then(function (message) {
//     console.log(message);
//   });
// });
