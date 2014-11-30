# Bloody Simple SQS: API reference

## Table of Contents

* [Intro](#intro)
* [Methods](#methods)
  * [getUrl([callback])](#getUrl)
  * [count(selector, [options], [callback])](#wiki-count)
  * [del(selector, [options], [callback])](#wiki-del)
  * [add(records, [callback])](#wiki-add)
  * [set(records, [callback])](#wiki-set)
  * [hasColumn(column)](#wiki-hasColumn)
  * [isPrimaryKey(*columns)](#wiki-isPrimaryKey)
  * [isUniqueKey(*columns)](#wiki-isUniqueKey)
  * [isIndexKey(*columns)](#wiki-isIndexKey)

## Intro

Install bloody-simple-sqs using npm.

```
$ npm install naomi
```

## Methods

### <a name="get" href="#wiki-get">#</a>get(selector, [options], [callback]) -> promise

Retrieves the designated record(s) from table. Returns a promise resolving to an array of records.

##### Parameters

* `selector` _(boolean, number, string, Date, object, Array, null)_ selector to match records in table
* `options` _(object)_ optional query options
  * `order` _(string, object, Array)_ order expression to sort returned records
  * `limit` _(string, number)_ max number of records to return from table - must be a positive integer, i.e. limit > 0
  * `offset` _(string, number)_ number of records to skip from table - must be a non-negative integer, i.e. offset >= 0
* `callback` _(function)_ optional callback function

##### Example

```javascript
employees.get({
  age: 30
}, {
  order: {lastname: 'desc'},
  limit: 5,
  offset: 2
})
  .then(function (records) {
    if (records.length !== 0) {
      // do something with records
    }
  })
  .catch(function (err) {
    console.error(err);
  });
```
