/**
 * @fileOverview
 * Vows tests for the HandlebarsTemplateEngine component.
 *
 * These are base tests without Express, Redis, or other frills.
 */

var clone = require("clone");
var tools = require("../lib/tools");
var baseConfig = require("./baseTestThywillConfig");

var config = clone(baseConfig);
config.templateEngine = {
  implementation: {
    type: "core",
    name: "handlebarsTemplateEngine"
  },
  templateCacheLength: 100
};

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuite("Base: templateEngine/handlebarsTemplateEngine", {
  config: config,
  applications: null,
  useExpress: false,
  useRedis: false
});
tools.addBatches(suite, "handlebarsTemplateEngine", "general");

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
