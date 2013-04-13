/**
 * @fileOverview
 * A script to launch a Thywill server process running the Echo example
 * application.
 */

var http = require("http");
var MemoryStore = require("socket.io/lib/stores/memory");
var Echo = require("../lib/echo");
var Thywill = require("thywill");

// ------------------------------------------------------
// Create the configuration for this example.
// ------------------------------------------------------

/**
 * Thywill configuration is a nested set of objects, one for each of the
 * components. The configuration specifies which component implementations
 * to use, and provides their specific configuration parameters.
 */
var config = {
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
  // and server, and thus will usually have a fairly large set of configuration
  // parameters.
  clientInterface: {
    // Here we specify the use of the core Socket.IO implementation of this
    // component.
    implementation: {
      type: "core",
      name: "socketIoClientInterface"
    },
    // The base path is prepended to all URLs generated by the client
    // interface, allowing distinction between different Thywill Node.js
    // services running as backends on the same server.
    baseClientPath: "/echo",
    // If true, minify and merge bootstrap CSS into a single resource. This is
    // the CSS initially loaded when a client connections.
    minifyCss: true,
    // If true, minify and merge bootstrap Javascript into a single resource.
    // This is the Javascript initially loaded when a client connections.
    minifyJavascript: true,
    // A namespace to apply to Socket.IO communications, allowing other
    // Socket.IO applications to run on the same server in their own, separate
    // namespaces.
    namespace: "/echo",
    // The HTML page encoding to use.
    pageEncoding: "utf-8",
    // The http.Server instance is set here.
    server: {
      server: http.createServer().listen(10080)
    },
    // Configuration to apply to the Socket.IO client on setup. This is
    // used as-is. See:
    // https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
    socketClientConfig: {
      "max reconnection attempts": 50,
      // This MUST match the value of the socketConfig.*.resource value, but
      // with the leading / dropped.
      "resource": "echo/socket.io"
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
        // A comparatively low level of logging. If trying to debug whether or
        // not websockets are working at all, setting log level to 3 is
        // helpful.
        "log level": 1,
        // Match origin protocol MUST be true - when Node.js is operating
        // behind an SSL proxy, which is the default Thywill setup, the
        // difference between ws: and wss: websocket protocols becomes
        // important. This ensures that Socket.IO does the right thing.
        "match origin protocol": true,
        // This MUST match the value of the socketClientConfig.resource value,
        // but with the addition of a leading /.
        "resource": "/echo/socket.io",
        // If using multiple Node.js processes and process A will need to send
        // messages to connections on process B, then this must be a RedisStore
        // and usePubSubForSending must be true. Otherwise, use a MemoryStore.
        "store": new MemoryStore(),
        // The transports to use. We're trying to be modern here and stick with
        // websockets only. This means some browsers will fail miserably - so
        // adjust as needed for your circumstance.
        "transports": ["websocket"]
      },
      // If NODE_ENV = production, then values set here will override the
      // global configuration.
      production: {
        "log level": 0
      }
    },
    // Other text file encodings, such as when loading resources from the file
    // system.
    textEncoding: "utf-8",
    // The path for a page to be called by proxy and monitoring up checks.
    upCheckClientPath: "/alive",
    // If you have set up an application with multiple Node.js processes in the
    // backend, then each individual connection socket will only exist in one
    // of the processes. Your application may be structured in a way that
    // requires process A to send a message to a socket connected to process B.
    // If this is the case, you must set usePubSubForSending to true, and
    // provide a RedisStore to the socketConfig.store configuration parameter.
    usePubSubForSending: false
  },

  // Interface for communicating between clustered Thywill server processes.
  cluster: {
    // This is the stub cluster communication interface for a single process
    // setup - i.e. there is no cluster.
    implementation: {
      type: "core",
      name: "noCluster"
    },
    localClusterMemberId: "noCluster"
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
    // levels are ignored. The log levels are, in order, [debug, warn, error].
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
    cssBaseClientPath: "/echo/css",
    // The base path to use when defining a new resource for merged Javascript.
    jsBaseClientPath: "/echo/js"
  },

  // The resource manager is, as you might expect, the factory for creating and
  // keeping track of resources - the CSS, Javascript, HTML, and so forth, that
  // is delivered to the client.
  resourceManager: {
    // Here we specify a very trivial resource manager implementation that
    // does little more than keep track of resources in memory.
    implementation: {
      type: "core",
      name: "inMemoryResourceManager"
    }
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

// ------------------------------------------------------
// Other odds and ends.
// ------------------------------------------------------

// Add a trivial catch-all listener. Only really necessary because this is an
// example and there is no other functionality or framework associated with
// this server instance.
config.clientInterface.server.server.on("request", function (req, res) {
  res.statusCode = 404;
  res.end("No such resource.");
});

// Instantiate an application object.
var echo = new Echo("echo");

// ------------------------------------------------------
// Launch Thywill.
// ------------------------------------------------------

// And off we go: launch a Thywill instance to run the the application.
Thywill.launch(config, echo, function (error, thywill) {
  if (error) {
    if (error instanceof Error) {
      error = error.stack;
    }
    console.error("Thywill launch failed with error: " + error);
    process.exit(1);
  } else {
    thywill.log.info("Thywill is ready to run the Echo example application.");
  }
});
