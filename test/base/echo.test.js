/**
 * @fileOverview
 * Vows tests for the Echo example application.
 *
 * These are base tests without Express, Redis, or other frills.
 */

var tools = require("../lib/tools");

var suiteName = "Base: Echo application";
var applicationName = "echo";
// The initial batches load the application page and then connect via
// Socket.IO. The matches are checked against the page contents. Here
// we're looking at the templates that should be included.
var pageMatches = [
  "<button>{{buttonText}}</button>",
  '<div class="echoed-message">{{data}}</div>'
];
// Data for the process to launch.
var processData = [
  {
    port: 10079,
    clusterMemberId: "alpha"
  }
];

// Obtain a test suit that launches Thywill in a child process.
var suite = tools.application.vowsSuite(suiteName, applicationName, pageMatches, processData);

// Test the echoing functionality.
tools.application.addSendAndAwaitResponseBatch("Echo message and response", suite, {
  applicationId: "echo",
  sendIndex: 0,
  responseIndex: 0,
  sendMessage: "test",
  responseMessage: "test"
});

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
