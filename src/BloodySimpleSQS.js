var events = require('events');
var util = require('util');
var Readable = require('stream').Readable;
var Joi = require('joi');
var AWS = require('aws-sdk');
var Promise = require('bluebird');

/**
 * Constructs and returns a new bloody simple SQS client.
 * @param {object} options SQS client options.
 * @param {string} options.queueName the name of the queue as provided by AWS.
 * @param {string} options.accessKeyId your AWS access key ID.
 * @param {string} options.secretAccessKey your AWS secret access key.
 * @param {string} [options.region=us-east-1] the region of the queue as provided by AWS.
 * @constructor
 */
function BloodySimpleSQS(options) {
  var schema;
  var validationResult;

  // validate options
  schema = Joi.object()
    .keys({
      queueName: Joi.string().strict().required(),
      accessKeyId: Joi.string().strict().required(),
      secretAccessKey: Joi.string().strict().required(),
      region: Joi.string().default('us-east-1').strict(),
    })
    .label('options');

  validationResult = Joi.validate(options, schema);

  if (validationResult.error) throw validationResult.error;
  options = validationResult.value;

  // init aws-sdk client
  this.queueName = options.queueName;

  this.sqs = new AWS.SQS({
    queueName: options.queueName,
    accessKeyId: options.accessKeyId,
    secretAccessKey: options.secretAccessKey,
    region: options.region,
    apiVersion: '2012-11-05'
  });

  events.EventEmitter.call(this);
  this.setMaxListeners(999);

  // load data and emit ready
  this.getUrl()
    .bind(this)
    .then(function (url) {
      this.queueUrl = url;
      this.isReady = true;
      this.emit('ready');
    });
}

// @extends EventEmitter
util.inherits(BloodySimpleSQS, events.EventEmitter);

/**
 * Constructs and returns a new Promise based on the designated resolver.
 * Delays the execution of the resolver until the queue emits ready.
 * @param {function} resolver
 * @return {Promise}
 * @private
 */
BloodySimpleSQS.prototype._contructPromise = function (resolver) {
  var _this = this;

  return new Promise(function(resolve, reject) {
    if (_this.isReady) return resolver(resolve, reject);

    _this.once('ready', function () {
      resolver(resolve, reject);
    });
  });
};

/**
 * Retrieves the URL of the queue from AWS.
 * @param {function} [callback] an optional callback function with (err, url) arguments.
 * @return {Promise}
 */
BloodySimpleSQS.prototype.getUrl = function (callback) {
  var _this = this;
  var params;
  var resolver;

  // check if queue URL is already known
  if (this.isReady) return Promise.resolve(this.queueUrl).nodeify(callback);

  params = {
    QueueName: _this.queueName
  };

  resolver = function(resolve, reject) {
    _this.sqs.getQueueUrl(params, function(err, response) {
      if (err) return reject(err);
      resolve(response.QueueUrl);
    });
  };

  return new Promise(resolver).nodeify(callback);
};

/**
 * Returns the number of messages in the queue.
 * @param {function} [callback] an optional callback function with (err, size) arguments.
 * @return {Promise}
 */
BloodySimpleSQS.prototype.size = function (callback) {
  var _this = this;
  var resolver;

  resolver = function(resolve, reject) {
    var params = {
      QueueUrl: _this.queueUrl,
      AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
    };

    _this.sqs.getQueueAttributes(params, function(err, response) {
      var messagesCount;

      if (err) return reject(err);

      messagesCount = parseInt(response.Attributes.ApproximateNumberOfMessages, 10) +
        parseInt(response.Attributes.ApproximateNumberOfMessagesNotVisible, 10);

      resolve(messagesCount);
    });
  };

  return this._contructPromise(resolver).nodeify(callback);
};

/**
 * Indicates whether the queue is empty.
 * @param {function} [callback] an optional callback function (err, isEmpty) arguments.
 * @return {Promise}
 */
BloodySimpleSQS.prototype.isEmpty = function (callback) {
  return this.size()
    .then(function (messagesCount) {
      return messagesCount === 0;
    })
    .nodeify(callback);
};

/**
 * Appends a new message, with the given payload, at the end of the queue.
 * @param {(boolean|string|number|object|null)} payload the message payload.
 * @param {function} [callback] an optional callback function with (err, response) arguments.
 * @return {Promise}
 */
BloodySimpleSQS.prototype.add = function (payload, callback) {
  var _this = this;
  var schema;
  var resolver;

  // validate payload
  schema = Joi.alternatives()
    .required()
    .strict()
    .label('payload')
    .try(Joi.number(), Joi.string(), Joi.object().allow(null), Joi.boolean());

  Joi.assert(payload, schema);

  resolver = function(resolve, reject) {
    var params = {
      QueueUrl: _this.queueUrl,
      MessageBody: JSON.stringify(payload)
    };

    _this.sqs.sendMessage(params, function(err, response) {
      if (err) return reject(err);

      resolve({
        id: response.MessageId,
        body: payload,
        md5: response.MD5OfMessageBody
      });
    });
  };

  return this._contructPromise(resolver).nodeify(callback);
};

