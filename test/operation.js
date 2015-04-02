require('dotenv').load(); // load environmental variables

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

        return queue.size();
      })
      .then(function (n) {
        assert.isNumber(n);
        size = n;

        return queue.add({v: 1});
      })
      .then(function (message) {
        assert.property(message, 'id');
        assert.isString(message.id);
        assert.property(message, 'body');
        assert.isObject(message.body);
        assert.property(message, 'md5');
        assert.isString(message.md5);

        return queue.size();
      })
      .then(function (n) {
        assert.strictEqual(n, size + 1);
        size = n;

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
      .then(function () {
        return queue.size();
      })
      .then(function (n) {
        assert.strictEqual(n, size - 1);
        size = n;

        return queue.clear();
      })
      .then(function () {
        return queue.isEmpty();
      })
      .then(function (isEmpty) {
        assert.isBoolean(isEmpty);
        assert.strictEqual(isEmpty, true);
      })
      .then(function () { done(); }).catch(done);
  });

});
