/**
 * @fileOverview
 * Batches for testing the Draw example application.
 */

var assert = require("assert");
var Thywill = require("thywill");
var Message = Thywill.getBaseClass("Message");
var tools = require("./tools");

/**
 * Add general tests for the Draw application to the suite.
 */
exports.general = function (suite) {
  var instanceIndex = 0;
  var applicationIndex = 0;
  // The initial batches load the application page and then connect via
  // Socket.IO. The matches are checked against the page contents. Here
  // we're looking at the templates that should be included.
  var pageMatches = [
    '<div id="title">{{title}}</div>'
  ];
  tools.workAlready.addInitialBatches(suite, instanceIndex, pageMatches);

  // Unload the current page, disconnect the client.
  suite.addBatch({
    "Unload, disconnect": {
      topic: function () {
        suite.clients[instanceIndex].action({
          type: "unload"
        }, this.callback);
      },
      "unloaded": function (error) {
        assert.isUndefined(error);
      }
    }
  });
};

/**
 * Add cluster-specific tests for the Draw application to the suite.
 */
exports.cluster = function (suite) {
  // Create two clients, one for each cluster process.
  var applicationIndex = 0;
  // The initial batches load the application page and then connect via
  // Socket.IO. The matches are checked against the page contents. Here
  // we're looking at the templates that should be included.
  var instanceIndex = 0;
  var pageMatches = [
    '<div id="title">{{title}}</div>'
  ];
  tools.workAlready.addInitialBatches(suite, instanceIndex, pageMatches);
  instanceIndex = 1;
  tools.workAlready.addInitialBatches(suite, instanceIndex, pageMatches);

  // Test the functionality for sending notice of a drawn item and having
  // the same data broadcast to the other client.
  //
  // Send fake data, since we're not actually processing the front end stuff.
  var sendMessage = { segments: [] };
  var responseMessage = { segments: [] };
  tools.workAlready.addSendAndAwaitResponseBatch("Draw line data message and response", suite, {
    applicationIndex: applicationIndex,
    sendInstanceIndex: 0,
    responseInstanceIndex: 1,
    sendMessage: sendMessage,
    responseMessage: responseMessage
  });
};

