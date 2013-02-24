/**
 * @fileOverview
 * A core configuration file for Thywill. See the base configuration for
 * documentation of all of the various options. The parameters set here
 * are a fraction of those available.
 */

var config = require("../../../serverConfig/thywill/baseThywillConfig");

// An example application should have its own base path and Socket.IO
// namespace.
config.clientInterface.baseClientPath = "/draw";

// The cluster implementation is backed by Redis.
config.cluster = {
  implementation: {
    type: "core",
    name: "redisCluster"
  },
  // The cluster has four members.
  clusterMemberIds: ["alpha", "beta", "gamma", "delta"],
  // Undefined values will be set in the start script.
  localClusterMemberId: undefined,
  redisPrefix: "thywill:draw:cluster:",
  publishRedisClient: undefined,
  subscribeRedisClient: undefined
};

config.clientInterface.namespace = "/draw";
// Note that the client resource has no leading /. These must otherwise match.
config.clientInterface.socketClientConfig.resource = "draw/socket.io";
config.clientInterface.socketConfig.global.resource = "/draw/socket.io";
// Resource minification settings.
config.clientInterface.minifyCss = true;
config.clientInterface.minifyJavascript = false;

// Set the http.Server instance in the start script, not here.
config.clientInterface.server.server = null;

// Set an appropriate log level for an example application.
config.log.level = "debug";

// Base paths to use when defining new resources for merged CSS and Javascript.
config.minifier.cssBaseClientPath = "/draw/css";
config.minifier.jsBaseClientPath = "/draw/js";

// Use a Redis-backed ResourceManager to allow resources to be shared between
// cluster members - not that this is important for this particular example
// application, but it will be for most clustered applications.
config.resourceManager = {
  // Here we specify a very trivial resource manager implementation that
  // does little more than keep track of resources in memory.
  implementation: {
    type: "core",
    name: "redisResourceManager"
  },
  cacheSize: 100,
  redisPrefix: "thywill:draw:resource:",
  // This will be set in the start script.
  redisClient: undefined
},

//-----------------------------------------------------------
// Exports - Configuration
//-----------------------------------------------------------

module.exports = config;
