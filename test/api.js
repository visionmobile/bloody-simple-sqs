require('dotenv').load(); // load environmental variables

var chai = require('chai');
var assert = chai.assert;
var SQS = require('../');

describe('BloodySimpleSQS API', function () {

  var queue = new SQS({
    queueName: 'bloody-simple-sqs-test',
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
  });

  describe('#getUrl()', function () {

    it('works with callbacks', function (done) {
      queue.getUrl(done);
    });

  });

  describe('#add()', function () {

    it('throws error when payload is undefined', function () {
      assert.throws(function () {queue.add();}, /payload is required/i);
    });

  });

  describe('#peek()', function () {

    it('throws error when options is invalid', function () {
      assert.throws(function () {queue.peek(null);}, /options must be an object/i);
      assert.throws(function () {queue.peek(1);}, /options must be an object/i);
      assert.throws(function () {queue.peek('str');}, /options must be an object/i);
    });

    it('accepts timeout and limit options', function (done) {
      queue.peek({limit: 2, timeout: 1}).then(function () { done(); }).catch(done);
    });

    it('works with callbacks', function (done) {
      queue.peek(done);
    });

  });

  describe('#poll()', function () {

    it('throws error when options is invalid', function () {
      assert.throws(function () {queue.poll(null);}, /options must be an object/i);
      assert.throws(function () {queue.poll(1);}, /options must be an object/i);
      assert.throws(function () {queue.poll('str');}, /options must be an object/i);
    });

  });

  describe('#remove()', function () {

    it('throws error when receiptHandle is undefined', function () {
      assert.throws(function () {queue.remove();}, /receipt handle is required/i);
    });

    it('throws error when receiptHandle is invalid', function () {
      assert.throws(function () {queue.remove(null);}, /receipt handle must be a string/i);
      assert.throws(function () {queue.remove(1);}, /receipt handle must be a string/i);
      assert.throws(function () {queue.remove({});}, /receipt handle must be a string/i);
      // assert.throws(function () {queue.remove(function () {});}, /receipt handle must be a string/i);
    });

  });

});
