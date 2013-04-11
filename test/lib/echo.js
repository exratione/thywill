/**
 * @fileOverview
 * Batches for testing the Echo example application.
 */

var assert = require("assert");
var Thywill = require("thywill");
var Message = Thywill.getBaseClass("Message");
var tools = require("./tools");

/**
 * Add general tests for the Echo application to the suite.
 */
exports.general = function (suite) {
  var instanceIndex = 0;
  var applicationIndex = 0;
  // The initial batches load the application page and then connect via
  // Socket.IO. The matches are checked against the page contents. Here
  // we're looking at the templates that should be included.
  var pageMatches = [
    "<button>{{buttonText}}</button>",
    '<div class="echoed-message">{{data}}</div>'
  ];
  tools.workAlready.addInitialBatches(suite, instanceIndex, pageMatches);

  // A check to see if sending works.
  suite.addBatch({
    "Send message without waiting on response": {
      topic: function () {
        var message = new Message("pre-test");
        suite.clients[instanceIndex].action({
          type: "emit",
          args: ["fromClient", suite.applications[applicationIndex].id, message]
        }, this.callback);
      },
      "message sent": function (error) {
        assert.isUndefined(error);
      }
    }
  });
  // A delay to be sure that the Echo response to the last message is
  // done with before testing for the next one.
  suite.addBatch({
    "Delay": {
      topic: function () {
        setTimeout(this.callback, 200);
      },
      "delayed": function () {}
    }
  });

  // Test the echoing functionality.
  var sendMessage = "test";
  var responseMessage = "test";
  tools.workAlready.addSendAndAwaitResponseBatch(
    "Echo message and response",
    suite, instanceIndex, applicationIndex, sendMessage, responseMessage
  );
};
