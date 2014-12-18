var path = require('path'),
  Mocha = require('mocha'),
  mocha;

// init mocha
mocha = new Mocha({
  reporter: 'spec',
  timeout: 30000 // 30 secs
});

// load the test files
mocha.addFile(path.resolve(__dirname, './api'));
mocha.addFile(path.resolve(__dirname, './operation'));

// run the tests
mocha.run(function (failures) {
  process.on('exit', function () {
    process.exit(failures);
  });
});
