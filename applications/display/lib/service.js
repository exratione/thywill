/**
 * @fileOverview
 * Exports functions to start up one of the cluster members running the Display
 * application.
 */

var express = require("express");
var RedisSessionStore = require("connect-redis")(express);
var RedisStore = require("socket.io/lib/stores/redis");
var http = require("http");
var redis = require("redis");
var Display = require("./display");
var config = require("../../../serverConfig/thywill/baseThywillConfig");
var Thywill = require("thywill");

// Data for the cluster members.
var cluster = {
  alpha: {
    port: 10091
  },
  beta: {
    port: 10092
  }
};


/**
 * Start a Display application process running.
 *
 * @param {string} clusterMemberName
 *   The name of the cluster member to start.
 */
exports.start = function (clusterMemberId) {

  // All the Redis clients that will be needed.
  var redisClients = {
    sessionStore: redis.createClient(6379, "127.0.0.1"),
    socketPub: redis.createClient(6379, "127.0.0.1"),
    socketSub: redis.createClient(6379, "127.0.0.1"),
    socketClient: redis.createClient(6379, "127.0.0.1"),
    resourceManager: redis.createClient(6379, "127.0.0.1")
  };

  // ------------------------------------------------------
  // Adapt the base configuration for this example.
  // ------------------------------------------------------

  // An example application should have its own base path and Socket.IO
  // namespace.
  config.clientInterface.baseClientPath = "/display";
  config.clientInterface.namespace = "/display";
  // We're using sessions, managed via Express.
  config.clientInterface.sessions.type = "express";
  // Thywill needs access to the session cookie secret and key.
  config.clientInterface.sessions.cookieSecret = "some long random string";
  config.clientInterface.sessions.cookieKey = "sid";
  // Create a session store, and set it in the Thywill config so that Express
  // sessions can be assigned to websocket connections. Since this is a
  // clustered example, we're using a Redis-backed store here.
  config.clientInterface.sessions.store = new RedisSessionStore({
    client: redisClients.sessionStore
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
  config.clientInterface.socketClientConfig.resource = "display/socket.io";
  config.clientInterface.socketConfig.global.resource = "/display/socket.io";
  // Create a RedisStore for Socket.IO.
  config.clientInterface.socketConfig.global.store = new RedisStore({
    redisPub: redisClients.socketPub,
    redisSub: redisClients.socketSub,
    redisClient: redisClients.socketClient
  });

  // The cluster implementation.
  config.cluster = {
    implementation: {
      type: "core",
      name: "httpCluster"
    },
    // The cluster has two members.
    clusterMembers: {
      "alpha": {
        host: "127.0.0.1",
        port: 20091
      },
      "beta": {
        host: "127.0.0.1",
        port: 20092
      }
    },
    // Up checks run via HTTP.
    upCheck: {
      // How many consecutive failures in order to consider a server down?
      consecutiveFailedChecks: 2,
      // Interval is the time between the end of one request and the start
      // of the next one. This can lag late for all sorts of reasons: e.g.
      // network latency in the request, or more likely the Node.js process
      // on client or endpoint is doing something else and being slow in
      // getting to either launch the request or respond to it.
      interval: 200,
      // Adjust the timeout for expectations as to how long a cluster member
      // can likely take to respond. It should be close to immediate unless
      // there are long-running and computationally expensive tasks taking
      // place.
      requestTimeout: 500
    },
    // The local member name is drawn from the arguments.
    localClusterMemberId: clusterMemberId,
    // Again, adjust for expectations as to how long a cluster member can
    // take to immediately respond to a requests.
    taskRequestTimeout: 500
  };

  // Set an appropriate log level for an example application.
  config.log.level = "debug";

  // Base paths to use when defining new resources for merged CSS and Javascript.
  config.minifier.cssBaseClientPath = "/display/css";
  config.minifier.jsBaseClientPath = "/display/js";

  // Use a Redis-backed ResourceManager to allow resources to be shared between
  // cluster members - not that this is important for this particular example
  // application, but it will be for most clustered applications.
  config.resourceManager = {
    implementation: {
      type: "core",
      name: "redisResourceManager"
    },
    cacheSize: 100,
    redisPrefix: "thywill:display:resource:",
    redisClient: redisClients.resourceManager
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
  var display = new Display("display");

  // ------------------------------------------------------
  // Launch Thywill.
  // ------------------------------------------------------

  // And off we go: launch a Thywill instance to run the the application.
  Thywill.launch(config, display, function (error, thywill) {
    if (error) {
      if (error instanceof Error) {
        error = error.stack;
      }
      console.error("Thywill launch failed with error: " + error);
      process.exit(1);
    }

    // Protect the Redis clients from hanging if they are timed out by the server.
    for (var key in redisClients) {
      thywill.protectRedisClient(redisClients[key]);
    }

    thywill.log.info("Thywill is ready to run cluster member [" + clusterMemberId + "] for the Display example application.");
  });
};
