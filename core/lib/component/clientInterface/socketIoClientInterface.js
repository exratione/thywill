/**
 * @fileOverview
 * Class definition for the SocketIO-based clientInterface implementation.
 */

var util = require("util");
var fs = require("fs");
var crypto = require("crypto");
var urlHelpers = require("url");
var pathHelpers = require("path");
var async = require("async");
var handlebars = require("handlebars");
var io = require("socket.io");
var send = require("send");
var Thywill = require("thywill");

// -----------------------------------------------------------
// Class Definition
// -----------------------------------------------------------

/**
 * @class A web browser client interface built on top of Socket.IO: see
 * http://socket.io/ for details.
 *
 * This manages passing messages back and forth between a web browser and
 * Thywill. This involves setting up resources for the initial page load, and
 * then interfacing with the client Javascript after the page has loaded.
 */
function SocketIoClientInterface () {
  SocketIoClientInterface.super_.call(this);
  this.socketFactory = null;
  this.bootstrapResourceClientPaths = [];
  this.resourceCache = null;

  // Convenience reference.
  this.SESSIONS = SocketIoClientInterface.SESSIONS;
}
util.inherits(SocketIoClientInterface, Thywill.getBaseClass("ClientInterface"));
var p = SocketIoClientInterface.prototype;

// -----------------------------------------------------------
// "Static" parameters
// -----------------------------------------------------------

SocketIoClientInterface.SESSIONS = {
  NONE: "none",
  EXPRESS: "express"
};

SocketIoClientInterface.CONFIG_TEMPLATE = {
  baseClientPath: {
    _configInfo: {
      description: "The base path for all Thywill URLs with a leading but no trailing slash. e.g. '/thywill'.",
      types: "string",
      required: true
    }
  },
  minifyCss: {
    _configInfo: {
      description: "If true, merge and minify CSS resources.",
      types: "boolean",
      required: true
    }
  },
  minifyJavascript : {
    _configInfo: {
      description: "If true, merge and minify Javascript resources.",
      types: "boolean",
      required: true
    }
  },
  namespace : {
    _configInfo: {
      description: "Socket.IO allows connection multiplexing by assigning a namespace; this is generally a good idea.",
      types: "string",
      required: true
    }
  },
  pageEncoding: {
    _configInfo: {
      description: "The content encoding for the web page provided by the client interface.",
      types: "string",
      required: true
    }
  },
  resourceCacheLength: {
    _configInfo: {
      description: "Maximum number of items held by the cache for resources served by the client interface. This should be at least twice the count of bootstrap resources defined in applications.",
      types: "integer",
      required: true
    }
  },
  server: {
    app: {
      _configInfo: {
        description: "An Express application instance.",
        types: "function",
        required: false
      }
    },
    server: {
      _configInfo: {
        description: "An http.Server instance.",
        types: "object",
        required: true
      }
    }
  },
  sessions: {
    type: {
      _configInfo: {
        description: "The type of session management being used.",
        types: "string",
        allowedValues: [
          SocketIoClientInterface.SESSIONS.NONE,
          SocketIoClientInterface.SESSIONS.EXPRESS
        ],
        required: true
      }
    },
    store: {
      _configInfo: {
        description: "For Express sessions: the session store instance.",
        types: "object",
        required: false
      }
    },
    cookieKey: {
      _configInfo: {
        description: "For Express sessions: The name used for session cookies.",
        types: "string",
        required: false
      }
    },
    cookieSecret: {
      _configInfo: {
        description: "For Express sessions: The secret value used for session cookies.",
        types: "string",
        required: false
      }
    }
  },
  socketClientConfig: {
    _configInfo: {
      description: "Container object for Socket.IO client configuration parameters.",
      types: "object",
      required: false
    }
  },
  socketConfig: {
    _configInfo: {
      description: "Container object for environment-specific Socket.IO configuration objects.",
      types: "object",
      required: false
    }
  },
  textEncoding: {
    _configInfo: {
      description: "The content encoding for text resources.",
      types: "string",
      required: true
    }
  }
};

// -----------------------------------------------------------
// Initialization and Shutdown
// -----------------------------------------------------------

