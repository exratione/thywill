/**
 * @fileOverview
 * Vows tests for the Tabular example application.
 *
 * These are base tests with Express, but without Redis or other frills.
 */

var assert = require('assert');
var tools = require('../lib/tools');

// Obtain a test suit that launches Thywill in a child process.
var suite = tools.application.vowsSuite('Application: Tabular', {
  applicationName: 'tabular',
  // The initial batches load the application page and then connect via
  // Socket.IO. The matches are checked against the page contents. Here
  // we're looking at the templates that should be included.
  pageMatches: [
    '<html data-ng-app="tabular" class="no-js" lang="en">'
  ],
  // Data for the processes to launch.
  processData: [
    {
      port: 10079,
      clusterMemberId: 'alpha'
    }
  ],
  // Set a long timeout for actions, because things sometimes lag on a small
  // server when running a bunch of tests.
  defaultTimeout: 5000
});

/**
 * Helper function used to check to see that a response message consisting of
 * a data row looks ok. We can't just use a straight comparison, as the thing
 * contains random data.
 */
var expectedResponseEmitted = function (unusedError, results) {
  assert.isNull(results[0].error);
  assert.strictEqual(results[0].socketEvent.args[0], 'tabular');
  var data = results[0].socketEvent.args[1].data;
  assert.isArray(data);
  assert.strictEqual(5, data.length);
};

// Start the data mill, and check to see that the first response is the expected
// array of values.
tools.application.addSendAndAwaitResponsesBatch('Start data sending, expect first response', suite, {
  applicationId: 'tabular',
  actionIndex: 0,
  responseIndexes: 0,
  sendMessage: 'start',
  vows: {
    'expected response emitted': expectedResponseEmitted
  }
});

// Make sure that the next response turns up.
// Start the data mill, and check to see that the first response is the expected
// array of values.
tools.application.addAwaitResponsesBatch('Start data sending, expect first response', suite, {
  applicationId: 'tabular',
  responseIndexes: 0,
  // Up the timeout for this one, make absolutely sure we get it, as it's
  // delayed by the server for a few seconds.
  timeout: 10000,
  vows: {
    'expected response emitted': expectedResponseEmitted
  }
});

// Then stop and ensure that nothing turns up.
tools.application.addSendAndConfirmNoResponsesBatch('Stop data sending, expect no further response', suite, {
  applicationId: 'tabular',
  actionIndex: 0,
  responseIndexes: 0,
  sendMessage: 'stop',
  // Up the timeout for this one, make absolutely sure.
  timeout: 10000
});

// Ensure that clients are closed and child processes are killed.
tools.application.closeVowsSuite(suite);

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
