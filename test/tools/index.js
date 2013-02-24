/**
 * @fileOverview
 * Various utility functions for testing Thywill.
 */

var vows = require("vows");
var assert = require("assert");
var clone = require("clone");
var http = require("http");
var redis = require("redis");
var MemoryStore = require("socket.io/lib/stores/memory");
var RedisStore = require("socket.io/lib/stores/redis");
var Thywill = require("thywill");

/**
 * Utility function to create a client for a local Redis server.
 * @return {object}
 *   A Redis client.
 */
function createRedisClient () {
  var options = {};
  return redis.createClient(6379, "127.0.0.1", options);
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

  // Are we using Express or not?
  if (options.useExpress) {

  } else {
    config.clientInterface.server.server = http.createServer().listen(config.thywill.port);
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
  if (!options.applications) {
    options.applications = [];
  }
  if (!suite.thywillInstances) {
    suite.thywillInstances = [];
  }

  var batchName;
  if (options.useExpress) {
    batchName = "launch Thywill with Express";
  } else {
    batchName = "launch Thywill with http.Server";
  }

  // Config should have only clonable things in it - no class instances, etc.
  var config = exports.setupConfig(options.config, options);

  var batch = {};
  var batchDefinition = {
    topic: function () {
      Thywill.launch(config, options.applications, this.callback);
    },
    "successful launch": function (error, thywill) {
      assert.isNull(error);
      suite.thywillInstances.push(thywill);
      assert.isTrue(suite.thywillInstances[0] instanceof Thywill);
    }
  };

  batch[batchName] = batchDefinition;
  suite.addBatch(batch);
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
 *   // If true use Express rather than a plain http.Server instance.
 *   useExpress: boolean
 *   // If using Redis where possible for Socket.IO and Express.
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
  exports.addThywillLaunchBatch(suite, options);
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
