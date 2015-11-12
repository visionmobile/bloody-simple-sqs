const assert = require('chai').assert;
const SQS = require('../src/BloodySimpleSQS');

describe('BloodySimpleSQS', function () {

  let queue = new SQS({
    queueName: 'bloody-simple-sqs',
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  });

  let size, receiptHandle;

  describe('#getUrl()', function () {

    it('accepts a callback function', function (done) {
      queue.getUrl(done);
    });

    it('returns the URL of the queue', function (done) {
      queue.getUrl()

        .then(function (url) {
          assert.isString(url);
        })

        .then(done, done);
    });

  });

  describe('#size()', function () {

    it('returns the size of the queue', function (done) {
      queue.size()

        .then(function (n) {
          assert.isNumber(n);
          size = n;
        })

        .then(done, done);
    });

  });

  describe('#add()', function () {

    it('rejects with error when payload is undefined', function (done) {
      queue.add()

        .catch(function (err) {
          assert.match(err, /invalid payload argument/i);
          done();
        });
    });

    it('appends message to queue', function (done) {
      queue.add({v: 1})

        .then(function (message) {
          assert.property(message, 'id');
          assert.isString(message.id);
          assert.property(message, 'body');
          assert.isObject(message.body);
          assert.property(message, 'md5');
          assert.isString(message.md5);
        })

        .delay(5000)

        .then(done, done);
    });

    it('increases queue size by 1', function (done) {
      queue.size()

        .then(function (n) {
          assert.strictEqual(n, size + 1);
          size = n;
        })

        .then(done, done);
    });

  });

  describe('#addAll()', function () {

    it('rejects with error when arr is undefined', function (done) {
      queue.addAll()

        .catch(function (err) {
          assert.match(err, /invalid arr argument/i);
          done();
        });
    });

  });

  describe('#peek()', function () {

    it('rejects with error when options is null', function (done) {
      queue.peek(null)

        .catch(function (err) {
          assert.match(err, /invalid options argument/i);
          done();
        });
    });

    it('rejects with error when options is number', function (done) {
      queue.peek(123)

        .catch(function (err) {
          assert.match(err, /invalid options argument/i);
          done();
        });
    });

    it('rejects with error when options is string', function (done) {
      queue.peek('string')

        .catch(function (err) {
          assert.match(err, /invalid options argument/i);
          done();
        });
    });

    it('returns array of messages', function (done) {
      queue.peek()

        .then(function (messages) {
          assert.isArray(messages);
          assert.lengthOf(messages, 1);

          let message = messages[0];

          assert.property(message, 'id');
          assert.isString(message.id);
          assert.property(message, 'body');
          assert.isObject(message.body);
          assert.property(message.body, 'v');
          assert.strictEqual(message.body.v, 1);
          assert.property(message, 'md5');
          assert.isString(message.md5);
          assert.property(message, 'receiptHandle');
          assert.isString(message.receiptHandle);

          receiptHandle = message.receiptHandle;
        })

        .then(done, done);
    });

  });

  describe('#poll()', function () {

    it('rejects with error when options is null', function (done) {
      queue.poll(null)

        .catch(function (err) {
          assert.match(err, /invalid options argument/i);
          done();
        });
    });

    it('rejects with error when options is number', function (done) {
      queue.poll(123)

        .catch(function (err) {
          assert.match(err, /invalid options argument/i);
          done();
        });
    });

    it('rejects with error when options is string', function (done) {
      queue.poll('string')

        .catch(function (err) {
          assert.match(err, /invalid options argument/i);
          done();
        });
    });

  });

  describe('#remove()', function () {

    it('rejects with error when receiptHandle is undefined', function (done) {
      queue.remove()

        .catch(function (err) {
          assert.match(err, /invalid receiptHandle argument/i);
          done();
        });
    });

    it('rejects with error when receiptHandle is null', function (done) {
      queue.remove(null)

        .catch(function (err) {
          assert.match(err, /invalid receiptHandle argument/i);
          done();
        });
    });

    it('rejects with error when receiptHandle is number', function (done) {
      queue.remove(123)

        .catch(function (err) {
          assert.match(err, /invalid receiptHandle argument/i);
          done();
        });
    });

    it('rejects with error when receiptHandle is object', function (done) {
      queue.remove({})

        .catch(function (err) {
          assert.match(err, /invalid receiptHandle argument/i);
          done();
        });
    });

    it('removes message from queue', function (done) {
      queue.remove(receiptHandle)
        .delay(5000)
        .then(done, done);
    });

    it('reduces size by 1', function (done) {
      queue.size()

        .then(function (n) {
          assert.strictEqual(n, size - 1);
          size = n;
        })

        .then(done, done);
    });

  });

  describe('#clear()', function () {

    it('removes all messages from queue', function (done) {
      queue.clear().then(done, done);
    });

    it('renders the queue empty', function (done) {
      queue.isEmpty()

        .then(function (isEmpty) {
          assert.isBoolean(isEmpty);
          assert.strictEqual(isEmpty, true);
        })

        .then(done, done);
    });

  });

});
