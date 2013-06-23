/**
 * @fileOverview
 * Exports functions to start up one of the cluster members running the Draw
 * application.
 */

var express = require("express");
var RedisSessionStore = require("connect-redis")(express);
var RedisSocketStore = require("socket.io/lib/stores/redis");
var http = require("http");
var redis = require("redis");
var Draw = require("./draw");
var Thywill = require("thywill");

/**
 * Obtain a configuration object.
 *
 * @param {number} port
 *   The port to listen on.
 * @param {string} clusterMemberId
 *   The name of the cluster member to start.
 * @return {object}
 *   The configuration object.
 */
exports.getConfig = function (port, clusterMemberId) {

  // All of the Redis clients that will be needed.
  var redisClients = {
    pub: redis.createClient(6379, "127.0.0.1"),
    sub: redis.createClient(6379, "127.0.0.1"),
    other: redis.createClient(6379, "127.0.0.1")
  };

  // Express application and http.Server.
  var app = express();
  var server = http.createServer(app).listen(port);

  /**
   * Thywill configuration is a nested set of objects, one for each of the
   * components. The configuration specifies which component implementations
   * to use, and provides their specific configuration parameters.
   */
  var config = {
    _redisClients: redisClients,

    // Parameters for the main Thywill wrapper, such as port to listen on,
    // and configuration for the administrative interface.
    thywill: {
      process: {
        // Group ID and User ID for the Thywill process to downgrade to
        // once launched - this allows for such things as launching as
        // root to bind to privileged ports, then running later as a lesser
        // user.
        //
        // Not used on Windows, of course.
        //
        // Note that if you set either of these to a numeric uid, it must be a
        // number not a numeric string - 312, not "312".
        groupId: "node",
        userId: "node"
      }
    },

    // The cache manager in an interface for creating and managing (usually
    // in-memory) caches.
    cacheManager: {
      // Here we specify the use of the core LRU implementation.
      implementation: {
        type: "core",
        name: "lruCacheManager"
      }
    },

    // The client interface component manages communication between web browser
    // and server, and thus will usually have a fairly large set of
    // configuration parameters.
    clientInterface: {
      // Here we specify the use of the core Socket.IO and Express
      // implementation.
      implementation: {
        type: "core",
        name: "socketIoExpressClientInterface"
      },
      // The base path is prepended to all URLs generated by the client
      // interface, allowing distinction between different Thywill Node.js
      // services running as backends on the same server.
      baseClientPath: "/draw",
      // If true, minify and merge bootstrap CSS into a single resource. This
      // is the CSS initially loaded when a client connections.
      minifyCss: true,
      // If true, minify and merge bootstrap Javascript into a single resource.
      // This is the Javascript initially loaded when a client connections.
      minifyJavascript: true,
      // A namespace to apply to Socket.IO communications, allowing other
      // Socket.IO applications to run on the same server in their own,
      // separate namespaces.
      namespace: "/draw",
      // The HTML page encoding to use.
      pageEncoding: "utf-8",
      // The http.Server and Express application are set here.
      server: {
        app: app,
        server: server
      },
      sessions: {
        cookieSecret: "some long random string",
        cookieKey: "sid",
        // Create a session store. Since this is a clustered example, use a
        // Redis-backed store.
        store: new RedisSessionStore({
          client: redisClients.other
        })
      },
      // Configuration to apply to the Socket.IO client on setup. This is
      // used as-is. See:
      // https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
      socketClientConfig: {
        "max reconnection attempts": 50,
        // This MUST match the value of the socketConfig.*.resource value, but
        // with the leading / dropped.
        "resource": "draw/socket.io"
      },
      // Configuration to apply to the Socket.IO server setup. Both the global
      // configuration and any environment-specific configurations are applied.
      // Socket.IO will only use environment-specific parameters if the
      // environment name matches the NODE_ENV environment variable. See:
      // https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
      socketConfig: {
        // Global Socket.IO configuration, will apply unless overruled by a
        // environment-specific value.
        global: {
          "browser client minification": true,
          "browser client etag": true,
          // A comparatively low level of logging. If trying to debug whether
          // or not websockets are working at all, setting log level to 3 is
          // helpful.
          "log level": 1,
          // Match origin protocol MUST be true - when Node.js is operating
          // behind an SSL proxy, which is the default Thywill setup, the
          // difference between ws: and wss: websocket protocols becomes
          // important. This ensures that Socket.IO does the right thing.
          "match origin protocol": true,
          // This MUST match the value of the socketClientConfig.resource value,
          // but with the addition of a leading /.
          "resource": "/draw/socket.io",
          // If using multiple Node.js processes and process A will need to
          // send messages to connections on process B, then this must be a
          // RedisStore and usePubSubForSending must be true. Otherwise, use a
          // MemoryStore.
          "store": new RedisSocketStore({
            redisPub: redisClients.pub,
            redisSub: redisClients.sub,
            redisClient: redisClients.other
          }),
          // The transports to use. We're trying to be modern here and stick
          // with websockets only. This means some browsers will fail
          // miserably - so adjust as needed for your circumstance.
          "transports": ["websocket"]
        },
        // If NODE_ENV = production, then values set here will override the
        // global configuration.
        production: {
          "log level": 0
        }
      },
      // Other text file encodings, such as when loading resources from the
      // file system.
      textEncoding: "utf-8",
      // The path for a page to be called by proxy and monitoring up checks.
      upCheckClientPath: "/alive",
      // If you have set up an application with multiple Node.js processes in
      // the backend, then each individual connection socket will only exist in
      // one of the processes. Your application may be structured in a way that
      // requires process A to send a message to a socket connected to process
      // B. If this is the case, you must set usePubSubForSending to true, and
      // provide a RedisStore to the socketConfig.store configuration
      // parameter.
      usePubSubForSending: false
    },

    // Use a Redis-backed cluster component implementation.
    cluster: {
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
      redisPrefix: "thywill:draw:cluster:"
    },

    // This core component provides an interface for logging.
    log: {
      // We specify the simple console log implementation, which emits log
      // messages via console.log(). Since a Thywill process will run as a
      // service and direct stdout to a log file, this is usually just fine.
      implementation: {
        type: "core",
        name: "consoleLog"
      },
      // The date format used in the log output.
      dateFormat: "ddd mmm dS yyyy HH:MM:ss Z",
      // The minimum log level to be logged by this implementation. Lesser log
      // levels are ignored. The log levels are, in order,
      // [debug, warn, error].
      level: "debug"
    },

    // The minifer component manages minification and merging of CSS and
    // Javascript resources that are assembled by Thywill.
    minifier: {
      // The ugly implementation cobbles together Uglify.js and CleanCSS
      // for minification. It is, in fact, pretty ugly.
      implementation: {
        type: "core",
        name: "uglyMinifier"
      },
      // The base path to use when defining a new resource for merged CSS.
      cssBaseClientPath: "/draw/css",
      // The base path to use when defining a new resource for merged
      // Javascript.
      jsBaseClientPath: "/draw/js"
    },

    // Use a Redis-backed ResourceManager to allow resources to be shared
    // between cluster members - not that this is important for this particular
    // example application, but it will be for most clustered applications.
    resourceManager: {
      implementation: {
        type: "core",
        name: "redisResourceManager"
      },
      cacheSize: 100,
      redisPrefix: "thywill:draw:resource:",
      redisClient: redisClients.other
    },

    // The template component provides an interface to a templating engine,
    // always useful when slinging around HTML and Javascript.
    templateEngine: {
      // Specify the Handlebars templating engine implementation.
      implementation: {
        type: "core",
        name: "handlebarsTemplateEngine"
      },
      // The maximum number of compiled templates to retain in an LRU cache.
      templateCacheLength: 100
    }
  };

  return config;
};

