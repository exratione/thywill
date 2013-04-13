/**
 * @fileOverview
 * Vows tests for the RedisResourceManager component.
 *
 * These are cluster tests using Express, Redis, and multiple Thywill
 * processes.
 */

var clone = require("clone");
var tools = require("../lib/tools");
var clusterConfig = require("../config/clusterTestThywillConfig");

var config = clone(clusterConfig);

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuiteForCluster("Cluster: resourceManager/redisResourceManager", {
  config: config,
  applications: null,
  useRedisSocketStore: true,
  useRedisSessionStore: true
});
tools.addBatches(suite, "resourceManager", "general");
tools.addBatches(suite, "redisResourceManager", "cluster");

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
