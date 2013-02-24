/**
 * @fileOverview
 * Vows tests for starting up and shutting down a Thywill process with no
 * applications.
 */

var tools = require("./tools");
var baseConfig = require("./tools/baseTestThywillConfig");

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuite("Startup Thywill", {
  config: baseConfig,
  applications: null,
  useExpress: false,
  useRedis: false
});

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
