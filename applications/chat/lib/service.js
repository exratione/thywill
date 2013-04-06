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
    pub: redis.createClient(6379, "127.0.0.1"),
    sub: redis.createClient(6379, "127.0.0.1"),
    other: redis.createClient(6379, "127.0.0.1")
  };

  // ------------------------------------------------------
  // Adapt the base configuration for this example.
  // ------------------------------------------------------

  // Use the Express implementation.
  config.clientInterface.implementation.name = "socketIoExpressClientInterface";
  // An example application should have its own base path and Socket.IO
  // namespace.
  config.clientInterface.baseClientPath = "/chat";
  config.clientInterface.namespace = "/chat";
  // Thywill needs access to the session cookie secret and key.
  config.clientInterface.sessions = {
    cookieSecret: "some long random string",
    cookieKey: "sid",
    // Create a session store. Since this is a clustered example, use a
    // Redis-backed store.
    store: new RedisSessionStore({
      client: redisClients.other
    })
  };

  // Resource minification settings.
  config.clientInterface.minifyCss = false;
  config.clientInterface.minifyJavascript = false;

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
    redisPub: redisClients.pub,
    redisSub: redisClients.sub,
    redisClient: redisClients.other
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
      publishRedisClient: redisClients.pub,
      subscribeRedisClient: redisClients.sub
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
    redisClient: redisClients.other
  };

  // A Redis implementation of a ChannelManager for keeping track of which
  // clients are grouped together in chats.
  config.channelManager = {
    implementation: {
      type: "extra",
      name: "redisChannelManager"
    },
    redisPrefix: "thywill:chat:channel:",
    redisClient: redisClients.other
  };

  // The RedisChannelManager requires a ClientTracker implementation.
  config.clientTracker = {
    implementation: {
      type: "extra",
      name: "inMemoryClientTracker"
    }
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
      client: redisClients.other,
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
    for (var prop in redisClients) {
      thywill.protectRedisClient(redisClients[prop]);
    }

    thywill.log.info("Thywill is ready to run cluster member [" + clusterMemberId + "] for the Chat example application.");
  });
};