/**
 * The clientInterface component is the last to be configured, so it has access
 * to fully configured instances of all the other components and their data.
 *
 * The config object should be of the following form:
 *
 *  {
 *    component: "socketIO",
 *    baseClientPath: "/echo",
 *    minifyCss: false,
 *    minifyJavascript: false,
 *    namespace: "/echoNamespace",
 *    pageEncoding: "utf-8",
 *    resourceCacheLength: 100,
 *    server {
 *      app: (express application instance)
 *      server: (http.Server instance)
 *    },
 *    sessions: {
 *      type: "none" | "express",
 *      store: (express store if using Express sessions)
 *      cookieKey: (string if using Express sessions)
 *      cookieSecret: (string if using Express sessions)
 *    },
 *    socketClientConfig: {
 *      "resource": "echo/socket.io",
 *       ... Socket.IO client configuration ...
 *    },
 *    socketConfig: {
 *      global: {
 *        "resource": "/echo/socket.io",
 *        ... global Socket.IO configuration ...
 *      },
 *      production: {
 *        ... environment-specific Socket.IO configuration ...
 *      },
 *      ...
 *    }
 *    textEncoding: "utf8"
 *  }
 *
 * For Socket.IO configuration, see:
 * https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
 *
 * @param {Thywill} thywill
 *   A Thywill instance.
 * @param {object} config
 *   An object representation of the configuration for this component.
 * @param {function} [callback]
 *   Of the form function (error) {}, where error === null on success.
 */
p._configure = function (thywill, config, callback) {
  var self = this;
  this.thywill = thywill;
  this.config = config;

  // Create a cache for resources served through this interface.
  this.resourceCache = this.thywill.cacheManager.createCache("socketIO", this.config.resourceCacheLength);

  this.readyCallback = callback;
  this._announceReady(this.NO_ERRORS);
};

/**
 * Start the client interface running, in this case by setting up various
 * resources and URLs on the Express server and initializing socket.io.
 *
 * @param {Function}
 * [callback] Of the form function (error) {}, where error === null on success.
 */
