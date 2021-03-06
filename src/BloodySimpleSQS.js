const EventEmitter = require('events').EventEmitter;
const Readable = require('stream').Readable;

const AWS = require('aws-sdk');
const Promise = require('bluebird');
const _ = require('lodash');
const uuid = require('node-uuid');
const type = require('type-of');
const CustomError = require('customerror');

class BloodySimpleSQS extends EventEmitter {

  /**
   * Constructs and returns a new bloody simple SQS client.
   * @param {Object} options SQS client options.
   * @param {String} options.queueName the name of the queue as provided by AWS.
   * @param {String} options.accessKeyId your AWS access key ID.
   * @param {String} options.secretAccessKey your AWS secret access key.
   * @param {String} [options.region=us-east-1] the region of the queue as provided by AWS.
   * @constructor
   */
  constructor(options) {
    // init event emitter
    super();
    this.setMaxListeners(999);

    // validate arguments
    if (!_.isPlainObject(options)) {
      throw new CustomError(`Invalid options param; expected object, received ${type(options)}`, 'InvalidArgument');
    }

    // set default options
    options = _.defaults(options, {
      region: 'us-east-1'
    });

    // validate options
    if (!_.isString(options.queueName)) {
      throw new CustomError(`Invalid queueName option; expected string, received ${type(options.queueName)}`, 'InvalidArgument');
    }

    if (!_.isString(options.accessKeyId)) {
      throw new CustomError(`Invalid accessKeyId option; expected string, received ${type(options.accessKeyId)}`, 'InvalidArgument');
    }

    if (!_.isString(options.secretAccessKey)) {
      throw new CustomError(`Invalid secretAccessKey option; expected string, received ${type(options.secretAccessKey)}`, 'InvalidArgument');
    }

    if (!_.isString(options.region)) {
      throw new CustomError(`Invalid region option; expected string, received ${type(options.region)}`, 'InvalidArgument');
    }

    // init internal aws-sdk client
    this.queueName = options.queueName;

    this.sqs = new AWS.SQS({
      queueName: options.queueName,
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
      region: options.region,
      apiVersion: '2012-11-05'
    });

    // retrieve queue URL and emit ready
    this.getUrl().then((url) => {
      this.queueUrl = url;
      this.isReady = true;
      this.emit('ready');
    });
  }

  /**
   * Returns a promise that will be resolved when the queue emits ready.
   * @return {Promise}
   * @private
   */
  _ready() {
    return new Promise((resolve) => {
      if (this.isReady) {
        resolve();
      } else {
        this.once('ready', () => resolve());
      }
    });
  }

  /**
   * Retrieves the URL of the queue from AWS.
   * @param {Function} [callback] an optional callback function with (err, url) arguments.
   * @return {Promise}
   */
  getUrl(callback) {
    // check if queue URL is already set
    if (this.isReady) {
      return Promise.resolve(this.queueUrl).nodeify(callback);
    }

    const resolver = (resolve, reject) => {
      this.sqs.getQueueUrl({
        QueueName: this.queueName
      }, (err, response) => {
        if (err) return reject(err);

        resolve(response.QueueUrl);
      });
    };

    return new Promise(resolver).nodeify(callback);
  }

  /**
   * Returns the number of messages in the queue.
   * @param {Function} [callback] an optional callback function with (err, size) arguments.
   * @return {Promise}
   */
  size(callback) {
    const resolver = (resolve, reject) => {
      this.sqs.getQueueAttributes({
        QueueUrl: this.queueUrl,
        AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
      }, (err, response) => {
        if (err) return reject(err);

        const n = parseInt(response.Attributes.ApproximateNumberOfMessages, 10) +
          parseInt(response.Attributes.ApproximateNumberOfMessagesNotVisible, 10);

        resolve(n);
      });
    };

    return this._ready()
      .then(() => new Promise(resolver))
      .nodeify(callback);
  }

  /**
   * Indicates whether the queue is empty.
   * @param {Function} [callback] an optional callback function (err, isEmpty) arguments.
   * @return {Promise}
   */
  isEmpty(callback) {
    return this.size()
      .then((n) => n === 0)
      .nodeify(callback);
  }

  /**
   * Appends a new message, with the given payload, at the end of the queue.
   * @param {(Boolean|String|Number|Object|null)} payload the message payload
   * @param {Object} [options] request options
   * @param {Integer} [options.delaySeconds] the number of seconds (0 to 900 - 15 minutes) to delay the delivery of the message
   * @param {Function} [callback] an optional callback function with (err, response) arguments
   * @return {Promise}
   */
  add(payload, options, callback) {
    // validate arguments
    if (
      !_.isNumber(payload) &&
      !_.isString(payload) &&
      !_.isPlainObject(payload) &&
      !_.isBoolean(payload) &&
      !_.isNull(payload)
    ) {
      return Promise.reject(new CustomError(`Invalid payload argument; expected number, string, boolean, object or null, received ${type(payload)}`, 'InvalidArgument'))
        .nodeify(callback);
    }

    if (_.isFunction(options)) {
      callback = options;
      options = {};
    } else if (_.isUndefined(options)) {
      options = {};
    } else if (!_.isPlainObject(options)) {
      return Promise.reject(new CustomError(`Invalid options argument; expected object, received ${type(options)}`, 'InvalidArgument'))
        .nodeify(callback);
    }

    // define promise resolver
    const resolver = (resolve, reject) => {
      const params = {
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(payload)
      };

      if (!_.isUndefined(options.delaySeconds)) {
        params.DelaySeconds = options.delaySeconds;
      }

      this.sqs.sendMessage(params, (err, response) => {
        if (err) return reject(err);

        resolve({
          id: response.MessageId,
          body: payload,
          md5: response.MD5OfMessageBody
        });
      });
    };

    return this._ready()
      .then(() => new Promise(resolver))
      .nodeify(callback);
  }

