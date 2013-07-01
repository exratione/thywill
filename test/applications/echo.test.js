/**
 * @fileOverview
 * Vows tests for the Echo example application.
 *
 * These are base tests without Express, Redis, or other frills.
 */

var tools = require('../lib/tools');

// Obtain a test suit that launches Thywill in a child process.
var suite = tools.application.vowsSuite('Application: Echo', {
  applicationName: 'echo',
  // The initial batches load the application page and then connect via
  // Socket.IO. The matches are checked against the page contents. Here
  // we're looking at the templates that should be included.
  pageMatches: [
    '<div class="echoed-message">{{data}}</div>'
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

// Test the echoing functionality.
tools.application.addSendAndAwaitResponsesBatch('Echo message and response', suite, {
  applicationId: 'echo',
  actionIndex: 0,
  responseIndexes: 0,
  sendMessage: 'test',
  responseMessage: 'test'
});

// Ensure that clients are closed and child processes are killed.
tools.application.closeVowsSuite(suite);

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
