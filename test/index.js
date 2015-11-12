require('dotenv').load({silent: true});
require('babel-core/register');

const path = require('path');
const Mocha = require('mocha');

// init mocha
const mocha = new Mocha({
  reporter: 'spec',
  timeout: 60000 // 60 secs
});

// load the test files
mocha.addFile(path.resolve(__dirname, './bloody-simple-sqs'));

// run the tests
mocha.run(function (failures) {
  process.on('exit', function () {
    process.exit(failures);
  });
});
