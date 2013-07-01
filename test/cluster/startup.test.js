/**
 * @fileOverview
 * Vows tests for starting up and shutting down clustered Thywill
 * processes that use Redis, Express, and sessions.
 */

var clone = require('clone');
var tools = require('../lib/tools');
var clusterConfig = require('../config/clusterTestThywillConfig');

var config = clone(clusterConfig);

// Obtain a test suit that launches Thywill.
var suite = tools.headless.clusterVowsSuite('Cluster: Startup Thywill', {
  config: config,
  useRedisSocketStore: true,
  useRedisSessionStore: true
});

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
