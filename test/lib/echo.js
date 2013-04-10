/**
 * @fileOverview
 * Batches for testing the Echo example application.
 */

var assert = require("assert");
var Client = require("work-already").Client;
var Thywill = require("thywill");
var Message = Thywill.getBaseClass("Message");

/**
 * Add general tests for the Echo application to the suite.
 */
exports.general = function (suite) {
  // The work-already client instance has to be created in a batch because the
  // Thywill instance won't exist prior to that point.
  suite.addBatch({
    "Create work-already client": {
      topic: function () {
        return new Client({
          server: {
            host: "localhost",
            port: suite.thywillInstances[0].config.thywill.ports.alpha,
            protocol: "http"
          },
          sockets: {
            defaultNamespace: suite.thywillInstances[0].config.clientInterface.namespace
          }
        });
      },
      "client created": function (client) {
        suite.client = client;
      }
    }
  });
  suite.addBatch({
    "Load application page": {
      topic: function () {
        suite.client.action("/echo/", this.callback);
      },
      "page fetched": function (error, page) {
        assert.isNull(error);
        assert.isObject(page);
        assert.strictEqual(page.statusCode, 200);
        assert.include(page.body, "<button>{{buttonText}}</button>");
      }
    }
  });
  suite.addBatch({
    "Connect via Socket.IO": {
      topic: function () {
        suite.client.action({
          type: "socket",
          timeout: 250,
          socketConfig: suite.thywillInstances[0].config.clientInterface.socketClientConfig
        }, this.callback);
      },
      "socket connected": function (error) {
        assert.isUndefined(error);
        assert.isObject(suite.client.page.sockets);
        assert.isObject(suite.client.page.sockets[suite.client.config.sockets.defaultNamespace]);
      }
    }
  });
  suite.addBatch({
    "Send message without waiting on response": {
      topic: function () {
        var message = new Message("pre-test");
        suite.client.action({
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
  // done with.
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
        suite.client.action({
          type: "awaitEmit",
          eventType: "toClient",
          timeout: 1000
        }, this.callback);

        suite.message = new Message("test");
        suite.client.action({
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
