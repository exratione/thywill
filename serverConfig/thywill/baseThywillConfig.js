/**
 * @fileOverview
 * A baseline configuration file for Thywill.
 *
 * This is used by the example applications to save on repetition, and to
 * provide a single place where the configuration is fairly well documented.
 */

//-----------------------------------------------------------
// Exports - Configuration
//-----------------------------------------------------------

/**
 * Thywill core configuration is a nested set of objects, one for each
 * of the core components. The configuration specifies which component
 * implementations to use, and provides their specific configuration
 * parameters.
 *
 * Note that Thywill applications are not configured this way, but are
 * expected to use their own configuration methodology.
 */
module.exports = {
  // Parameters for the main Thywill wrapper, such as port to listen on,
  // and configuration for the administrative interface.
  thywill: {
    launch: {
      // Port is only required if Thywill is required to start its own
      // server. i.e. if server = null in:
      // Thywill.launch(thywillConfig, application, server, callback);
      port: 10080,
      // Group ID and User ID for the Thywill process to downgrade to
      // once launched - this allows for such things as launching as
      // root to bind to privileged ports, then running later as a lesser
      // user.
      //
      // Note that if you set either of these to a numeric uid, it must be a
      // number not a numeric string - 312, not "312".
      groupId: "node",
      userId: "node"
    },
    // The administrative interface is a separate HTTPServer instance that runs
    // to offer a few limited functions, such as those needed to properly
    // manage a Thywill process as a service.
    adminInterface: {
      // An array of IP addresses permitted to access the interface.
      ipAddresses: ["127.0.0.1"],
      // Configurable paths for various services.
      paths: {
        prepareForShutdown: "/prepareForShutdown"
      },
      // The port which the administrative interface will listen on.
      port: 20080
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
    baseClientPath: "/application",
    // If true, minify and merge bootstrap CSS into a single resource. This is
    // the CSS initially loaded when a client connections.
    minifyCss: false,
    // If true, minify and merge bootstrap Javascript into a single resource.
    // This is the Javascript initially loaded when a client connections.
    minifyJavascript: false,
    // A namespace to apply to Socket.IO communications, allowing other
    // Socket.IO applications to run on the same server in their own, separate
    // namespaces.
    namespace: "/applicationNamespace",
    // The HTML page encoding to use.
    pageEncoding: "utf-8",
    // The number of items that can be held in the cache of resources served by
    // the client interface - which should be at a minimum twice the number of
    // bootstrap and other resources defined by applications.
    resourceCacheLength: 100,
    // Session management configuration. If sessions are being used, we want
    // access to them for Socket.IO connections.
    //
    // You will probably want to use Express sessions with Socket.IO for any
    // reasonable application. Configure that as follows:
    //
    // session: {
    //   type: "express",
    //   // Set the following values in the application start.js file, as that
    //   // is where Express is set up.
    //   //
    //   // The Express application.
    //   app: null,
    //   // The session store instance.
    //   store: null,
    //   // The cookie key and secret there as well.
    //   cookieKey: null,
    //   cookieSecret: null
    // }
    //
    // See /applications/shapes/service/start.js for an example.
    //
    // The default is for no session management. Not useful for much beyond
    // demonstration applications.
    sessions: {
      type: "none"
    },
    // Configuration to apply to the Socket.IO client on setup. This is
    // used as-is. See:
    // https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
    socketClientConfig: {
      // This MUST match the value of the socketConfig.*.resource value, but
      // with the leading / dropped.
      "resource": "application/socket.io"
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
        "resource": "/application/socket.io",
        // The transports to use. We're trying to be modern here and stick with
        // websockets only.
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
    textEncoding: "utf-8"
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

  // This core component provides an interface for logging.
  log: {
    // We specify the simple console log implementation, which emits log
    // messages via console.log(). Since a Thywill process will run as a
    // service and direct stdout to a log file, this is usually just fine.
    implementation: {
      type: "core",
      name: "consoleLog"
    },
    // The minimum log level to be logged by this implementation. Lesser log
    // levels are ignored. The log levels are, in order, [debug, warn, error].
    level: "debug"
  },

  // The messageManager is a factory for creating messages, objects to
  // represent data passed back and forth between client and server.
  messageManager: {
    // We specify use of the simple implementation, which does absolutely
    // nothing beyond creating fairly plain Javascript objects for use as
    // messages.
    implementation: {
      type: "core",
      name: "simpleMessageManager"
    }
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
    cssBaseClientPath: "/application/css",
    // The base path to use when defining a new resource for merged Javascript.
    jsBaseClientPath: "/application/js"
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
