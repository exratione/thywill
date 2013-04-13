/**
 * @fileOverview
 * Various utility functions for testing Thywill.
 */

var http = require("http");
var vows = require("vows");
var assert = require("assert");
var clone = require("clone");
var express = require("express");
var redis = require("redis");
var Client = require("work-already").Client;
var MemorySocketStore = require("socket.io/lib/stores/memory");
var RedisSocketStore = require("socket.io/lib/stores/redis");
var RedisSessionStore = require("connect-redis")(express);
var MemorySessionStore = require("connect/lib/middleware/session/memory");
var Thywill = require("thywill");
var Message = Thywill.getBaseClass("Message");

/**
 * Utility function to create a client for a local Redis server.
 * @return {object}
 *   A Redis client.
 */
function createRedisClient () {
  var options = {};
  var client = redis.createClient(6379, "127.0.0.1", options);

  // This is fairly hacky, but needed to exercise the protection code. Create
  // a dummy Thywill instance, stick a dummy log into it, and run the protect
  // function on the client.
  var thywill = new Thywill();
  thywill.log = {
    debug: function (message) {
      console.log(message);
    },
    info: function (message) {
      console.log(message);
    },
    warn: function (message) {
      console.log(message);
    },
    error: function (message) {
      console.log(message);
    }
  };
  thywill.protectRedisClient(client);
  return client;
}

/**
 * Set up the config to start the Thywill server, based on the options provided.
 * The options object is the same as for createVowsTestSuite().
 *
 * @param {Object} baseConfig
 *   The base configuration object, lacking any class instances, etc.
 * @param {Object} options
 *   The various options.
 * @return {Object}
 *   A cloned configuration object.
 */
exports.setupConfig = function (baseConfig, options) {
  var config = clone(baseConfig);

  // Create some Redis clients, if needed.
  var redisClients;
  function setupRedisClients () {
    if (!redisClients) {
      redisClients = {
        pub: createRedisClient(),
        sub: createRedisClient(),
        other: createRedisClient()
      };
    }
  }

  // ------------------------------------------------------------
  // Set up server.
  // ------------------------------------------------------------

  var port = config.thywill.ports[options.localClusterMemberId];

  // If using Express, set it up.
  if (config.clientInterface.implementation.name === "socketIoExpressClientInterface") {
    // Create servers.
    var app = express();
    config.clientInterface.server.app = app;
    var server = http.createServer(app).listen(port);
    config.clientInterface.server.server = server;

    // Create a session store.
    if (options.useRedisSessionStore) {
      setupRedisClients();
      config.clientInterface.sessions.store = new RedisSessionStore({
        client: redisClients.other
      });
    } else {
      config.clientInterface.sessions.store = new MemorySessionStore();
    }

    // Add minimal configuration to the Express application: just the cookie and
    // session middleware.
    app.use(express.cookieParser(config.clientInterface.sessions.cookieSecret));
    app.use(express.session({
      cookie: {
        httpOnly: true
      },
      key: config.clientInterface.sessions.cookieKey,
      secret: config.clientInterface.sessions.cookieSecret,
      store: config.clientInterface.sessions.store
    }));

    // Middleware and routes might be added here or after Thywill launches. Either
    // way is just fine and won't interfere with Thywill's use of Express to serve
    // resources. e.g. adding a catch-all here is acceptable:
    app.all("*", function (req, res, next) {
      res.statusCode = 404;
      res.send("No such resource.");
    });
  }
  // Not using Express, so a vanilla http.Server with no session management is
  // set up.
  else {
    config.clientInterface.server.server = http.createServer().listen(port);
  }

  // ------------------------------------------------------------
  // Set up Socket.IO store.
  // ------------------------------------------------------------

  // Are we using Redis?
  if (options.useRedisSocketStore) {
    // Create a RedisStore for Socket.IO.
    setupRedisClients();
    config.clientInterface.socketConfig.global.store = new RedisSocketStore({
      redisPub: redisClients.pub,
      redisSub: redisClients.sub,
      redisClient: redisClients.other
    });
  } else {
    // Create a MemoryStore for Socket.IO.
    config.clientInterface.socketConfig.global.store = new MemorySocketStore();
  }

  // ------------------------------------------------------------
  // Set up cluster.
  // ------------------------------------------------------------

  config.cluster.localClusterMemberId = options.localClusterMemberId;
  if (config.cluster.implementation.name === "redisCluster") {
    setupRedisClients();
    config.cluster.communication.publishRedisClient = redisClients.pub;
    config.cluster.communication.subscribeRedisClient = redisClients.sub;
  }

  // ------------------------------------------------------------
  // Set up resourceManager.
  // ------------------------------------------------------------

  if (config.resourceManager.implementation.name === "redisResourceManager") {
    setupRedisClients();
    config.resourceManager.redisClient = redisClients.other;
  }

  // ------------------------------------------------------------
  // Set up channelManager.
  // ------------------------------------------------------------

  if (config.channelManager && config.channelManager.implementation.name === "redisChannelManager") {
    setupRedisClients();
    config.channelManager.redisClient = redisClients.other;
  }

  return config;
};

