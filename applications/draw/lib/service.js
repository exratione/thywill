/**
 * @fileOverview
 * Exports functions to start up or prepare to shut down one of the cluster
 * members running the Draw application.
 */

var express = require("express");
var RedisSessionStore = require("connect-redis")(express);
var RedisStore = require("socket.io/lib/stores/redis");
var http = require("http");
var redis = require("redis");
var Draw = require("./draw");
var config = require("../../../serverConfig/thywill/baseThywillConfig");
var Thywill = require("thywill");

// Data for the cluster members.
var cluster = {
  alpha: {
    port: 10083
  },
  beta: {
    port: 10084
  },
  gamma: {
    port: 10085
  },
  delta: {
    port: 10086
  }
};

/**
 * Utility function to create a client for a local Redis server.
 * @return {object}
 *   A Redis client.
 */
function createRedisClient () {
  var options = {};
  return redis.createClient(6379, "127.0.0.1", options);
}

/**
 * Start a Draw application process running.
 *
 * @param {string} clusterMemberName
 *   The name of the cluster member to start.
 */
exports.start = function (clusterMemberId) {

  // ------------------------------------------------------
  // Adapt the base configuration for this example.
  // ------------------------------------------------------

  // An example application should have its own base path and Socket.IO
  // namespace.
  config.clientInterface.baseClientPath = "/draw";
  config.clientInterface.namespace = "/draw";
  // We're using sessions, managed via Express.
  config.clientInterface.sessions.type = "express";
  // Thywill needs access to the session cookie secret and key.
  config.clientInterface.sessions.cookieSecret = "some long random string";
  config.clientInterface.sessions.cookieKey = "sid";
  // Create a session store, and set it in the Thywill config so that Express
  // sessions can be assigned to websocket connections. Since this is a
  // clustered example, we're using a Redis-backed store here.
  config.clientInterface.sessions.store = new RedisSessionStore({
    client: createRedisClient()
  });

  // Resource minification settings.
  config.clientInterface.minifyCss = true;
  config.clientInterface.minifyJavascript = true;

  // Set the http.Server instance and Express application.
  var app = express();
  config.clientInterface.server.app = app;
  var server = http.createServer(app).listen(cluster[clusterMemberId].port);
  config.clientInterface.server.server = server;
  // Note that the client resource has no leading /. These must otherwise match.
  config.clientInterface.socketClientConfig.resource = "draw/socket.io";
  config.clientInterface.socketConfig.global.resource = "/draw/socket.io";
  // Create a RedisStore for Socket.IO.
  config.clientInterface.socketConfig.global.store = new RedisStore({
    redisPub: createRedisClient(),
    redisSub: createRedisClient(),
    redisClient: createRedisClient()
  });

  // The cluster implementation is backed by Redis.
  config.cluster = {
    implementation: {
      type: "core",
      name: "redisCluster"
    },
    // The cluster has four members.
    clusterMemberIds: ["alpha", "beta", "gamma", "delta"],
    // The local member name is drawn from the arguments.
    localClusterMemberId: clusterMemberId,
    redisPrefix: "thywill:draw:cluster:",
    publishRedisClient: createRedisClient(),
    subscribeRedisClient: createRedisClient()
  };

  // Set an appropriate log level for an example application.
  config.log.level = "debug";

  // Base paths to use when defining new resources for merged CSS and Javascript.
  config.minifier.cssBaseClientPath = "/draw/css";
  config.minifier.jsBaseClientPath = "/draw/js";

  // Use a Redis-backed ResourceManager to allow resources to be shared between
  // cluster members - not that this is important for this particular example
  // application, but it will be for most clustered applications.
  config.resourceManager = {
    implementation: {
      type: "core",
      name: "redisResourceManager"
    },
    cacheSize: 100,
    redisPrefix: "thywill:draw:resource:",
    // This will be set in the start script.
    redisClient: createRedisClient()
  };

  // ------------------------------------------------------
  // Other odds and ends.
  // ------------------------------------------------------

  // Add minimal configuration to the Express application: just the cookie and
  // session middleware.
  app.use(express.cookieParser(config.clientInterface.sessions.cookieSecret));
  app.use(express.session({
    cookie: {
      httpOnly: true
    },
    key: config.clientInterface.sessions.cookieKey,
    secret: config.clientInterface.sessions.cookieSecret,
    store: config.clientInterface.sessions.store
  }));

  // Middleware and routes might be added here or after Thywill launches. Either
  // way is just fine and won't interfere with Thywill's use of Express to serve
  // resources. e.g. adding a catch-all here is acceptable:
  app.all("*", function (req, res, next) {
    res.statusCode = 404;
    res.send("No such resource.");
  });

  // Instantiate an application object.
  var draw = new Draw("draw");

  // ------------------------------------------------------
  // Launch Thywill.
  // ------------------------------------------------------

  // And off we go: launch a Thywill instance to run the the application.
  Thywill.launch(config, draw, function (error, thywill) {
    if (error) {
      if (error instanceof Error) {
        error = error.stack;
      }
      console.error("Thywill launch failed with error: " + error);
      process.exit(1);
    } else {
      thywill.log.info("Thywill is ready to run cluster member [" + clusterMemberId + "] for the Draw example application.");
    }
  });
};
