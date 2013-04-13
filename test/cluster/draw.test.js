/**
 * @fileOverview
 * Vows tests for the Draw example application.
 *
 * These are base tests without Express, Redis, or other frills.
 */

var clone = require("clone");
var tools = require("../lib/tools");
var Draw = require("../../applications/draw/lib/draw");
var clusterConfig = require("../config/clusterTestThywillConfig");

var config = clone(clusterConfig);
// An example application should have its own base path and Socket.IO
// namespace.
config.clientInterface.baseClientPath = "/draw";
config.clientInterface.namespace = "/draw";
// Note that the client resource has no leading /. These must otherwise match.
config.clientInterface.socketClientConfig.resource = "draw/socket.io";
config.clientInterface.socketConfig.global.resource = "/draw/socket.io";
// Resource minification settings.
config.clientInterface.minifyCss = true;
config.clientInterface.minifyJavascript = true;
// Base paths to use when defining new resources for merged CSS and Javascript.
config.minifier.cssBaseClientPath = "/draw/css";
config.minifier.jsBaseClientPath = "/draw/js";

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuiteForCluster("Cluster: Draw application", {
  config: config,
  applications: new Draw("drawId"),
  useRedisSocketStore: true,
  useRedisSessionStore: true
});
tools.addBatches(suite, "draw", "general");
//tools.addBatches(suite, "draw", "cluster");

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
