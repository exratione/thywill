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

  // Test the RPC calls.
  var sendMessage, responseMessage;
  sendMessage = tools.createRpcMessage({
    name: "multiplicative.multiplyByTwo",
    hasCallback: false,
    args: [10]
  });
  responseMessage = tools.createRpcResponseMessage(sendMessage.getData().id, [null, 20]);
  tools.workAlready.addSendAndAwaitResponseBatch(
    "Test RPC: multiplicative.multiplyByTwo",
    suite, instanceIndex, applicationIndex, sendMessage, responseMessage
  );

  sendMessage = tools.createRpcMessage({
    name: "multiplicative.divideByTwo",
    hasCallback: true,
    args: [10]
  });
  responseMessage = tools.createRpcResponseMessage(sendMessage.getData().id, [null, 5]);
  tools.workAlready.addSendAndAwaitResponseBatch(
    "Test RPC: multiplicative.divideByTwo",
    suite, instanceIndex, applicationIndex, sendMessage, responseMessage
  );

  sendMessage = tools.createRpcMessage({
    name: "powers.square",
    hasCallback: false,
    args: [10]
  });
  responseMessage = tools.createRpcResponseMessage(sendMessage.getData().id, [null, 100]);
  tools.workAlready.addSendAndAwaitResponseBatch(
    "Test RPC: powers.square",
    suite, instanceIndex, applicationIndex, sendMessage, responseMessage
  );

  sendMessage = tools.createRpcMessage({
    name: "powers.squareRoot",
    hasCallback: true,
    args: [100]
  });
  responseMessage = tools.createRpcResponseMessage(sendMessage.getData().id, [null, 10]);
  tools.workAlready.addSendAndAwaitResponseBatch(
    "Test RPC: powers.squareRoot",
    suite, instanceIndex, applicationIndex, sendMessage, responseMessage
  );

  // Test some errors.
  var noFunctionError = suite.applications[applicationIndex].rpcErrors.NO_FUNCTION;

  sendMessage = tools.createRpcMessage({
    name: "not a function",
    hasCallback: true,
    args: [100]
  });
  responseMessage = tools.createRpcResponseMessage(sendMessage.getData().id, [noFunctionError]);
  tools.workAlready.addSendAndAwaitResponseBatch(
    "Test RPC: no function error",
    suite, instanceIndex, applicationIndex, sendMessage, responseMessage
  );

};
