/**
 * @fileOverview
 * Vows tests for the Echo example application.
 *
 * These are base tests without Express, Redis, or other frills.
 */

var clone = require("clone");
var tools = require("../lib/tools");
var Echo = require("../../applications/echo/lib/echo");
var baseConfig = require("../config/baseTestThywillConfig");

var config = clone(baseConfig);
// An example application should have its own base path and Socket.IO
// namespace.
config.clientInterface.baseClientPath = "/echo";
config.clientInterface.namespace = "/echo";
// Note that the client resource has no leading /. These must otherwise match.
config.clientInterface.socketClientConfig.resource = "echo/socket.io";
config.clientInterface.socketConfig.global.resource = "/echo/socket.io";
// Resource minification settings.
config.clientInterface.minifyCss = true;
config.clientInterface.minifyJavascript = true;
// Base paths to use when defining new resources for merged CSS and Javascript.
config.minifier.cssBaseClientPath = "/echo/css";
config.minifier.jsBaseClientPath = "/echo/js";

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuite("Base: Echo application", {
  config: config,
  applications: new Echo("echoId"),
  useRedis: false
});
tools.addBatches(suite, "echo", "general");

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
