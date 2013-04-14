/**
 * @fileOverview
 * Vows tests for the InMemoryResourceManager component.
 *
 * These are base tests without Express, Redis, or other frills.
 */

var clone = require("clone");
var tools = require("../lib/tools");
var baseConfig = require("../config/baseTestThywillConfig");

var config = clone(baseConfig);
config.resourceManager = {
  implementation: {
    type: "core",
    name: "inMemoryResourceManager"
  }
};

// Obtain a test suit that launches Thywill.
var suite = tools.headless.singleInstanceVowsSuite("Base: resourceManager/inMemoryResourceManager", {
  config: config,
  useRedisSocketStore: false,
  useRedisSessionStore: false
});
tools.headless.addBatches(suite, "resourceManager", "general");

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
