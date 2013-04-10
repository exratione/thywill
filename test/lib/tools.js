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
var MemoryStore = require("socket.io/lib/stores/memory");
var RedisStore = require("socket.io/lib/stores/redis");
var RedisSessionStore = require("connect-redis")(express);
var Thywill = require("thywill");

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

  // ------------------------------------------------------------
  // Set up server.
  // ------------------------------------------------------------

  var port = config.thywill.ports[options.localClusterMemberId];

  // Are we using Express or not?
  if (config.clientInterface.implementation.name === "socketIoExpressClientInterface") {
    // Create servers.
    var app = express();
    config.clientInterface.server.app = app;
    var server = http.createServer(app).listen(port);
    config.clientInterface.server.server = server;
    // Create a session store.
    if (options.useRedis) {
      config.clientInterface.sessions.store = new RedisSessionStore({
        client: createRedisClient()
      });
    } else {
      config.clientInterface.sessions.store = new MemoryStore();
    }
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
  if (options.useRedis) {
    // Create a RedisStore for Socket.IO.
    config.clientInterface.socketConfig.global.store = new RedisStore({
      redisPub: createRedisClient(),
      redisSub: createRedisClient(),
      redisClient: createRedisClient()
    });
  } else {
    // Create a MemoryStore for Socket.IO.
    config.clientInterface.socketConfig.global.store = new MemoryStore();
  }

  // ------------------------------------------------------------
  // Set up cluster.
  // ------------------------------------------------------------

  config.cluster.localClusterMemberId = options.localClusterMemberId;
  if (config.cluster.implementation.name === "redisCluster") {
    config.cluster.communication.publishRedisClient = createRedisClient();
    config.cluster.communication.subscribeRedisClient = createRedisClient();
  }

  // ------------------------------------------------------------
  // Set up resourceManager.
  // ------------------------------------------------------------

  if (config.resourceManager.implementation.name === "redisResourceManager") {
    config.resourceManager.redisClient = createRedisClient();
  }

  // ------------------------------------------------------------
  // Set up channelManager.
  // ------------------------------------------------------------

  if (config.channelManager && config.channelManager.implementation.name === "redisChannelManager") {
    config.channelManager.redisClient = createRedisClient();
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
  suite.applications = options.applications || [];
  if (!Array.isArray(suite.applications)) {
    suite.applications = [suite.applications];
  }
  suite.thywillInstances = suite.thywillInstances || [];

  // Config should have only clonable things in it - no class instances, etc.
  var config = exports.setupConfig(options.config, options);

  suite.addBatch({
    "Launch Thywill": {
      topic: function () {
        Thywill.launch(config, options.applications, this.callback);
      },
      "successful launch": function (error, thywill) {
        assert.isNull(error);
        suite.thywillInstances.push(thywill);
        assert.isTrue(suite.thywillInstances[0] instanceof Thywill);
      }
    }
  });
};

/**
 * Create a work-already package client and connect it to one of the test
 * Thywill instances, which must be running one of the example applications.
 * This should be generic for all test applications.
 *
 * @param {Object} suite
 *   A Vows test suite instance.
 * @param {number} thywillInstanceIndex
 *   Which of the Thywill instances to point this client at.
 */
exports.addInitialWorkAlreadyClientBatches = function (suite, thywillInstanceIndex) {
  suite.addBatch({
    "Create work-already client": {
      topic: function () {
        var ports = suite.thywillInstances[thywillInstanceIndex].config.thywill.ports;
        var portName = (Object.keys(ports))[thywillInstanceIndex];
        return new Client({
          server: {
            host: "localhost",
            port: ports[portName],
            protocol: "http"
          },
          sockets: {
            defaultNamespace: suite.thywillInstances[thywillInstanceIndex].config.clientInterface.namespace
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
        var path = suite.thywillInstances[thywillInstanceIndex].config.clientInterface.baseClientPath + "/";
        suite.clients[thywillInstanceIndex].action(path, this.callback);
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
        suite.clients[thywillInstanceIndex].action({
          type: "socket",
          timeout: 250,
          socketConfig: suite.thywillInstances[thywillInstanceIndex].config.clientInterface.socketClientConfig
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
 *   useRedis: boolean
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