/**
 * Retrieves, but does not remove, the head of the queue.
 * @param {object} [options] optional request options.
 * @param {number} [options.timeout=0] number of seconds to wait until a message arrives in the queue; must be between 0 and 20.
 * @param {number} [options.limit=1] maximum number of messages to return; must be between 1 and 10.
 * @param {function} [callback] an optional callback function with (err, message) arguments.
 * @return {Promise}
 */
BloodySimpleSQS.prototype.peek = function (options, callback) {
  var _this = this;
  var schema;
  var validationResult;
  var resolver;

  // handle optional "options" param
  if (typeof(options) === 'function') {
    callback = options;
    options = {};
  } else if (options === undefined) {
    options = {};
  }

  // validate options
  schema = Joi.object()
    .keys({
      timeout: Joi.number().min(0).max(20).default(0).strict(),
      limit: Joi.number().min(1).max(10).default(1).strict()
    })
    .label('options');

  validationResult = Joi.validate(options, schema);

  if (validationResult.error) throw validationResult.error;
  options = validationResult.value;

  // set promise resolver
  resolver = function(resolve, reject) {
    var params = {
      QueueUrl: _this.queueUrl,
      MaxNumberOfMessages: options.limit,
      WaitTimeSeconds: options.timeout
    };

    _this.sqs.receiveMessage(params, function(err, response) {
      var messages;

      if (err) return reject(err);
      if (!response.Messages) return resolve(null); // empty

      messages = response.Messages.map(function (obj) {
        return {
          id: obj.MessageId,
          body: JSON.parse(obj.Body),
          md5: obj.MD5OfBody,
          receiptHandle: obj.ReceiptHandle
        };
      });

      if (options.limit === 1) {
        resolve(messages[0]);
      } else {
        resolve(messages);
      }
    });
  };

  return this._contructPromise(resolver).nodeify(callback);
};

/**
 * Removes the designated message from queue.
 * @param {string} receiptHandle the message's receipt handle, as given on peek().
 * @param {function} [callback] an optional callback function with (err) arguments.
 * @return {Promise}
 */
BloodySimpleSQS.prototype.remove = function (receiptHandle, callback) {
  var _this = this;
  var schema;
  var resolver;

  // validate receipt handle
  schema = Joi.string()
    .strict()
    .required()
    .label('receipt handle');

  Joi.assert(receiptHandle, schema);

  // set promise resolver
  resolver = function(resolve, reject) {
    var params = {
      QueueUrl: _this.queueUrl,
      ReceiptHandle: receiptHandle
    };

    _this.sqs.deleteMessage(params, function(err) {
      if (err) return reject(err);
      resolve();
    });
  };

  return this._contructPromise(resolver).nodeify(callback);
};

/**
 * Retrieves and removes the head of the queue, or returns null if queue is empty.
 * @param {object} [options] optional request options.
 * @param {function} [callback] an optional callback function with (err, message) arguments.
 * @see {@link peek} for further information on the "options" param.
 * @return {Promise}
 */
BloodySimpleSQS.prototype.poll = function (options, callback) {
  return this.peek(options)
    .bind(this)
    .then(function (message) {
      if (message) {
        return this.remove(message.receiptHandle).return(message);
      }
      return null;
    })
    .nodeify(callback);
};

/**
 * Removes all messages from queue.
 * @param {function} [callback] an optional callback function with (err) arguments.
 * @return {Promise}
 */
BloodySimpleSQS.prototype.clear = function (callback) {
  var _this = this;
  var resolver;

  resolver = function(resolve, reject) {
    var params = {
      QueueUrl: _this.queueUrl
    };

    _this.sqs.purgeQueue(params, function(err) {
      if (err) return reject(err);
      resolve();
    });
  };

  return this._contructPromise(resolver).nodeify(callback);
};

/**
 * Returns a new ReadStream object consuming the queue's messages.
 * @return {stream.Readable}
 */
BloodySimpleSQS.prototype.createReadStream = function () {
  var _this = this;
  var rs = new Readable({
    highWaterMark: 1, // as little as possible
    objectMode: true,
    encoding: 'utf8'
  });

  rs._read = function () {
    _this.poll()
      .then(function (message) {
        if (!message) return rs.push(null); // end
        rs.push(message.body, 'utf8');
      })
      .catch(function (err) {
        rs.emit('error', err);
      });
  };

  return rs;
};

module.exports = BloodySimpleSQS;
