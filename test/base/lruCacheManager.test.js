/**
 * @fileOverview
 * Vows tests for the LRUCacheManager component.
 *
 * These are base tests without Express, Redis, or other frills.
 */

var clone = require("clone");
var tools = require("../lib/tools");
var baseConfig = require("../config/baseTestThywillConfig");

var config = clone(baseConfig);
config.cacheManager = {
  implementation: {
    type: "core",
    name: "lruCacheManager"
  }
};

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuite("Base: cacheManager/lruCacheManager", {
  config: config,
  applications: null,
  useRedis: false
});
tools.addBatches(suite, "cacheManager", "general");

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