/**
 * Add a batch to a Vows suite that launches a Thywill instance. The options object is
 * the same as for createVowsTestSuite().
 *
 * @param {Object} suite
 *   A Vows test suite instance.
 * @param {Object} options
 *   The various options.
 */
exports.addThywillLaunchBatch = function (suite, options) {
  suite.thywills = suite.thywills || [];

  // Config should have only clonable things in it - no class instances, etc.
  var config = exports.setupConfig(options.config, options);

  suite.addBatch({
    "Launch Thywill": {
      topic: function () {
        Thywill.launch(config, options.applications, this.callback);
      },
      "successful launch": function (error, thywill) {
        assert.isNull(error);
        suite.thywills.push(thywill);
        assert.isTrue(suite.thywills[0] instanceof Thywill);
      }
    }
  });
};

/**
 * Create a partially formed Vows suite that launches a Thywill instance as
 * its first batch. The options object is as follows:
 *
 * {
 *   // Thywill configuration, without any of the class instances filled in.
 *   config: object
 *   // Optional applications.
 *   applications: Application|Application[]
 *   // Optionally name the local cluster member.
 *   localClusterMemberId: string
 *   // If true then Redis implementations are used.
 *   UseRedisSocketStore: boolean
 * }
 *
 * @param {string} name
 *   The test suite name.
 * @param {Object} options
 *   The various options.
 * @return {Object}
 *   A Vows suite with a batch added to launch a Thywill server.
 */
exports.createVowsSuite = function (name, options) {
  // Set up the test suite and return it.
  var suite = vows.describe(name);
  options.localClusterMemberId = options.localClusterMemberId || "alpha";
  exports.addThywillLaunchBatch(suite, options);
  return suite;
};

/**
 * Create a partially formed Vows suite that launches multiple Thywill
 * instances as the first batches. The options object the same as for
 * createVowsSuite().
 *
 * @param {string} name
 *   The test suite name.
 * @param {Object} options
 *   The various options.
 * @return {Object}
 *   A Vows suite with a batch added to launch a Thywill server.
 */
exports.createVowsSuiteForCluster = function (name, options) {
  // Set up the test suite and return it.
  var suite = vows.describe(name);

  var optionsAlpha = clone(options);
  optionsAlpha.localClusterMemberId = "alpha";
  exports.addThywillLaunchBatch(suite, optionsAlpha);

  var optionsBeta = clone(options);
  optionsBeta.localClusterMemberId = "beta";
  exports.addThywillLaunchBatch(suite, optionsBeta);

  return suite;
};

/**
 * Add batches to a test suite.
 *
 * @param {Object} suite
 *   A Vows test suite instance.
 * @param {String} name
 *   The name of the file in this directory containing the batch-adding
 *   functions, for use in a require() call.
 * @param {String} property
 *   The property that will contain the batch-adding function.
 */
exports.addBatches = function (suite, name, property) {
  var fn = require("./" + name)[property];
  fn(suite);
};

// ------------------------------------------------
// Related to the work-already package.
// ------------------------------------------------

exports.workAlready = {};

/**
 * Create a work-already package client and connect it to one of the test
 * Thywill instances, which must be running one of the example applications.
 *
 * This is generic for all test applications. It does the following:
 *
 * 1) Create a work-already client and attach it to the suite.
 * 2) Load the main page.
 * 3) Connect via Socket.IO.
 *
 * @param {Object} suite
 *   A Vows test suite instance.
 * @param {number} thywillInstanceIndex
 *   Which of the Thywill instances to point this client at.
 * @param {string|array} pageMatches
 *   Strings to match on in the main application page.
 */
