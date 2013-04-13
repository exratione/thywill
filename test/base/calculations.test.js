/**
 * @fileOverview
 * Vows tests for the Calculations example application.
 *
 * These are base tests without Express, Redis, or other frills.
 */

var clone = require("clone");
var tools = require("../lib/tools");
var Calculations = require("../../applications/calculations/lib/calculations");
var baseConfig = require("../config/baseTestThywillConfig");

var config = clone(baseConfig);
// An example application should have its own base path and Socket.IO
// namespace.
config.clientInterface.baseClientPath = "/calculations";
config.clientInterface.namespace = "/calculations";
// Note that the client resource has no leading /. These must otherwise match.
config.clientInterface.socketClientConfig.resource = "calculations/socket.io";
config.clientInterface.socketConfig.global.resource = "/calculations/socket.io";
// Resource minification settings.
config.clientInterface.minifyCss = true;
config.clientInterface.minifyJavascript = true;
// Base paths to use when defining new resources for merged CSS and Javascript.
config.minifier.cssBaseClientPath = "/calculations/css";
config.minifier.jsBaseClientPath = "/calculations/js";

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuite("Base: Calculations application", {
  config: config,
  applications: new Calculations("calculationsId"),
  useRedisSocketStore: false,
  useRedisSessionStore: false
});
tools.addBatches(suite, "calculations", "general");

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
