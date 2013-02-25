/**
 * @fileOverview
 * Vows tests for starting up and shutting down clustered Thywill
 * processes that use Redis, Express, and sessions.
 */

var tools = require("../lib/tools");
var clusterConfig = require("./clusterTestThywillConfig");

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuiteForCluster("Startup Thywill", {
  config: clusterConfig,
  applications: null,
  useExpress: true,
  useRedis: true
});

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
