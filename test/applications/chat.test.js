/**
 * @fileOverview
 * Vows tests for the Chat example application.
 *
 * These are cluster tests using Express, Redis, and multiple Thywill
 * processes.
 */

var assert = require("assert");
var tools = require("../lib/tools");

// Obtain a test suit that launches Thywill instances in child processes,
// but where the Socket.IO clients haven't connected yet.
var suite = tools.application.vowsSuitePendingConnections("Application: Chat", {
  applicationName: "chat",
  // The initial batches load the application page and then connect via
  // Socket.IO. The matches are checked against the page contents. Here
  // we're looking at the templates that should be included.
  pageMatches: [
    '<span class="channel">{{channelId}}</span>',
    '<div class="chat-message disconnect-message">Chat partner disconnected.</div>',
    '<div class="chat-message">{{data}}</div>',
    '<div class="chat-message reconnect-message">Chat partner reconnected.</div>',
    '<div id="waiting" class="notice">{{waitingText}}</div>'
  ],
  // Data for the processes to launch.
  processData: [
    {
      port: 10078,
      clusterMemberId: "alpha"
    },
    {
      port: 10079,
      clusterMemberId: "beta"
    }
  ],
  // Set a long timeout for actions, because things sometimes lag on a small
  // server when running a bunch of tests.
  defaultTimeout: 5000
});

// Make the Socket.IO connection to alpha.
suite.addBatch({
  "Make Socket.IO connection to alpha": {
    topic: function () {
      suite.clients[0].action({
        type: "connect",
        socketConfig: {
          "resource": "chat/socket.io"
        }
      }, this.callback);
    },
    "successfully connected": function (error) {
      assert.isUndefined(error);
    }
  }
});

// Delay to allow that to complete recording the user, setting data in Redis.
tools.addDelayBatch(suite, 100);

// Connect to beta and wait on the messages confirming a chat being set up
// that are sent to both alpha and beta connections. The response messages
// have a channelId in them based on connection Ids, so have to use a
// custom vow function to check the results.
var batchName = "Make Socket.IO connection to beta, catch chat setup messages to alpha and beta";
tools.application.addConnectAndAwaitResponsesBatch(batchName, suite, {
  applicationId: "chat",
  actionIndex: 1,
  responseIndexes: [0, 1],
  vows: {
    "expected responses on connect": function (unusedError, results) {
      assert.isNull(results[0].error);
      assert.isNull(results[1].error);
      // Check the one to see if the contents are expected.
      assert.strictEqual(results[0].socketEvent.args[0], "chat");
      var data = results[0].socketEvent.args[1].data;
      assert.strictEqual(data.action, "startChat");
      // The two messages are published to the room, so they should be the same.
      assert.deepEqual(results[0].socketEvent, results[1].socketEvent);
    }
  }
});

// Send a message, see it returned to both clients.
batchName = "Send chat message from alpha";
var sendMessage = {
  action: "message",
  message: "test"
};
var responseMessage = sendMessage;
tools.application.addSendAndAwaitResponsesBatch(batchName, suite, {
  applicationId: "chat",
  actionIndex: 0,
  responseIndexes: [0, 1],
  sendMessage: sendMessage,
  responseMessage: responseMessage
});

// Disconnect beta, see disconnection message show up at alpha.
batchName = "Disconnect beta, check disconnect notice for alpha";
tools.application.addDisconnectAndAwaitResponsesBatch(batchName, suite, {
  applicationId: "chat",
  actionIndex: 1,
  responseIndexes: 0,
  responseMessage: {
    action: "disconnected"
  }
});

// Reload page for page, as that needs to happen prior to reconnecting.
suite.addBatch({
  "Reload application page for beta": {
    topic: function () {
      suite.clients[1].action("/chat/", this.callback);
    },
    "page fetched": function (error, page) {
      assert.isNull(error);
      assert.isObject(page);
      assert.strictEqual(page.statusCode, 200);
    }
  }
});

// Reconnect beta, see reconnection message show up at alpha.
batchName = "Connect beta, check connect notice for alpha";
tools.application.addConnectAndAwaitResponsesBatch(batchName, suite, {
  applicationId: "chat",
  actionIndex: 1,
  responseIndexes: 0,
  responseMessage: {
    action: "reconnected"
  }
});

// TODO: kick, then search for partner


// Ensure that clients are closed and child processes are killed.
tools.application.closeVowsSuite(suite);

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
