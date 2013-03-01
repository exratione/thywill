/**
 * @fileOverview
 * Vows tests for starting up and shutting down a Thywill process with no
 * applications.
 *
 * These are base tests without Express, Redis, or other frills.
 */

var clone = require("clone");
var tools = require("../lib/tools");
var baseConfig = require("./baseTestThywillConfig");

var config = clone(baseConfig);

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuite("Base: Startup Thywill", {
  config: baseConfig,
  applications: null,
  useExpress: false,
  useRedis: false
});

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;