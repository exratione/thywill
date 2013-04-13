/**
 * @fileOverview
 * Batches for testing the Calculations example application.
 */

var assert = require("assert");
var Thywill = require("thywill");
var Message = Thywill.getBaseClass("Message");
var tools = require("./tools");

/**
 * Add general tests for the Calculations application to the suite.
 */
exports.general = function (suite) {
  var instanceIndex = 0;
  var applicationIndex = 0;
  // The initial batches load the application page and then connect via
  // Socket.IO. The matches are checked against the page contents. Here
  // we're looking at the templates that should be included.
  var pageMatches = [
    '<div id="calculations-wrapper">'
  ];
  tools.workAlready.addInitialBatches(suite, instanceIndex, pageMatches);

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
      responseArgs: [suite.applications[applicationIndex].rpcErrors.NO_FUNCTION]
    }
  ];

  data.forEach(function (element, index, array) {
    var sendMessage = tools.createRpcMessage({
      name: element.name,
      hasCallback: element.hasCallback,
      args: element.args
    });
    var responseMessage = tools.createRpcResponseMessage(sendMessage.getData().id, element.responseArgs);
    tools.workAlready.addSendAndAwaitResponseBatch(element.batchName, suite, {
      applicationIndex: applicationIndex,
      sendInstanceIndex: instanceIndex,
      responseInstanceIndex: instanceIndex,
      sendMessage: sendMessage,
      responseMessage: responseMessage
    });
  });
};
