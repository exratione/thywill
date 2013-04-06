/**
 * @fileOverview
 * Vows tests for starting up and shutting down clustered Thywill
 * processes that use Redis, Express, and sessions.
 */

var clone = require("clone");
var tools = require("../lib/tools");
var clusterConfig = require("../config/clusterTestThywillConfig");

var config = clone(clusterConfig);

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuiteForCluster("Cluster: Startup Thywill", {
  config: config,
  applications: null,
  useRedis: true
});

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
