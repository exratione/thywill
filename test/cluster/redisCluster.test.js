/**
 * @fileOverview
 * Vows tests for the RedisCluster component.
 *
 * These are cluster tests using Express, Redis, and multiple Thywill
 * processes.
 */

var clone = require('clone');
var tools = require('../lib/tools');
var clusterConfig = require('../config/clusterTestThywillConfig');

var config = clone(clusterConfig);

// Obtain a test suit that launches Thywill.
var suite = tools.headless.clusterVowsSuite('Cluster: cluster/redisCluster', {
  config: config,
  useRedisSocketStore: true,
  useRedisSessionStore: true
});
tools.headless.addBatches(suite, 'cluster', 'cluster');

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
