require('dotenv').load(); // load environmental variables

var chai = require('chai');
var assert = chai.assert;
var SQS = require('../');

describe('BloodySimpleSQS API', function () {

  var queue = new SQS({
    queueName: 'bloody-simple-sqs',
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
      assert.throws(function () {queue.add();}, /invalid payload param/i);
    });

  });

  describe('#peek()', function () {

    it('throws error when options is invalid', function () {
      assert.throws(function () {queue.peek(null);}, /invalid options param/i);
      assert.throws(function () {queue.peek(1);}, /invalid options param/i);
      assert.throws(function () {queue.peek('str');}, /invalid options param/i);
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
      assert.throws(function () {queue.poll(null);}, /invalid options param/i);
      assert.throws(function () {queue.poll(1);}, /invalid options param/i);
      assert.throws(function () {queue.poll('str');}, /invalid options param/i);
    });

  });

  describe('#remove()', function () {

    it('throws error when receiptHandle is undefined', function () {
      assert.throws(function () {queue.remove();}, /invalid receiptHandle param/i);
    });

    it('throws error when receiptHandle is invalid', function () {
      assert.throws(function () {queue.remove(null);}, /invalid receiptHandle param/i);
      assert.throws(function () {queue.remove(1);}, /invalid receiptHandle param/i);
      assert.throws(function () {queue.remove({});}, /invalid receiptHandle param/i);
      // assert.throws(function () {queue.remove(function () {});}, /receipt handle must be a string/i);
    });

  });

});
