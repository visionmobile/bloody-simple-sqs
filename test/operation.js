require('dotenv').load({silent: true}); // load environmental variables

var chai = require('chai');
var assert = chai.assert;
var SQS = require('../');

describe('BloodySimpleSQS', function () {

  var queue = new SQS({
    queueName: 'bloody-simple-sqs',
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  });

  it('completes a full message operation consistently', function (done) {
    var size;

    queue.getUrl()
      .then(function (url) {
        assert.isString(url);
      })

      .then(function () {
        return queue.size();
      })
      .then(function (n) {
        assert.isNumber(n);
        size = n;
      })

      .then(function () {
        return queue.add({v: 1});
      })
      .then(function (message) {
        assert.property(message, 'id');
        assert.isString(message.id);
        assert.property(message, 'body');
        assert.isObject(message.body);
        assert.property(message, 'md5');
        assert.isString(message.md5);
      })
      .delay(500)

      .then(function () {
        return queue.size();
      })
      .then(function (n) {
        assert.strictEqual(n, size + 1);
        size = n;
      })

      .then(function () {
        return queue.peek();
      })
      .then(function (message) {
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
        return queue.remove(message.receiptHandle);
      })
      .delay(500)

      .then(function () {
        return queue.size();
      })
      .then(function (n) {
        assert.strictEqual(n, size - 1);
        size = n;
      })

      .then(function () {
        return queue.clear();
      })
      .delay(500)

      .then(function () {
        return queue.isEmpty();
      })
      .then(function (isEmpty) {
        assert.isBoolean(isEmpty);
        assert.strictEqual(isEmpty, true);
      })

      .then(done, done);
  });

});
