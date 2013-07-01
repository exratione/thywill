/**
 * @fileOverview
 * Vows tests for the Draw example application.
 *
 * These are cluster tests using Express, Redis, and multiple Thywill
 * processes.
 */

var tools = require('../lib/tools');

// Obtain a test suit that launches Thywill instances in child processes.
var suite = tools.application.vowsSuite('Application: Draw', {
  applicationName: 'draw',
  // The initial batches load the application page and then connect via
  // Socket.IO. The matches are checked against the page contents. Here
  // we're looking at the templates that should be included.
  pageMatches: [
    '<div id="title">{{title}}</div>'
  ],
  // Data for the processes to launch.
  processData: [
    {
      port: 10078,
      clusterMemberId: 'alpha'
    },
    {
      port: 10079,
      clusterMemberId: 'beta'
    }
  ],
  // Set a long timeout for actions, because things sometimes lag on a small
  // server when running a bunch of tests.
  defaultTimeout: 5000
});

// Test the functionality for sending notice of a drawn item and having
// the same data broadcast to the other client.
//
// Send fake data, since we're not actually processing the front end stuff.
var sendMessage = { segments: [] };
var responseMessage = { segments: [] };
tools.application.addSendAndAwaitResponsesBatch('Draw line data message and response', suite, {
  applicationId: 'draw',
  actionIndex: 0,
  responseIndexes: 1,
  sendMessage: sendMessage,
  responseMessage: responseMessage
});

// Ensure that clients are closed and child processes are killed.
tools.application.closeVowsSuite(suite);

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