  /**
   * Appends the elements of the specified array as messages to the queue.
   * @param {Array} arr an array of elements to append.
   * @param {Object} [options] optional request options
   * @param {Integer} [options.delaySeconds] the number of seconds (0 to 900 - 15 minutes) to delay the delivery of the message
   * @param {Function} [callback] an optional callback function with (err, response) arguments.
   * @return {Promise}
   */
  addAll(arr, options, callback) {
    // validate arguments
    if (!_.isArray(arr)) {
      return Promise.reject(new CustomError(`Invalid arr argument; expected array, received ${type(arr)}`, 'InvalidArgument'))
        .nodeify(callback);
    }

    if (_.isFunction(options)) {
      callback = options;
      options = {};
    } else if (_.isUndefined(options)) {
      options = {};
    } else if (!_.isPlainObject(options)) {
      return Promise.reject(new CustomError(`Invalid options argument; expected object, received ${type(options)}`, 'InvalidArgument'))
        .nodeify(callback);
    }

    // check if array is empty
    if (arr.length === 0) {
      return Promise.resolve([]).nodeify(callback); // exit
    }

    // check if array contains more than 10 elements
    if (arr.length > 10) {
      // split in chunks
      return Promise.map(_.chunk(arr, 10), (chunk) => {
        return this.addAll(chunk);
      })
        .then(_.flatten)
        .nodeify(callback);
    }

    // define promise resolver
    const resolver = (resolve, reject) => {
      const params = {
        QueueUrl: this.queueUrl,
        Entries: arr.map((e) => {
          return {
            Id: uuid.v4(),
            MessageBody: JSON.stringify(e)
          };
        })
      };

      if (!_.isUndefined(options.delaySeconds)) {
        params.Entries.map((e) => {
          e.DelaySeconds = options.delaySeconds;
          return e;
        });
      }

      this.sqs.sendMessageBatch(params, (err) => {
        if (err) return reject(err);
        resolve();
      });
    };

    return this._ready()
      .then(() => new Promise(resolver))
      .nodeify(callback);
  }

  /**
   * Retrieves, but does not remove, the specified number of messages from the head of the queue.
   * @param {Object} [options] optional request options.
   * @param {Integer} [options.timeout=0] number of seconds to wait until a message becomes available for retrieval; must be between 0 and 20.
   * @param {Integer} [options.limit=1] maximum number of messages to return.
   * @param {Function} [callback] an optional callback function with (err, messages) arguments.
   * @return {Promise}
   */
  peek(options, callback) {
    // validate arguments
    if (_.isFunction(options)) {
      callback = options;
      options = {};
    } else if (_.isUndefined(options)) {
      options = {};
    } else if (!_.isPlainObject(options)) {
      return Promise.reject(new CustomError(`Invalid options argument; expected object, received ${type(options)}`, 'InvalidArgument'))
        .nodeify(callback);
    }

    // set default options
    options = _.defaults(options, {
      timeout: 0,
      limit: 1
    });

    // validate options
    if (!_.isNumber(options.timeout)) {
      return Promise.reject(new CustomError(`Invalid timeout option; expected number, received ${type(options.timeout)}`, 'InvalidArgument'))
        .nodeify(callback);
    }

    if (!_.isNumber(options.limit)) {
      return Promise.reject(new CustomError(`Invalid limit option; expected number, received ${type(options.limit)}`, 'InvalidArgument'))
        .nodeify(callback);
    }

    // check if array contains more than 10 elements
    if (options.limit > 10) {
      // split in chunks
      return Promise.map(_.chunk(new Array(options.limit), 10), (chunk) => {
        return this.peek({timeout: options.timeout, limit: chunk.length});
      })
        .then(_.flatten)
        .nodeify(callback);
    }

    // define promise resolver
    const resolver = (resolve, reject) => {
      this.sqs.receiveMessage({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: options.limit,
        WaitTimeSeconds: options.timeout
      }, (err, response) => {
        if (err) return reject(err);

        const messages = (response.Messages || [])
          .map((obj) => {
            return {
              id: obj.MessageId,
              body: JSON.parse(obj.Body),
              md5: obj.MD5OfBody,
              receiptHandle: obj.ReceiptHandle
            };
          });

        resolve(messages);
      });
    };

    return this._ready()
      .then(() => new Promise(resolver))
      .nodeify(callback);
  }

