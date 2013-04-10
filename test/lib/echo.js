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
  tools.addInitialWorkAlreadyClientBatches(suite, 0);

  suite.addBatch({
    "Send message without waiting on response": {
      topic: function () {
        var message = new Message("pre-test");
        suite.clients[0].action({
          type: "emit",
          args: ["fromClient", suite.applications[0].id, message]
        }, this.callback);
      },
      "message sent": function (error) {
        assert.isUndefined(error);
      }
    }
  });
  // Just a delay to be sure that the Echo response to the last message is
  // done with before waiting for the next one.
  suite.addBatch({
    "Delay": {
      topic: function () {
        setTimeout(this.callback, 200);
      },
      "delayed": function () {}
    }
  });
  suite.addBatch({
    "Send message and await echoed response": {
      topic: function () {
        suite.clients[0].action({
          type: "awaitEmit",
          eventType: "toClient",
          timeout: 1000
        }, this.callback);

        suite.message = new Message("test");
        suite.clients[0].action({
          type: "emit",
          args: ["fromClient", suite.applications[0].id, suite.message]
        }, function (error) {});
      },
      "message echoed correctly": function (error, socketEvent) {
        assert.isNull(error);
        assert.isObject(socketEvent);
        assert.deepEqual(socketEvent.args, [suite.applications[0].id, { data: suite.message.data, _: suite.message._ }]);
      }
    }
  });
};
