/**
 * @fileOverview
 * Vows tests for the RedisCluster component.
 *
 * These are cluster tests using Express, Redis, and multiple Thywill
 * processes.
 */

var clone = require("clone");
var tools = require("../lib/tools");
var clusterConfig = require("./clusterTestThywillConfig");

var config = clone(clusterConfig);

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuiteForCluster("Cluster: cluster/redisCluster", {
  config: config,
  applications: null,
  useExpress: true,
  useRedis: true
});
tools.addBatches(suite, "redisCluster", "cluster");

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
