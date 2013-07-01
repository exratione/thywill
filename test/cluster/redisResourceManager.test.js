/**
 * @fileOverview
 * Vows tests for the RedisResourceManager component.
 *
 * These are cluster tests using Express, Redis, and multiple Thywill
 * processes.
 */

var clone = require('clone');
var tools = require('../lib/tools');
var clusterConfig = require('../config/clusterTestThywillConfig');

var config = clone(clusterConfig);

// Obtain a test suit that launches Thywill.
var suite = tools.headless.clusterVowsSuite('Cluster: resourceManager/redisResourceManager', {
  config: config,
  useRedisSocketStore: true,
  useRedisSessionStore: true
});
tools.headless.addBatches(suite, 'resourceManager', 'general');
tools.headless.addBatches(suite, 'redisResourceManager', 'cluster');

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
