/**
 * @fileOverview
 * Vows tests for the HandlebarsTemplateEngine component.
 *
 * These are base tests without Express, Redis, or other frills.
 */

var clone = require("clone");
var tools = require("../lib/tools");
var baseConfig = require("../config/baseTestThywillConfig");

var config = clone(baseConfig);
config.templateEngine = {
  implementation: {
    type: "core",
    name: "handlebarsTemplateEngine"
  },
  templateCacheLength: 100
};

// Obtain a test suit that launches Thywill.
var suite = tools.headless.singleInstanceVowsSuite("Base: templateEngine/handlebarsTemplateEngine", {
  config: config,
  useRedisSocketStore: false,
  useRedisSessionStore: false
});
tools.headless.addBatches(suite, "handlebarsTemplateEngine", "general");

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
