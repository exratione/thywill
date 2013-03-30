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

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuiteForCluster("Cluster: channelManager/redisChannelManager", {
  config: config,
  applications: null,
  useExpress: true,
  useRedis: true
});
tools.addBatches(suite, "channelManager", "general");
tools.addBatches(suite, "channelManager", "cluster");

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
