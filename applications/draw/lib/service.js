/**
 * @fileOverview
 * Exports functions to start up or prepare to shut down one of the cluster
 * members running the Draw application.
 */

// Load the Thywill core configuration.
var config = require("../service/thywillConfig");
var Thywill = require("thywill");

// Data for the cluster members.
var cluster = {
  alpha: {
    port: 10083,
    adminPort: 20083
  },
  beta: {
    port: 10084,
    adminPort: 20084
  },
  gamma: {
    port: 10085,
    adminPort: 20085
  },
  delta: {
    port: 10086,
    adminPort: 20086
  }
};

/**
 * Start a Draw application process running.
 *
 * @param {string} clusterMemberName
 *   The name of the cluster member to start.
 */
exports.start = function (clusterMemberId) {
  var express = require("express");
  var RedisSessionStore = require("connect-redis")(express);
  var http = require("http");
  var redis = require("redis");
  var Thywill = require("thywill");
  var Draw = require("./draw");

  /**
   * Utility function to create a client for a local Redis server.
   * @return {object}
   *   A Redis client.
   */
  function createRedisClient () {
    var options = {};
    return redis.createClient(6379, "127.0.0.1", options);
  }

  // Create an Express application.
  var app = express();

  // Create a session store, and set it in the Thywill config so that Express
  // sessions can be assigned to websocket connections. Since this is a
  // clustered example, we're using a Redis-backed store here.
  config.clientInterface.sessions.store = new RedisSessionStore({
    client: createRedisClient()
  });
  // Thywill also needs access to the session cookie secret and key.
  config.clientInterface.sessions.cookieSecret = "some long random string";
  config.clientInterface.sessions.cookieKey = "sid";

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

  // Create a server.
  var server = http.createServer(app).listen(cluster[clusterMemberId].port);
  // Add the server and Express to the client interface configuration.
  config.clientInterface.server = {
    server: server,
    app: app
  };

  // Set the remaining configuration items that either depend on the cluster
  // member or are datastore connections, etc.
  config.cluster.localClusterMemberId = clusterMemberId;
  config.cluster.publishRedisClient = createRedisClient();
  config.cluster.subscribeRedisClient = createRedisClient();
  config.resourceManager.redisClient = createRedisClient();

  // Instantiate an application object.
  var draw = new Draw("draw");

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