p._startup = function (callback) {
  var self = this;
  var resourceManager = this.thywill.resourceManager;

  // --------------------------------------------------------------------------
  // Hijack the server request listeners.
  // --------------------------------------------------------------------------

  // Grab the listeners on the server object:
  this.serverListeners = this.config.server.server.listeners('request').splice(0);

  // And set our own listener to manage resource requests. This will be trumped
  // by Socket.IO's request handler, and only called if that doesn't find
  // something.
  //
  // If we are using Express sessions, then this will serve nothing much, and
  // just pass things on to Express.
  this.config.server.server.on("request", function (req, res) {
    // Thywill only stoops to serve files if there is no Express application
    // provided.
    if (!self.config.server.app) {
      self._handleResourceRequest(req, res);
    } else {
      // Otherwise pass it to the other listeners, which we can assume means
      // passing it to an Express instance to handle.
      self.serverListeners.forEach(function (listener, index, array) {
        listener.call(self.config.server.server, req, res);
      });
    }
  });

  // --------------------------------------------------------------------------
  // Set up Socket.IO.
  // --------------------------------------------------------------------------

  // Establish Socket.IO on the server instance.
  this.socketFactory = io.listen(this.config.server.server);

  // Configure Socket.IO based on what we have in the configuration object.
  // This first set is server configuration - client configuration happens
  // later on, and must be put into a resource file using templates.
  var socketConfig = this.config.socketConfig;
  var socketClientConfig = this.config.socketClientConfig;
  var resourceSettings = [];
  if (socketConfig) {
    // If there is a global configuration set, then use it.
    if (socketConfig.global && socketConfig.global instanceof Object) {
      this.socketFactory.configure(function () {
        for (var property in socketConfig.global) {
          self.socketFactory.set(property, socketConfig.global[property]);
        }
      });
    }

    // Now walk through to apply whatever environment-specific Socket.IO
    // configurations are provided in the configuration object. These
    // configuration properties will only be used if the NODE_ENV environment
    // variable matches the environmentName - e.g. "production", "development",
    // etc.
    var environmentNames = Object.keys(socketConfig);
    environmentNames.filter(function (environmentName, index, array) {
      return (environmentName !== "global");
    }).forEach(function (environmentName, index, array) {
      var environmentConfig = socketConfig[environmentName];
      if (environmentConfig && environmentConfig instanceof Object) {
        self.socketFactory.configure(environmentName, function() {
          for (var property in environmentConfig) {
            self.socketFactory.set(property, environmentConfig[property]);
          }
        });
      }
    });
  }

  // Tell socket.io what to do when a connection starts - this will kick off the
  // necessary setup for an ongoing connection with a client.
  this.socketFactory.of(this.config.namespace).on("connection", function (socket) {
    self._initializeConnection(socket);
  });

  // This is how we attach Express sessions to the sockets. The result is that
  // socket.handshake.session holds the session, and socket.handshake.sessionId
  // has the session ID.
  //
  // This code was adapted from:
  // https://github.com/alphapeter/socket.io-express
  if (this.config.sessions.type === this.SESSIONS.EXPRESS) {
    var express = require("express");
    var cookieParser = express.cookieParser(this.config.sessions.cookieSecret);
    // We're using the authorization hook, but there is no authorizing going on
    // here - we're only attaching the session to the socket handshake.
    this.socketFactory.set("authorization", function (data, callback) {
      if (data && data.headers && data.headers.cookie) {
        cookieParser(data, {}, function (error) {
          if (error) {
            self.thywill.debug(error);
            callback("COOKIE_PARSE_ERROR", false);
            return;
          }

          var sessionId = data.signedCookies[self.config.sessions.cookieKey];
          self.config.sessions.store.get(sessionId, function (error, session) {
            // Add the sessionId. This will show up in
            // socket.handshake.sessionId.
            //
            // It's useful to set the ID and session separately because of
            // those fun times when you have an ID but no session - it makes
            // debugging that much easier.
            data.sessionId = sessionId;
            if (error) {
              self.thywill.debug(error);
              callback("ERROR", false);
            } else if (!session) {
              callback("NO_SESSION", false);
            } else {
              // Add the session. This will show up in
              // socket.handshake.session.
              data.session = session;
              callback(null, true);
            }
          });
        });
      } else {
        callback("NO_COOKIE", false);
      }
    });
  }

  // --------------------------------------------------------------------------
  // Set up the bootstrap resources for Thywill main page requests.
  // --------------------------------------------------------------------------

  // Set up an array of functions to be executed in series that will build the
  // array of bootstrap resources needed for the main Thywill page.
  var resources = [];

  /**
   * Helper function for creating and storing a bootstrap resource.
   *
   * @param {string}
   * relativePath A relative path from this file to the file to be loaded.
   * @param {Object}
   * attributes An attributes object for creating a resource - see the Resource
   * class for more information.
   * @param {Function}
   * callback Of the form function (error) where error === null on success.
   */
  function createBootstrapResourceFromFile (relativePath, attributes, callback) {
    // Add some attributes.
    attributes.originFilePath = pathHelpers.resolve(__dirname, relativePath);
    attributes.isGenerated = false;
    // Create the resource and pass it back out in the callback.
    resourceManager.createResourceFromFile(attributes.originFilePath, attributes, function (error, resource) {
      if (error) {
        callback.call(self, error);
      } else {
        self.storeBootstrapResource(resource, callback);
      }
    });
  }

  // Array of loader functions to be called in series.
  var fns = {
    // Create a resource for the main client-side Thywill Javascript.
    createMainThywillJsResource: function (asyncCallback) {
      createBootstrapResourceFromFile("../../../client/thywill.js", {
        clientPath: self.config.baseClientPath + "/js/thywill.js",
        encoding: self.config.textEncoding,
        minified: false,
        type: resourceManager.types.JAVASCRIPT,
        weight: 0
      }, asyncCallback);
    },

    // Client-side Javascript for this clientInterface component. This one
    // needs minor templating to add in Socket.io client configuration values.
    // Use Handlebar.js rather than the configured template engine for core
    // files.
    createClientInterfaceJsResource: function (asyncCallback) {
      var originFilePath = pathHelpers.resolve(__dirname, "../../../client/component/clientInterface/socketIoServerInterface.js");
      var data = fs.readFileSync(originFilePath, self.config.textEncoding);
      var serverInterfaceTemplate = handlebars.compile(data);
      // Template parameters.
      var params = {
        namespace: self.config.namespace,
        config: JSON.stringify({})
      };
      if (socketClientConfig) {
        params.config = JSON.stringify(socketClientConfig);
      }
      // Generate a resource from the rendered template.
      var resource = resourceManager.createResource(serverInterfaceTemplate(params), {
        clientPath: self.config.baseClientPath + "/js/serverInterface.js",
        encoding: self.config.textEncoding,
        isGenerated: true,
        minified: false,
        originFilePath: originFilePath,
        type: resourceManager.types.JAVASCRIPT,
        weight: 1
      });
      self.storeBootstrapResource(resource, asyncCallback);
    },

    // Define a Javascript resource that needs to be loaded after all other
    // Javascript resources. We can't use things like jQuery(document).ready()
    // for this because core Thywill doesn't assume any such framework is
    // present.
    createLoadLastJsResource: function (asyncCallback) {
      createBootstrapResourceFromFile("../../../client/thywillLoadLast.js", {
        clientPath: self.config.baseClientPath + "/js/thywillLoadLast.js",
        encoding: self.config.textEncoding,
        minified: false,
        type: resourceManager.types.JAVASCRIPT,
        weight: 999999
      }, asyncCallback);
    },

    // Load up bootstrap resources defined here and elsewhere (i.e. in
    // applications) and stash them in an accessible array.
    loadAllBootstrapResources: function (asyncCallback) {
      self.getBootstrapResources(function(error, otherResources) {
        if (otherResources instanceof Array) {
          resources = resources.concat(otherResources);
        }
        asyncCallback(error);
      });
    },

    // Order the bootstrap resources by weight.
    orderAllBootstrapResources: function (asyncCallback) {
      async.sortBy(resources, function (resource, innerAsyncCallback) {
        innerAsyncCallback.call(self, null, resource.weight);
      }, function(error, sortedResources) {
        resources = sortedResources;
        asyncCallback(error);
      });
    },

    // If we are minifying and aggregating CSS and Javascript, then get to it.
    minifyResources: function (asyncCallback) {
      self.thywill.minifier.minifyResources(
        resources,
        self.config.minifyJavascript,
        self.config.minifyCss,
        function (error, minifiedResources, addedResources) {
          // Replace the resource array with the new minified array.
          resources = minifiedResources;
          // Store any newly added resources, which should be the
          // merged/minified Javascript and CSS.
          async.forEach(addedResources, function (resource, innerAsyncCallback) {
            self.storeResource(resource, innerAsyncCallback);
          }, function (error) {
            asyncCallback(error);
          });
        });
    },

    // Template the main thywill HTML page, adding the necessary CSS and
    // Javascript resources. Again using Handlebar.js rather than the
    // configured template engine.
    createMainPageResource: function (asyncCallback) {
      var originFilePath = pathHelpers.resolve(__dirname, "../../../client/thywill.html");
      var data = fs.readFileSync(originFilePath, self.config.textEncoding);
      var mainPageTemplate = handlebars.compile(data);

      // Split out the assembled resources into arrays by type.
      var resourcesByType = {};
      for ( var i = 0, length = resources.length; i < length; i++) {
        if (!resourcesByType[resources[i].type]) {
          resourcesByType[resources[i].type] = [];
        }
        resourcesByType[resources[i].type].push(resources[i]);
      }

      // This Javascript resource is supplied by Socket.io, so we don't have
      // the content.
      //
      // TODO: how best to get it running as a resource rather than this
      // ad-hoc placement?
      //
      if (!resourcesByType[resourceManager.types.JAVASCRIPT]) {
        resourcesByType[resourceManager.types.JAVASCRIPT] = [];
      }
      // This is a fake resource object with only the data needed for the
      // templating. Sketchy. It has to be first, or at least very near the
      // top.
      resourcesByType[resourceManager.types.JAVASCRIPT].unshift({
        clientPath: self.socketFactory.get('resource') + '/socket.io.js',
        type: resourceManager.types.JAVASCRIPT
      });

      // Render the template and stash it as a resource.
      var mainPage = mainPageTemplate({
        resources : resourcesByType,
        encoding : self.config.pageEncoding
      });
      var resource = resourceManager.createResource(new Buffer (mainPage, self.config.textEncoding), {
        clientPath: self.config.baseClientPath + "/",
        encoding: self.config.textEncoding,
        isGenerated: true,
        originFilePath: originFilePath,
        type: resourceManager.types.HTML
      });
      self.storeResource(resource, asyncCallback);
    }
  };
  // Call the above functions in series. Any errors will abort part-way through
  // and be passed back in the callback.
  async.series(fns, callback);
};

