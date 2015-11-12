## 1.1.2 - 2015-11-12

* Use commonjs to import/export modules to avoid babel "default" decorator - see https://github.com/babel/babel/issues/2724 for further info.
* Replace gulpfile.js with gulpfile.babel.js

## 1.1.1 - 2015-11-06

* Update npm dependencies: aws-sdk@2.2.15, bluebird@3.0.5, babel@6.0.15, babel-core@6.1.2, gulp-babel@6.1.0, mocha@2.3.3, chai@3.4.0
* Replace local CustomError with customerror@1.0.1
* Replace jshint with eslint
* Deploy new build system with gulp + babel

## 1.1.0 - 2015-08-12

* Introduce `options` argument in #add() and #addAll() methods; accept `options.delaySeconds` (@chainlink)

## 1.0.1 - 2015-08-11

* Update the README file

## 1.0.0 - 2015-08-11

* Change #peek() and #poll() to always return an array
* Introduce #peekOne() and #pollOne() to pick and poll a single message object
* Update the docs

## 0.5.0 - 2015-08-11

* Rewrite in es2015 using babel + gulp
* Update npm dependencies: aws-sdk@2.1.44, mocha@2.2.5, dotenv@1.2.0, lodash@3.10.1, chai@3.2.0, bluebird@2.9.34

## 0.4.1 - 2015-05-04

* When limit > 1 return array on #peek or #poll, even if it's an empty one

## 0.4.0 - 2015-05-04

* Update the unit tests with new error messages and functionality

## 0.4.0-beta.3 - 2015-05-04

* Gracefully resolve to empty array on #addAll() when arr is empty

## 0.4.0-beta.2 - 2015-04-30

* Use lodash#chunk to process high limit values

## 0.4.0-beta.1 - 2015-04-28

* Introduce #addAll method to add messages in batches
* Allow limit > 10 with #peek and #poll

## 0.3.2 - 2015-04-23

* Update internal aws-sdk to v.2.1.24

## 0.3.1 - 2015-04-02

* Update internal AWS SDK library
* Replace Joi validation with lodash
* Implement Codeship CI

## 0.3.0 - 2014-12-18

* Replace validation logic using Joi@5.0.2
* Remove lodash dependency, that was previously being used for validation
* Introduce unit tests using mocha/chai

## 0.2.8 - 2014-12-17

* Expose #clear() method to remove all messages from queue
* Update the API docs with #clear()
* Update aws-sdk to v.2.1.2

## 0.2.7 - 2014-12-08

* Add extended markdown docs

## 0.2.6 - 2014-11-29

* Expose #getUrl() method
* Refactor code for readability and DRY

## 0.2.5 - 2014-11-24

* Create #size() method which returns the number of messages in queue

## 0.2.4 - 2014-11-24

* Create #isEmpty() method which indicates if the queue is empty
* Update bluebird to v.2.3.11
* Update aws-sdk to v.2.0.28
