/**
 * @fileOverview
 * Vows tests for the EJSTemplateEngine component.
 */

var clone = require("clone");
var tools = require("./tools");
var baseConfig = require("./tools/baseTestThywillConfig");

var config = clone(baseConfig);
config.templateEngine = {
  implementation: {
    type: "core",
    name: "ejsTemplateEngine"
  }
};

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuite("templateEngine/ejsTemplateEngine", {
  config: config,
  applications: null,
  useExpress: false,
  useRedis: false
});
tools.addBatches(suite, "ejsTemplateEngine", "general");

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