/**
 * Start an application process running.
 *
 * Use in one of these ways, with the callback being optional.
 *
 * start (config, [callback])
 * start (port, clusterMemberId, [callback])
 */
exports.start = function () {
  // Sort out the configuration.
  var config;
  if (typeof arguments[0] === "object") {
    config = arguments[0];
  } else {
    config = exports.getConfig(arguments[0], arguments[1]);
  }

  // Sort out the callback for the launch.
  var callback;
  if (typeof arguments[arguments.length - 1] === "function") {
    callback = arguments[arguments.length - 1];
  } else {
    callback = function (error, thywill) {
      if (error) {
        if (error instanceof Error) {
          error = error.stack;
        }
        console.error("Thywill launch failed with error: " + error);
        process.exit(1);
      }

      // Protect the Redis clients from hanging if they are timed out by the server.
      for (var key in config._redisClients) {
        thywill.protectRedisClient(config._redisClients[key]);
      }

      thywill.log.info("Thywill is ready to run cluster member [" + config.cluster.localClusterMemberId + "] for the Draw example application.");
    };
  }

  // Add minimal configuration to the Express application: just the cookie and
  // session middleware.
  var app = config.clientInterface.server.app;
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

  // And off we go: launch a Thywill instance to run the the application.
  Thywill.launch(config, draw, callback);
};