exports.workAlready.addInitialBatches = function (suite, thywillInstanceIndex, pageMatches) {
  pageMatches = pageMatches || [];
  if (!Array.isArray(pageMatches)) {
    pageMatches = [pageMatches];
  }

  suite.addBatch({
    "Create work-already client": {
      topic: function () {
        var ports = suite.thywills[thywillInstanceIndex].config.thywill.ports;
        var portName = (Object.keys(ports))[thywillInstanceIndex];
        return new Client({
          server: {
            host: "localhost",
            port: ports[portName],
            protocol: "http"
          },
          sockets: {
            defaultNamespace: suite.thywills[thywillInstanceIndex].config.clientInterface.namespace,
            defaultTimeout: 1000
          }
        });
      },
      "client created": function (client) {
        suite.clients = suite.clients || [];
        suite.clients[thywillInstanceIndex] = client;
      }
    }
  });
  suite.addBatch({
    "Load application page": {
      topic: function () {
        var path = suite.thywills[thywillInstanceIndex].config.clientInterface.baseClientPath + "/";
        suite.clients[thywillInstanceIndex].action(path, this.callback);
      },
      "page fetched": function (error, page) {
        assert.isNull(error);
        assert.isObject(page);
        assert.strictEqual(page.statusCode, 200);
        assert.isString(page.body);
        pageMatches.forEach(function (pageMatch, index, array) {
          assert.include(page.body, pageMatch);
        });
      }
    }
  });
  suite.addBatch({
    "Connect via Socket.IO": {
      topic: function () {
        suite.clients[thywillInstanceIndex].action({
          type: "connect",
          socketConfig: suite.thywills[thywillInstanceIndex].config.clientInterface.socketClientConfig
        }, this.callback);
      },
      "socket connected": function (error) {
        var client = suite.clients[thywillInstanceIndex];
        assert.isUndefined(error);
        assert.isObject(client.page.sockets);
        assert.isObject(client.page.sockets[client.config.sockets.defaultNamespace]);
      }
    }
  });
};

/**
 * Send a message to the server, and wait for a response. Options has the form:
 *
 * {
 *   // Which application this involves.
 *   applicationIndex: number,
 *   // Which Thywill instance / client instance to use for sending.
 *   sendInstanceIndex: number,
 *   // Which Thywill instance / client instance expects the response
 *   responseInstanceIndex: number,
 *   // The Message instance or message data to send.
 *   sendMessage: object,
 *   // The Message instance or message data expected in the response.
 *   responseMessage: object
 * }
 *
 * @param {string} batchName
 *   Name of the batch.
 * @param {object} suite
 *   A Vows test suite instance.
 * @param {object} options
 *   The rest of the needed parameters.
 */
exports.workAlready.addSendAndAwaitResponseBatch = function (batchName, suite, options) {
  var batch = {};
  var definition = {
    topic: function () {
      suite.clients[options.responseInstanceIndex].action({
        type: "awaitEmit",
        eventType: "toClient"
      }, this.callback);

      var message = exports.wrapAsMessage(options.sendMessage);
      var applicationId = suite.thywills[options.sendInstanceIndex].applications[options.applicationIndex].id;
      suite.clients[options.sendInstanceIndex].action({
        type: "emit",
        args: ["fromClient", applicationId, message]
      }, function (error) {});
    },
    "expected response": function (error, socketEvent) {
      assert.isNull(error);
      assert.isObject(socketEvent);
      var args = [
        suite.thywills[options.sendInstanceIndex].applications[options.applicationIndex].id,
        exports.wrapAsMessage(options.responseMessage).toObject()
      ];
      assert.deepEqual(socketEvent.args, args);
    }
  };
  batch[batchName] = definition;
  suite.addBatch(batch);
};

// ------------------------------------------------
// Utilities.
// ------------------------------------------------

/**
 * For associating RPC messages and responses.
 */
exports.rpcMessageId = 0;

/**
 * Create an RPC Message instance. Data has the form:
 *
 * {
 *   // Name of the remote function.
 *   name: string
 *   // Does the remote function have a callback?
 *   cb: boolean
 *   // Arguments for the function, lacking the final callback.
 *   args: array
 * }
 *
 * @param {object} data
 *   Data for the message.
 * @return {Message}
 *   A Message instance.
 */
exports.createRpcMessage = function (data) {
  var rpcId = exports.rpcMessageId++;
  var sendData = {
    id: rpcId,
    name: data.name,
    cb: data.hasCallback,
    args: data.args
  };
  var message = new Message(sendData);
  message.setType(Message.TYPES.RPC);
  return message;
};

/**
 * Create a response message of the sort returned by an RPC call.
 *
 * @param {mixed} id
 *   Must match the ID of the sent RPC message.
 * @param {array} args
 *   Returned arguments as for a callback with leading null if successful.
 * @return {Message}
 *   A Message instance.
 */
exports.createRpcResponseMessage = function (id, args) {
  var message = new Message({
    id: id,
    cbArgs: args
  });
  message.setType(Message.TYPES.RPC);
  return message;
};

/**
 * Ensure message data is wrapped in a Message instance.
 *
 * @param {mixed|Message} message
 *   The message data.
 */
exports.wrapAsMessage = function (message) {
  if (!(message instanceof Message)) {
    message = new Message(message);
  }
  return message;
};
