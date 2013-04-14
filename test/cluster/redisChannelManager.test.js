/**
 * @fileOverview
 * Vows tests for the RedisChannelManager component.
 *
 * These are cluster tests using Express, Redis, and multiple Thywill
 * processes.
 */

var clone = require("clone");
var tools = require("../lib/tools");
var clusterConfig = require("../config/clusterTestThywillConfig");

var config = clone(clusterConfig);

config.channelManager = {
  implementation: {
    type: "extra",
    name: "redisChannelManager"
  },
  redisPrefix: "test:thywill:channel:",
  redisClient: null
};
// A RedisChannelManager requires that a ClientTracker component also be used.
config.clientTracker = {
  implementation: {
    type: "extra",
    name: "inMemoryClientTracker"
  }
};

// Obtain a test suit that launches Thywill.
var suite = tools.headless.clusterVowsSuite("Cluster: channelManager/redisChannelManager", {
  config: config,
  useRedisSocketStore: true,
  useRedisSessionStore: true
});
tools.headless.addBatches(suite, "channelManager", "general");
tools.headless.addBatches(suite, "channelManager", "cluster");

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
