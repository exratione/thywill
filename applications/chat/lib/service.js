/**
 * @fileOverview
 * Exports functions to start up of the cluster members running the Chat
 * application.
 */

var express = require("express");
var RedisSessionStore = require("connect-redis")(express);
var RedisStore = require("socket.io/lib/stores/redis");
var http = require("http");
var redis = require("redis");
var Chat = require("./chat");
var config = require("../../../serverConfig/thywill/baseThywillConfig");
var Thywill = require("thywill");

// Data for the cluster members.
var cluster = {
  alpha: {
    port: 10087
  },
  beta: {
    port: 10088
  },
  gamma: {
    port: 10089
  },
  delta: {
    port: 10090
  }
};

/**
 * Start a Chat application process running.
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
    clusterPub: redis.createClient(6379, "127.0.0.1"),
    clusterSub: redis.createClient(6379, "127.0.0.1"),
    resourceManager: redis.createClient(6379, "127.0.0.1"),
    application: redis.createClient(6379, "127.0.0.1")
  };

  // ------------------------------------------------------
  // Adapt the base configuration for this example.
  // ------------------------------------------------------

  // An example application should have its own base path and Socket.IO
  // namespace.
  config.clientInterface.baseClientPath = "/chat";
  config.clientInterface.namespace = "/chat";
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
  config.clientInterface.socketClientConfig.resource = "chat/socket.io";
  config.clientInterface.socketConfig.global.resource = "/chat/socket.io";
  // Create a RedisStore for Socket.IO.
  config.clientInterface.socketConfig.global.store = new RedisStore({
    redisPub: redisClients.socketPub,
    redisSub: redisClients.socketSub,
    redisClient: redisClients.socketClient
  });

  // The cluster implementation is backed by Redis.
  config.cluster = {
    implementation: {
      type: "core",
      name: "redisCluster"
    },
    // The cluster has four members.
    clusterMemberIds: ["alpha", "beta", "gamma", "delta"],
    communication: {
      publishRedisClient: redisClients.clusterPub,
      subscribeRedisClient: redisClients.clusterSub
    },
    heartbeat: {
      interval: 200,
      // Note that the timeout has to be chosen with server load and network
      // latency in mind. The heartbeat runs in a separate thread, but the
      // heartbeat messages are propagated via Redis.
      timeout: 500
    },
    // The local member name is drawn from the arguments.
    localClusterMemberId: clusterMemberId,
    redisPrefix: "thywill:chat:cluster:"
  };

  // Set an appropriate log level for an example application.
  config.log.level = "debug";

  // Base paths to use when defining new resources for merged CSS and Javascript.
  config.minifier.cssBaseClientPath = "/chat/css";
  config.minifier.jsBaseClientPath = "/chat/js";

  // Use a Redis-backed ResourceManager to allow resources to be shared between
  // cluster members - not that this is important for this particular example
  // application, but it will be for most clustered applications.
  config.resourceManager = {
    implementation: {
      type: "core",
      name: "redisResourceManager"
    },
    cacheSize: 100,
    redisPrefix: "thywill:chat:resource:",
    // This will be set in the start script.
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
  var chat = new Chat("chat", {
    redis: {
      client: redisClients.application,
      prefix: "thywill:chat:application:"
    }
  });

  // ------------------------------------------------------
  // Launch Thywill.
  // ------------------------------------------------------

  // And off we go: launch a Thywill instance to run the the application.
  Thywill.launch(config, chat, function (error, thywill) {
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

    thywill.log.info("Thywill is ready to run cluster member [" + clusterMemberId + "] for the Chat example application.");
  });
};
