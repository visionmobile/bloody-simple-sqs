# API reference

## Table of Contents

* [Intro](#intro)
* [Methods](#methods)
  * [add(payload, [callback])](#add)
  * [createReadStream()](#createReadStream)
  * [getUrl([callback])](#getUrl)
  * [isEmpty([callback])](#isEmpty)
  * [peek([options], [callback])](#peek)
  * [poll([options], [callback])](#poll)
  * [remove(receiptHandle, [callback])](#remove)
  * [size([callback])](#size)

## Intro

Install bloody-simple-sqs using npm.

```
$ npm install bloody-simple-sqs
```

## Methods

### <a name="add" href="add">#</a>add(payload, [callback]) -> promise

Appends a new message, with the given payload, at the end of the queue.

##### Parameters

* `payload` _(boolean, string, number, object, null)_ the message payload
* `callback` _(function)_ optional callback function with (err, data) arguments

##### Returns

A Promise resolving to an object with the following properties.

* `id` _(string)_ the id of the message in Amazon SQS
* `body`_(boolean, string, number, object, null)_ the message payload
* `md5`_(string)_ an MD5 digest of the payload; this can be used to verify that Amazon SQS received the message correctly

##### Example

```javascript
sqs.add({a: 1, b: 2})
  .then(function (data) {
    console.log('Message sucessfully appended to Queue with id ' + data.id); 
  })
  .catch(function (err) {
    console.error(err);
  });
```