  /**
   * Retrieves, but does not remove, the first message from the head of the queue.
   * @param {Object} [options] optional request options.
   * @param {Integer} [options.timeout=0] number of seconds to wait until a message becomes available for retrieval; must be between 0 and 20.
   * @param {Function} [callback] an optional callback function with (err, messages) arguments.
   * @return {Promise}
   */
  peekOne(options, callback) {
    // validate arguments
    if (_.isFunction(options)) {
      callback = options;
      options = {};
    } else if (_.isUndefined(options)) {
      options = {};
    } else if (!_.isPlainObject(options)) {
      return Promise.reject(new CustomError(`Invalid options argument; expected object, received ${type(options)}`, 'InvalidArgument'))
        .nodeify(callback);
    }

    // set default options
    options = _.defaults(options, {
      timeout: 0
    });

    // set hard limit to 1
    options.limit = 1;

    // peek and unpack returned messages
    return this.peek(options)

      .then((messages) => {
        if (messages.length === 0) {
          return null;
        }

        return messages[0];
      })

      .nodeify(callback);
  }

  /**
   * Removes the designated message from queue.
   * @param {Object, String} message a message (as provided by #peek, #poll, #peekOne, #pollOne) or its receipt handle.
   * @param {Function} [callback] an optional callback function with (err) arguments.
   * @return {Promise}
   */
  remove(message, callback) {
    let receiptHandle;

    // extract receiptHandle from message
    if (_.isString(message)) {
      receiptHandle = message;
    } else if (_.isObject(message)) {
      receiptHandle = message.receiptHandle;
    }

    // make sure receiptHandle is valid
    if (!_.isString(receiptHandle)) {
      return Promise.reject(new CustomError(`Invalid message argument; expected string or object with a receiptHandle property, received ${type(message)}`, 'InvalidArgument'))
        .nodeify(callback);
    }

    // define promise resolver
    const resolver = (resolve, reject) => {
      this.sqs.deleteMessage({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle
      }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    };

    return this._ready()
      .then(() => new Promise(resolver))
      .nodeify(callback);
  }

  /**
   * Removes the designated messages from queue.
   * @param {Array<String, Object>} messages an array of messages or receipt handles.
   * @param {Function} [callback] an optional callback function with (err) arguments.
   * @return {Promise}
   */
  removeAll(messages, callback) {
    // validate arguments
    if (!_.isArray(messages)) {
      return Promise.reject(new CustomError(`Invalid messages argument; expected array, received ${type(messages)}`, 'InvalidArgument'))
        .nodeify(callback);
    }

    return Promise.map(messages, (e, i) => {
      return this.remove(e)
        .catch((err) => {
          err.message = `Invalid element at position ${i} in the messages array`;
          throw err;
        });
    })
      .nodeify(callback);
  }

  /**
   * Retrieves and removes the specified number of messages from the head of the queue.
   * @param {Object} [options] optional request options.
   * @param {Integer} [options.timeout=0] number of seconds to wait until a message becomes available for retrieval; must be between 0 and 20.
   * @param {Integer} [options.limit=1] maximum number of messages to return.
   * @param {Function} [callback] an optional callback function with (err, messages) arguments.
   * @return {Promise}
   */
  poll(options, callback) {
    return this.peek(options)

      .map((message) => {
        return this.remove(message.receiptHandle).return(message);
      })

      .nodeify(callback);
  }

  /**
   * Retrieves and removes the first message from the head of the queue.
   * @param {Object} [options] optional request options.
   * @param {Integer} [options.timeout=0] number of seconds to wait until a message becomes available for retrieval; must be between 0 and 20.
   * @param {Function} [callback] an optional callback function with (err, messages) arguments.
   * @return {Promise}
   */
  pollOne(options, callback) {
    return this.peekOne(options)

      .then((message) => {
        if (!message) {
          return null;
        }

        return this.remove(message.receiptHandle).return(message);
      })

      .nodeify(callback);
  }

  /**
   * Removes all messages from queue.
   * @param {Function} [callback] an optional callback function with (err) arguments.
   * @return {Promise}
   */
  clear(callback) {
    const resolver = (resolve, reject) => {
      this.sqs.purgeQueue({QueueUrl: this.queueUrl}, (err) => {
        if (err) return reject(err);
        resolve();
      });
    };

    return this._ready()
      .then(() => new Promise(resolver))
      .nodeify(callback);
  }

  /**
   * Returns a new ReadStream object consuming the queue's messages.
   * @return {stream.Readable}
   */
  createReadStream() {
    const rs = new Readable({
      highWaterMark: 1, // as little as possible
      objectMode: true,
      encoding: 'utf8'
    });

    rs._read = () => {
      this.pollOne()

        .then((message) => {
          if (!message) {
            return rs.push(null); // exit
          }

          rs.push(message.body, 'utf8');
        })

        .catch((err) => {
          rs.emit('error', err);
        });
    };

    return rs;
  }
}

module.exports = BloodySimpleSQS;
