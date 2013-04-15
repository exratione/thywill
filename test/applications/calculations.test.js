/**
 * @fileOverview
 * Vows tests for the Calculations example application.
 *
 * These are base tests without Express, Redis, or other frills.
 */

var tools = require("../lib/tools");
var Thywill = require("thywill");
var RpcCapableApplication = Thywill.getBaseClass("RpcCapableApplication");

// Obtain a test suit that launches Thywill in a child process.
var suite = tools.application.vowsSuite("Application: Calculations", {
  applicationName: "calculations",
  // The initial batches load the application page and then connect via
  // Socket.IO. The matches are checked against the page contents. Here
  // we're looking at the templates that should be included.
  pageMatches: [
    '<div id="calculations-wrapper">'
  ],
  // Data for the processes to launch.
  processData: [
    {
      port: 10079,
      clusterMemberId: "alpha"
    }
  ],
  // Set a long timeout for actions, because things sometimes lag on a small
  // server when running a bunch of tests.
  defaultTimeout: 5000
});

// Test the RPC calls and errors.
var data = [
  {
    name: "multiplicative.multiplyByTwo",
    batchName: "Test RPC: multiplicative.multiplyByTwo",
    hasCallback: false,
    args: [10],
    responseArgs: [null, 20]
  },
  {
    name: "multiplicative.divideByTwo",
    batchName: "Test RPC: multiplicative.divideByTwo",
    hasCallback: true,
    args: [10],
    responseArgs: [null, 5]
  },
  {
    name: "powers.square",
    batchName: "Test RPC: powers.square",
    hasCallback: false,
    args: [10],
    responseArgs: [null, 100]
  },
  {
    name: "powers.squareRoot",
    batchName: "Test RPC: powers.squareRoot",
    hasCallback: true,
    args: [100],
    responseArgs: [null, 10]
  },
  {
    name: "not a function",
    batchName: "Test RPC: no function error",
    hasCallback: true,
    args: [100],
    responseArgs: [RpcCapableApplication.RPC_ERRORS.NO_FUNCTION]
  }
];

data.forEach(function (element, index, array) {
  var sendMessage = tools.createRpcMessage({
    name: element.name,
    hasCallback: element.hasCallback,
    args: element.args
  });
  var responseMessage = tools.createRpcResponseMessage(sendMessage.getData().id, element.responseArgs);
  tools.application.addSendAndAwaitResponsesBatch(element.batchName, suite, {
    applicationId: "calculations",
    actionIndex: 0,
    responseIndexes: 0,
    sendMessage: sendMessage,
    responseMessage: responseMessage
  });
});

// Ensure that clients are closed and child processes are killed.
tools.application.closeVowsSuite(suite);

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
