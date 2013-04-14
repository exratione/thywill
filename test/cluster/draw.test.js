/**
 * @fileOverview
 * Vows tests for the Draw example application.
 *
 * These are cluster tests using Express, Redis, and multiple Thywill
 * processes.
 */

var tools = require("../lib/tools");

var suiteName = "Base: Draw application";
var applicationName = "draw";
// The initial batches load the application page and then connect via
// Socket.IO. The matches are checked against the page contents. Here
// we're looking at the templates that should be included.
var pageMatches = [
  '<div id="title">{{title}}</div>'
];
// Data for the processes to launch.
var processData = [
  {
    port: 10078,
    clusterMemberId: "alpha"
  },
  {
    port: 10079,
    clusterMemberId: "beta"
  }
];

// Obtain a test suit that launches Thywill instances in child processes.
var suite = tools.application.vowsSuite(suiteName, applicationName, pageMatches, processData);

// Test the functionality for sending notice of a drawn item and having
// the same data broadcast to the other client.
//
// Send fake data, since we're not actually processing the front end stuff.
var sendMessage = { segments: [] };
var responseMessage = { segments: [] };
tools.application.addSendAndAwaitResponseBatch("Draw line data message and response", suite, {
  applicationId: "draw",
  sendIndex: 0,
  responseIndex: 1,
  sendMessage: sendMessage,
  responseMessage: responseMessage
});

// Ensure that clients are closed and child processes are killed.
tools.application.closeVowsSuite(suite);

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