/**
 * @see Component#_prepareForShutdown
 */
p._prepareForShutdown = function (callback) {
  // Leave everything running to allow other components to do things as a part
  // of their graceful shutdown processes.
  callback();
};

// -----------------------------------------------------------
// Connection Methods
// -----------------------------------------------------------

/**
 * A new connection is made over Socket.IO, so sort out what needs to be done
 * with it, and set up its ability to send and receive.
 *
 * @param {Object} socket
 *   We are expecting a socket object with socket.handshake and
 *   socket.handshake.session, where session is an Express session.
 */
p._initializeConnection = function (socket) {
  var self = this;

  /**
   * A message arrives and the raw data object from Socket.IO code is passed in.
   */
  socket.on("fromClient", function (messageObj) {
    if (messageObj && messageObj.data) {
      var messageManager = self.thywill.messageManager;
      var message = messageManager.createMessage({
        data: messageObj.data,
        connectionId: socket.id,
        origin: messageManager.origins.CLIENT,
        destination: messageManager.destinations.SERVER,
        fromApplicationId: messageObj.fromApplicationId,
        toApplicationId: messageObj.toApplicationId
      });
      self.receive(message);
    } else {
      self.thywill.log.debug("Empty or broken message received from session: " + socket.id);
    }
  });

  socket.on("disconnect", function() {
    var data = self._connectionDataFromSocket(socket);
    self.disconnection(data.connectionId, data.sessionId);
  });

  // Socket.io connections will try to reconnect automatically if configured
  // to do so, and emit this event on successful reconnection.
  /*
  socket.on("reconnect", function() {
    // Do nothing here, as a reconnection also emits "connect", and so it'll
    // be handled. This code is left as a reminder that this happens.
  });
  */

  // Finally, tell applications that a new client has connected.
  var data = this._connectionDataFromSocket(socket);
  this.connection(data.connectionId, data.sessionId, data.session);
};

