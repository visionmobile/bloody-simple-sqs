var events = require('events'),
  util = require('util'),
  Readable = require('stream').Readable,
  _ = require('lodash'),
  AWS = require('aws-sdk'),
  Promise = require('bluebird');

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
  var queueName, accessKeyId, secretAccessKey, region;

  if (!_.isObject(options)) {
    throw new Error('Invalid options param; expected object, received ' + typeof(options));
  }

  queueName = options.queueName;
  accessKeyId = options.accessKeyId;
  secretAccessKey = options.secretAccessKey;
  region = options.region || 'us-east-1';

  if (!_.isString(queueName)) {
    throw new Error('Invalid queueName option; expected string, received ' + typeof(queueName));
  }

  if (!_.isString(accessKeyId)) {
    throw new Error('Invalid accessKeyId option; expected string, received ' + typeof(accessKeyId));
  }

  if (!_.isString(secretAccessKey)) {
    throw new Error('Invalid secretAccessKey option; expected string, received ' + typeof(secretAccessKey));
  }

  if (!_.isString(region)) {
    throw new Error('Invalid region option; expected string, received ' + typeof(region));
  }

  this.queueName = queueName;

  this.sqs = new AWS.SQS({
    queueName: queueName,
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: region,
    apiVersion: '2012-11-05'
  });

  events.EventEmitter.call(this);
  this.setMaxListeners(99);

  // load data from aws and emit ready
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
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self.isReady) return resolver(resolve, reject);

    self.once('ready', function () {
      resolver(resolve, reject);
    });
  });
};

/**
 * Retrieves the URL of the queue from AWS.
 * @param {function} [callback] an optional callback function with arguments (err, url).
 * @return {Promise}
 */
BloodySimpleSQS.prototype.getUrl = function (callback) {
  var self = this, params, resolver;

  // check if queue URL is already know
  if (this.isReady) return Promise.resolve(this.queueUrl).nodeify(callback);

  params = {
    QueueName: self.queueName
  };

  resolver = function(resolve, reject) {
    self.sqs.getQueueUrl(params, function(err, response) {
      if (err) return reject(err);
      resolve(response.QueueUrl);
    });
  };

  return new Promise(resolver).nodeify(callback);
};

/**
 * Returns the number of messages in the queue.
 * @param {function} [callback] an optional callback function with arguments (err, n).
 * @return {Promise}
 */
BloodySimpleSQS.prototype.size = function (callback) {
  var self = this, params, resolver;

  params = {
    QueueUrl: self.queueUrl,
    AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
  };

  resolver = function(resolve, reject) {
    self.sqs.getQueueAttributes(params, function(err, response) {
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
 * @param {function} [callback] an optional callback function with arguments (err, empty).
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
 * @param {function} [callback] an optional callback function, i.e. function (err, response).
 * @return {Promise}
 */
BloodySimpleSQS.prototype.add = function (payload, callback) {
  var self = this, params, resolver;

  params = {
    QueueUrl: self.queueUrl,
    MessageBody: JSON.stringify(payload)
  };

  resolver = function(resolve, reject) {
    self.sqs.sendMessage(params, function(err, response) {
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
 * @param {function} [callback] an optional call back function, i.e. function (err, message).
 * @return {Promise}
 */
BloodySimpleSQS.prototype.peek = function (options, callback) {
  var self = this, params, resolver;

  // handle optional "options" param
  if (!_.isPlainObject(options)) {
    if (_.isFunction(options)) {
      callback = options;
    } else if (!_.isUndefined(options)) {
      return Promise.reject(new Error(
        'Invalid options param; ' +
        'expected object, received ' + typeof(options)
      )).nodeify(callback);
    }

    options = {};
  }

  // set options defaults
  options = _.defaults(options, {
    timeout: 0,
    limit: 1
  });

  params = {
    QueueUrl: self.queueUrl,
    MaxNumberOfMessages: options.limit,
    WaitTimeSeconds: options.timeout
  };

  resolver = function(resolve, reject) {
    self.sqs.receiveMessage(params, function(err, response) {
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
 * @param {function} [callback] an optional callback function, i.e. function (err).
 * @return {Promise}
 */
BloodySimpleSQS.prototype.remove = function (receiptHandle, callback) {
  var self = this, params, resolver;

  params = {
    QueueUrl: self.queueUrl,
    ReceiptHandle: receiptHandle
  };

  resolver = function(resolve, reject) {
    self.sqs.deleteMessage(params, function(err) {
      if (err) return reject(err);
      resolve();
    });
  };

  return this._contructPromise(resolver).nodeify(callback);
};

/**
 * Retrieves and removes the head of the queue, or returns null if queue is empty.
 * @param {object} [options] optional request options.
 * @param {function} [callback] an optional call back function, i.e. function (err, message).
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
 * Returns a new ReadStream object consuming the queue's messages.
 * @return {stream.Readable}
 */
BloodySimpleSQS.prototype.createReadStream = function () {
  var self = this,
    rs = new Readable({
      highWaterMark: 1, // as little as possible
      objectMode: true,
      encoding: 'utf8'
    });

  rs._read = function () {
    self.poll()
      .then(function (message) {
        if (!message) {
          return rs.push(null); // end
        }

        rs.push(message.body, 'utf8');
      })
      .catch(function (err) {
        rs.emit('error', err);
      });
  };

  return rs;
};

module.exports = BloodySimpleSQS;
