/**
 * @fileOverview
 * A base configuration for testing Thywill in a clustered setup with
 * multiple processes running.
 *
 * This uses Redis-based implementations, and thus requires a local Redis
 * server to be in place.
 */

var config = require("../../serverConfig/thywill/baseThywillConfig");

// The ports for cluster members to listen on.
config.thywill.ports = {
  alpha: 10078,
  beta: 10079
};

// The cluster implementation is backed by Redis.
config.cluster = {
  implementation: {
    type: "core",
    name: "redisCluster"
  },
  // The cluster has two members.
  clusterMemberIds: ["alpha", "beta"],
  communication: {
    publishRedisClient: undefined,
    subscribeRedisClient: undefined
  },
  heartbeat: {
    interval: 200,
    timeout: 500
  },
  // Undefined values will be set in the start script.
  localClusterMemberId: undefined,
  redisPrefix: "test:thywill:cluster:"
};

// Set the http.Server instance and Express in the start script, not here.
config.clientInterface.server.app = null;
config.clientInterface.server.server = null;
// Set the Socket.IO store instance in the start script as well.
config.clientInterface.socketConfig.global.store = null;

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
  redisPrefix: "test:thywill:resource:",
  // This will be set in the start script.
  redisClient: undefined
};

//-----------------------------------------------------------
// Exports - Configuration
//-----------------------------------------------------------

module.exports = config;