/**
 * Extract the session data we're going to be using from the socket.
 *
 * @param {object} socket
 *   A socket.
 * @param {object}
 *   Of the form {connectionId: string, sessionId: string, session: object}.
 *   Either sessionId or session can be undefined under some circumstances,
 *   so check.
 */
p._connectionDataFromSocket = function (socket) {
  var data = {
    connectionId: socket.id,
    sessionId: undefined,
    session: undefined
  };
  switch (this.config.sessions.type) {
    case this.SESSIONS.NONE:
      // Use the socket ID as a sessionID. As remarked elsewhere, not very
      // useful for anything other than example code, as it will change if
      // the socket disconnects and then reconnects.
      data.sessionId = socket.id;
      break;
    case this.SESSIONS.EXPRESS:
      if (socket.handshake) {
        data.sessionId = socket.handshake.sessionId;
        data.session = socket.handshake.session;
      }
      break;
  }
  return data;
};

/**
 * Handle a request from the server. Used to serve resources when Thywill is
 * not set up to work with Express or another server framework.
 *
 * @param {Object} req
 *   Request object from the server.
 * @param {Object} res
 *   Response object from the server.
 */
p._handleResourceRequest = function (req, res) {
  var self = this;
  var requestData = urlHelpers.parse(req.url);

  /**
   * Helper function to send a 500 message.
   *
   * TODO: better error responses, actual HTML would be nice.
   */
  var send500 = function (error) {
    self.thywill.log.error(error);
    res.statusCode = 500;
    res.end("Error loading resource.");
  };

  /**
   * Helper function to pass a resource to the client.
   */
  var sendResourceToClient = function (resource) {
    if (resource.isInMemory()) {
      res.setHeader("Content-Type", resource.type);
      // TODO: Using the buffer length is only going to be correct if people
      // always use right-sized buffers for the content they contain.
      res.setHeader("Content-Length", resource.buffer.length);
      res.end(resource.buffer);
    } else if (resource.isPiped()) {
      res.setHeader("Content-Type", resource.type);
      // Define an error handler.
      var errorHandler = function (error) {
        self.thywill.log.error(error);
      };
      send(req, resource.filePath)
        // TODO: maxage
        //.maxage(options.maxAge || 0)
        // Add an error handler.
        .on("error", errorHandler)
        // And remove the error handler once done.
        .on("finish", function () {
          req.socket.removeListener("error", errorHandler);
        })
        .pipe(res);
    } else {
      // This resource is probably not set up correctly. It should either have
      // data in memory, be set up to be piped, or be served by another process
      // per resource.servedBy - in the latter case we shouldn't even be in
      // this function.
      send500(new Error("Resource incorrectly configured: " + requestData.pathname));
    }
  };

  // Is this resource cached?
  var resource = this.resourceCache.get(requestData.pathname);
  if (resource) {
    sendResourceToClient(resource);
  } else {
    // Load the resource.
    //
    this.getResource(requestData.pathname, function(error, resource) {
      if (error) {
        send500(error);
      } else if (resource) {
        // We have a resource, so drop it into the cache and send it to the
        // client.
        self.resourceCache.set(requestData.pathname, resource);
        sendResourceToClient(resource);
      } else {
        send500(new Error("Missing resource."));
      }
    });
  }
};

