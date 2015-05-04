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

    it('rejects with error when payload is undefined', function (done) {
      queue.add()
        .catch(function (err) {
          assert.match(err, /invalid payload argument/i);
          done();
        });
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

    it('accepts timeout and limit options', function (done) {
      queue.peek({limit: 2, timeout: 1}).then(function () { done(); }).catch(done);
    });

    it('works with callbacks', function (done) {
      queue.peek(done);
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

  });

});
