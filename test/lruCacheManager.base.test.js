/**
 * @fileOverview
 * Vows tests for the LRUCacheManager component.
 */

var clone = require("clone");
var tools = require("./tools");
var baseConfig = require("./tools/baseTestThywillConfig");

var config = clone(baseConfig);
config.cacheManager = {
  implementation: {
    type: "core",
    name: "lruCacheManager"
  }
};

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuite("cacheManager/lruCacheManager", {
  config: config,
  applications: null,
  useExpress: false,
  useRedis: false
});
tools.addBatches(suite, "lruCacheManager", "general");

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
