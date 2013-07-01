/**
 * @fileOverview
 * Vows tests for the LruCacheManager component.
 *
 * These are cluster tests using Express, Redis, and multiple Thywill
 * processes.
 */

var clone = require('clone');
var tools = require('../lib/tools');
var clusterConfig = require('../config/clusterTestThywillConfig');

var config = clone(clusterConfig);
config.cacheManager = {
  implementation: {
    type: 'core',
    name: 'lruCacheManager'
  }
};

// Obtain a test suit that launches Thywill.
var suite = tools.headless.singleInstanceVowsSuite('Cluster: cacheManager/lruCacheManager', {
  config: config,
  useRedisSocketStore: false,
  useRedisSessionStore: false
});
tools.headless.addBatches(suite, 'cacheManager', 'general');
tools.headless.addBatches(suite, 'lruCacheManager', 'cluster');

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
