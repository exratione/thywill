/**
 * @fileOverview
 * Vows tests for the Display example application.
 *
 * These are cluster tests using Express, Redis, and multiple Thywill
 * processes.
 */

var assert = require("assert");
var tools = require("../lib/tools");

// Obtain a test suit that launches Thywill instances in child processes,
// but where the Socket.IO clients haven't connected yet.
var suite = tools.application.vowsSuitePendingConnections("Application: Display", {
  applicationName: "display",
  // The initial batches load the application page and then connect via
  // Socket.IO. The matches are checked against the page contents. Here
  // we're looking at the templates that should be included.
  pageMatches: [
    '<li id="{{connectionId}}">{{connectionId}}</li>',
    '<span class="text">{{text}}</span>',
    '<div id="{{id}}" class="cluster-member">'
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

// For keeping track of the connections.
suite.connectionIds = [];

// Delay to let the cluster implementation finish up passing stuff around
// due to new processes being launched.
tools.addDelayBatch(suite, 1000);

// Connect and check the first two immediate responses.
suite.addBatch({
  "Connect to alpha and catch connectionList and connection responses": {
    topic: function () {
      var self = this;
      var socketEvents = [];

      suite.clients[0].action({
        type: "connectAndAwaitEmit",
        eventType: "toClient",
        socketConfig: {
          "resource": "display/socket.io"
        }
      }, function (error, socketEvent) {
        socketEvents.push(socketEvent);
        if (error) {
          self.callback(error, socketEvents);
        } else {
          suite.clients[0].action({
            type: "awaitEmit",
            eventType: "toClient"
          }, function (error, socketEvent) {
            socketEvents.push(socketEvent);
            self.callback(error, socketEvents);
          });
        }
      });
    },
    "expected responses on connect": function (error, socketEvents) {
      assert.isNull(error);

      // Check the first event: should be the connection list.
      var connectionListEvent = socketEvents[0];
      assert.strictEqual(connectionListEvent.args[0], "display");
      var data = connectionListEvent.args[1].data;
      assert.strictEqual(data.type, "connectionList");
      assert.isArray(data.connections.alpha);
      assert.isArray(data.connections.beta);
      assert.isString(data.connections.alpha[0]);
      // We should have the connectionId now.
      suite.connectionIds[0] = data.connections.alpha[0];

      // Check the second event: should be a connection event.
      var connectionEvent = socketEvents[1];
      assert.deepEqual(connectionEvent.args[1].data, {
        type: "connection",
        connectionId: suite.connectionIds[0],
        clusterMemberId: "alpha"
      });
    }
  }
});

// Delay to let the other messages/traffic go by.
tools.addDelayBatch(suite, 1000);

var batchName = "Connect to beta and see connection notice in alpha";
tools.application.addConnectAndAwaitResponsesBatch(batchName, suite, {
  applicationId: "display",
  actionIndex: 1,
  responseIndexes: 0,
  vows: {
    "expected response on connect": function (unusedError, results) {
      assert.isNull(results[0].error);
      var socketEvent = results[0].socketEvent;
      assert.strictEqual(socketEvent.args[0], "display");
      var data = socketEvent.args[1].data;
      assert.strictEqual(data.type, "connection");
      assert.typeOf(data.connectionId, "string");
      assert.strictEqual(data.clusterMemberId, "beta");
      // We should have the connectionId now.
      suite.connectionIds[1] = data.connectionId;
    }
  }
});

// Delay to let the rest of the responses for the beta connection go past.
tools.addDelayBatch(suite, 1000);

// Disconnect alpha connection and see that the disconnection notice shows up
// at the beta connection.
batchName = "Disconnect from alpha and see disconnection notice in beta";
tools.application.addDisconnectAndAwaitResponsesBatch(batchName, suite, {
  applicationId: "chat",
  actionIndex: 0,
  responseIndexes: 1,
  vows: {
    "expected response on disconnect": function (unusedError, results) {
      assert.isNull(results[1].error);
      assert.deepEqual(results[1].socketEvent.args[1].data, {
        type: "disconnection",
        connectionId: suite.connectionIds[0],
        clusterMemberId: "alpha"
      });
    }
  }
});


//
// TODO: detection and checking of shutdown/launch-related messages sent to the
// client.
//


// Ensure that clients are closed and child processes are killed.
tools.application.closeVowsSuite(suite);

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