/**
 * @see ClientInterface#send
 */
p.send = function (message) {
  var socketId = message.connectionId;
  if (message.isValid()) {
    var messageManager = this.thywill.messageManager;
    // Is this a message for the server rather than the client? It's always
    // possible we'll have server applications talking to each other this
    // way.
    if (message.destination === messageManager.destinations.SERVER) {
      this.receive(message);
    }
    // Otherwise it's for a client connection, so send it out through the
    // pertinent socket instance.
    else {

      // TODO: this won't work in clustering with a Redis backend for sockets.
      // Not all the sockets will be available in this process.
      // When we get that set as an option here, we have to either:
      // a) do this: http://stackoverflow.com/a/9818600
      // b) give each socket a unique uuid channel allowing broadcast to it.

      var destinationSocket = this.socketFactory.of(this.config.namespace).socket(socketId);
      if (destinationSocket) {
        destinationSocket.emit("toClient", {
          data: message.data,
          fromApplicationId: message.fromApplicationId,
          toApplicationId: message.toApplicationId
        });
      } else {
        this.thywill.log.debug(new Error("Invalid socketId: " + socketId));
      }
    }
  } else {
    this.thywill.log.debug(new Error("Invalid Message: " + message.encode()));
  }
};

// -----------------------------------------------------------
// Resource methods
// -----------------------------------------------------------

/**
 * @see ClientInterface#storeBootstrapResource
 */
p.storeBootstrapResource = function (resource, callback) {
  var self = this;
  this.storeResource(resource, function (error, storedResource) {
    if (!error) {
      self.bootstrapResourceClientPaths.push(resource.clientPath);
    }
    callback(error, storedResource);
  });
};

/**
 * @see ClientInterface#getBootstrapResources
 */
p.getBootstrapResources = function (callback) {
  var self = this;
  // This will pass each element of bootstrapResourceClientPaths into the
  // function (path, asyncCallback). The 2nd arguments passed to asyncCallback
  // are assembled into an array to pass to the final callback - which will be
  // called as callback(error, [resource, resource...])
  async.concat(this.bootstrapResourceClientPaths, function (clientPath, asyncCallback) {
    self.getResource(clientPath, asyncCallback);
  }, callback);
};

/**
 * @see ClientInterface#defineResource
 */
p.storeResource = function (resource, callback) {
  var self = this;
  this.thywill.resourceManager.store(resource.clientPath, resource, function (error, storedResource) {
    if (!error) {
      // If we have an Express application, then serve content that way.
      //
      // If we are using Express sessions, then client resources have to be
      // served via Express, so as to appropriately populate the session
      // before the websocket connection occurs.
      if (self.config.server.app) {
        self.serveResourceViaExpress(self.config.sessions.app, resource);
      }
    }
    callback (error, storedResource);
  });
};

/**
 * @see ClientInterface#getResource
 */
p.getResource = function (clientPath, callback) {
  this.thywill.resourceManager.load(clientPath, callback);
};

// -----------------------------------------------------------
// Express utility methods
// -----------------------------------------------------------

/**
 * Generate a route for Express to serve this resource
 *
 * @param {Resource} resource
 *   A resource.
 * @return {function}
 *   A suitable route function for Express to use to serve the provided resource.
 */
p.generateExpressRoute = function (resource) {
  return function (req, res, next) {
    if (resource.isInMemory()) {
      res.setHeader("Content-Type", resource.type);
      // TODO: Using the buffer length is only going to be correct if people
      // always use right-sized buffers for the content they contain.
      res.setHeader("Content-Length", resource.buffer.length);
      res.send(resource.buffer);
    } else if (resource.isPiped()) {
      res.setHeader("Content-Type", resource.type);
      res.sendFile(resource.filePath, {
        // TODO maxage configuration?
        maxAge: 0
      }, function (error) {
        next(error);
      });
    } else {
      next(new Error("Invalid resource."));
    }
  };
};

/**
 * Tell Express to serve this resource.
 *
 * @param {object} app
 *   An Express application.
 * @param {Resource} resource
 *   A resource.
 */
p.serveResourceViaExpress = function (app, resource) {
  this.config.server.app.all(resource.clientPath, this.generateExpressRoute(resource));
};

// -----------------------------------------------------------
// Exports - Class Constructor
// -----------------------------------------------------------

module.exports = SocketIoClientInterface;
