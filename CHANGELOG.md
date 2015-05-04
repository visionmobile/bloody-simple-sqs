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
