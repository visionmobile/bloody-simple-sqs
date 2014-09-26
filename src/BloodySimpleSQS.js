var events = require('events'),
  util = require('util'),
  Readable = require('stream').Readable,
  _ = require('lodash'),
  AWS = require('aws-sdk'),
  Promise = require('bluebird');

/**
 * Constructs and returns a new bloody simple SQS client.
 * @param {object} options SQS client options.
 * @param {string} options.queueName the name of the queue to connect to.
 * @param {string} options.accessKeyId your AWS access key ID.
 * @param {string} options.secretAccessKey your AWS secret access key.
 * @param {string} [options.region=us-east-1] the AWS region of the queue.
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
  this._getQueueUrl()
    .bind(this)
    .then(function (url) {
      this.queueUrl = url;
      this.isReady = true;
      this.emit('ready');
    });
}

// BloodySimpleSQS extends the EventEmitter class
util.inherits(BloodySimpleSQS, events.EventEmitter);

/**
 * Retrieves the URL of the queue from AWS.
 * @return {Promise}
 * @private
 */
BloodySimpleSQS.prototype._getQueueUrl = function () {
  var self = this, resolver;

  resolver = function(resolve, reject) {
    var params = {
      QueueName: self.queueName
    };

    self.sqs.getQueueUrl(params, function(err, response) {
      if (err) return reject(err);

      resolve(response.QueueUrl);
    });
  };

  return new Promise(resolver);
};

/**
 * Appends a new message, with the designated payload, at the end of the queue.
 * @param {(boolean|string|number|object|null)} payload the message payload.
 * @param {function} [callback] an optional callback function, i.e. function (err, response).
 * @return {Promise}
 */
BloodySimpleSQS.prototype.add = function (payload, callback) {
  var self = this, resolver;

  resolver = function(resolve, reject) {
    var params = {
      QueueUrl: self.queueUrl,
      MessageBody: JSON.stringify(payload)
    };

    self.sqs.sendMessage(params, function(err, response) {
      if (err) return reject(err);

      resolve({
        id: response.MessageId,
        body: payload,
        md5: response.MD5OfMessageBody
      });
    });
  };

  return new Promise(function(resolve, reject) {
    if (self.isReady) {
      resolver(resolve, reject);
    } else { // delay until ready
      self.once('ready', function () {
        resolver(resolve, reject);
      });
    }
  }).nodeify(callback);
};

/**
 * Retrieves, but does not remove, the head of the queue.
 * @param {object} [options] optional request options.
 * @param {number} [options.timeout=0] number of seconds to wait until a message arrives in the queue; must be between 0 and 20.
 * @param {number} [options.limit=1] maximum number of messages to return; must be between 1 and 10.
 * @param {function} [callback] an optional call back function, i.e. function (err, receiptHandle).
 * @return {Promise}
 */
BloodySimpleSQS.prototype.peek = function (options, callback) {
  var self = this, resolver;

  // handle optional "options" param
  if (_.isFunction(options)) {
    callback = options;
    options = {};
  } else if (_.isUndefined(options)) {
    options = {};
  }

  options.timeout = options.timeout || 0;
  options.limit = options.limit || 1;

  resolver = function(resolve, reject) {
    var params = {
      QueueUrl: self.queueUrl,
      MaxNumberOfMessages: options.limit,
      WaitTimeSeconds: options.timeout
    };

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

  return new Promise(function(resolve, reject) {
    if (self.isReady) {
      resolver(resolve, reject);
    } else { // delay until ready
      self.once('ready', function () {
        resolver(resolve, reject);
      });
    }
  }).nodeify(callback);
};

/**
 * Removes the designated message from queue.
 * @param {string} receiptHandle the message's receipt handle, as given on peek().
 * @param {function} [callback] an optional callback function, i.e. function (err).
 * @return {Promise}
 */
BloodySimpleSQS.prototype.remove = function (receiptHandle, callback) {
  var self = this, resolver;

  resolver = function(resolve, reject) {
    var params = {
      QueueUrl: self.queueUrl,
      ReceiptHandle: receiptHandle
    };

    self.sqs.deleteMessage(params, function(err) {
      if (err) return reject(err);

      resolve();
    });
  };

  return new Promise(function(resolve, reject) {
    if (self.isReady) {
      resolver(resolve, reject);
    } else { // delay until ready
      self.once('ready', function () {
        resolver(resolve, reject);
      });
    }
  }).nodeify(callback);
};


/**
 * Retrieves and removes the head of this queue, or returns null if this queue is empty.
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
        return this.remove(message.receiptHandle)
          .then(function () {
            return message;
          });
      }

      return null;
    })
    .nodeify(callback);
};

/**
 * Appends a new message, with the designated payload, at the end of the queue.
 * @param {(boolean|string|number|object|null)} payload the message payload.
 * @param {function} [callback] an optional callback function, i.e. function (err, response).
 * @return {Promise}
 */
BloodySimpleSQS.prototype.createReadStream = function () {
  var self = this,
    rs = new Readable({
      highWaterMark: 1,
      objectMode: true,
      encoding: 'utf8'
    });

  rs._read = function () {
    self.poll()
      .then(function (message) {
        if (!message) return rs.push(null); // end
        rs.push(message.body);
      })
      .catch(function (err) {
        rs.emit('error', err);
      });
  };

  return rs;
};


module.exports = BloodySimpleSQS;

// require('dotenv').load();
// var sqs = new BloodySimpleSQS({
//   queueName: process.env.SQS_QUEUE_NAME,
//   accessKeyId: process.env.SQS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.SQS_SECRET_ACCESS_KEY,
//   region: process.env.SQS_REGION
// });
// var rs = sqs.createReadStream();
// rs.on('readable', function() {
//   setTimeout(function () {
//     console.log(rs.read())
//   }, 2000);
// }).on('error', function (err) {
//   console.log(err)
// });
