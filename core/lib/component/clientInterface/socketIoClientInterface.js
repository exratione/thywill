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
var Message = require("../messageManager/message");

// -----------------------------------------------------------
// Class Definition
// -----------------------------------------------------------

/**
 * @class
 * A web browser client interface built on top of Socket.IO: see
 * http://socket.io/ for details.
 *
 * This manages the server side of a single page web application:
 *
 * - setting up the resources delivered to the client on the initial page load.
 * - passing messages back and forth via Socket.IO.
 */
function SocketIoClientInterface () {
  SocketIoClientInterface.super_.call(this);
  this.socketFactory = null;
  this.bootstrapResourceClientPaths = [];

  // Convenience reference.
  this.SESSION_TYPE = SocketIoClientInterface.SESSION_TYPE;
}
util.inherits(SocketIoClientInterface, Thywill.getBaseClass("ClientInterface"));
var p = SocketIoClientInterface.prototype;

// -----------------------------------------------------------
// "Static" parameters
// -----------------------------------------------------------

SocketIoClientInterface.SESSION_TYPE = {
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
          SocketIoClientInterface.SESSION_TYPE.NONE,
          SocketIoClientInterface.SESSION_TYPE.EXPRESS
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
  },
  upCheckClientPath: {
    _configInfo: {
      description: "The client path for a page that declares the process running - for use with proxy and monitoring checks.",
      types: "string",
      required: true
    }
  },
  usePubSubForSending: {
    _configInfo: {
      description: "If true each connection is signed up for its own pub/sub channel and messages are sent that way. This and configuring Socket.IO to use a RedisStore is usually necessary for applications with multiple backend Node.js processes.",
      types: "boolean",
      required: true
    }
  }
};

// -----------------------------------------------------------
// Initialization
// -----------------------------------------------------------

/**
 * The clientInterface component is the last to be configured, so it has access
 * to fully configured instances of all the other components and their data.
 *
 * @param {Thywill} thywill
 *   A Thywill instance.
 * @param {Object} config
 *   An object representation of the configuration for this component.
 * @param {function} [callback]
 *   Of the form function (error) {}, where error === null on success.
 */
p._configure = function (thywill, config, callback) {
  var self = this;
  this.thywill = thywill;
  this.config = config;
  // Create this once; it'll see a lot of use.
  this.config.baseClientPathRegExp = new RegExp("^" + this.config.baseClientPath.replace("/", "\\/") + "\\/?");

  // -----------------------------------------------------------------
  // Data structures for keeping track of who is online.
  // -----------------------------------------------------------------

  this.connections = {};
  this.thywill.cluster.getClusterMemberIds().forEach(function (clusterMemberId, index, array) {
    self.connections[clusterMemberId] = {
      connections: {},
      sessions: {}
    };
  });

  // -----------------------------------------------------------------
  // Cluster configuration: communication between processes.
  // -----------------------------------------------------------------

  // Task names, those used internally by this clientInterface implementation.
  this.clusterTask = {
    // Delivery of all connected client data for a specific process.
    connectionData: "thywill:clientInterface:connectedData",
    // Request for all connected client data for a specific process.
    connectionDataRequest: "thywill:clientInterface:connectedDataRequest",
    // Client connection notice from another cluster member.
    connectionTo: "thywill:clientInterface:connectionTo",
    // Client disconnection notice from another cluster member.
    disconnectionFrom: "thywill:clientInterface:disconnectionFrom",
    // Request to subscribe a client if they exist locally.
    subscribe: "thywill:clientInterface:subscribeClient",
    // Request to unsubscribe a client if they exist locally.
    unsubscribe: "thywill:clientInterface:unsubscribeClient"
  };

  // A cluster member fails and goes down. Emit the connection data, then clear it.
  this.thywill.cluster.on(this.thywill.cluster.eventNames.CLUSTER_MEMBER_DOWN, function (data) {
    var connections = self.connections[data.clusterMemberId].connections;
    var sessions = self.connections[data.clusterMemberId].sessions;
    self.emit(self.events.CLUSTER_MEMBER_DOWN, data.clusterMemberId, {
      connections: connections,
      sessions: sessions
    });
    self._clearConnectionDataForClusterMember(data.clusterMemberId);
  });
  // Connection notice from another cluster member.
  this.thywill.cluster.on(this.clusterTask.connectionTo, function (data) {
    self._updateConnectionDataForConnection(data.clusterMemberId, data.connectionId, data.sessionId);
    self.emit(self.events.CONNECTION_TO, data.clusterMemberId, data.connectionId, data.sessionId);
  });
  // Disconnection notice from another cluster member.
  this.thywill.cluster.on(this.clusterTask.disconnectionFrom, function (data) {
    self._updateConnectionDataForDisconnection(data.clusterMemberId, data.connectionId, data.sessionId);
    self.emit(self.events.DISCONNECTION_FROM, data.clusterMemberId, data.connectionId, data.sessionId);
  });
  // Delivery of connection data from another server.
  this.thywill.cluster.on(this.clusterTask.connectionData, function (data) {
    self._updateAllConnectionDataForClusterMember(data.clusterMemberId, data.connections);
  });
  // Request for connection data from another server.
  this.thywill.cluster.on(this.clusterTask.connectionDataRequest, function (data) {
    self.thywill.cluster.sendTo(data.clusterMemberId, self.clusterTask.connectionData, {
      connections: self.connections[self.thywill.cluster.getLocalClusterMemberId()]
    });
  });
  // Subscribe a connectionId if it exists locally.
  this.thywill.cluster.on(this.clusterTask.subscribe, function (data) {
    self._subscribeLocalSocket(data.connectionId, data.channelId);
  });
  // Subscribe a connectionId if it exists locally.
  this.thywill.cluster.on(this.clusterTask.unsubscribe, function (data) {
    self._unsubscribeLocalSocket(data.connectionId, data.channelId);
  });

  // -----------------------------------------------------------------
  // Final steps of configuration.
  // -----------------------------------------------------------------

  // Request an update on who is connected from all other cluster members, so
  // as to bring data up to date in the case where a cluster member falls over.
  this.thywill.cluster.sendToOthers(this.clusterTask.connectionDataRequest, {});
  // Send out a notice that this server has no connections, to ensure that
  // the other processes are correct in their counts.
  this.thywill.cluster.sendToOthers(self.clusterTask.connectionData, {
    connections: this.connections[this.thywill.cluster.getLocalClusterMemberId()]
  });

  // Set ready status.
  this.readyCallback = callback;
  this._announceReady(this.NO_ERRORS);
};

/**
 * Start the client interface running:
 *
 * 1) If using Express, set up a middleware to ensure that Resources will be
 * served via Express regardless of the present or future state of routes and
 * middleware.
 *
 * 2) If not using Express, set up a suitable listener on the server instance
 * to serve Resources.
 *
 * 3) Set up Socket.IO on the server instance.
 *
 * @param {Function} [callback]
 *   Of the form function (error) {}, where error === null on success.
 */
p._startup = function (callback) {
  var self = this;
  var resourceManager = this.thywill.resourceManager;

  // --------------------------------------------------------------------------
  // Set up the http.Server or Express if present.
  // --------------------------------------------------------------------------

  if (this.config.server.app) {
    this._setExpressToServeResources();
  } else {
    this._setHttpServerToServeResources();
  }

  // --------------------------------------------------------------------------
  // Set up Socket.IO.
  // --------------------------------------------------------------------------

  this._initializeSocketIo();
  if (this.config.sessions.type === this.SESSION_TYPE.EXPRESS) {
    this._attachExpressSessionsToSockets();
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
    // Create a resource for the socket.IO client code.
    createSocketIoJSResource: function (asyncCallback) {
      var originFilePath = pathHelpers.resolve(__dirname, "../../../../node_modules/socket.io-client/dist/socket.io.min.js");
      var data = fs.readFileSync(originFilePath, self.config.textEncoding);
      // Generate a resource.
      var resource = resourceManager.createResource(data, {
        clientPath: self.config.baseClientPath + "/js/socket.io.js",
        encoding: self.config.textEncoding,
        minified: true,
        originFilePath: originFilePath,
        type: resourceManager.types.JAVASCRIPT,
        weight: -99999
      });
      self.storeBootstrapResource(resource, asyncCallback);
    },
    // Create a resource for the main client-side Thywill Javascript. We are
    // passing in some additional code via templating.
    createMainThywillJsResource: function (asyncCallback) {
      var originFilePath = pathHelpers.resolve(__dirname, "../../../client/socketIoClientInterface/thywill.js");
      var data = fs.readFileSync(originFilePath, self.config.textEncoding);
      var thywillTemplate = handlebars.compile(data);
      // Template parameters.
      var params = {
        messageClass: self.classToCodeString(Message, "  ", "  ")
      };
      // Generate a resource from the rendered template.
      var resource = resourceManager.createResource(thywillTemplate(params), {
        clientPath: self.config.baseClientPath + "/js/thywill.js",
        encoding: self.config.textEncoding,
        minified: false,
        originFilePath: originFilePath,
        type: resourceManager.types.JAVASCRIPT,
        weight: 0
      });
      self.storeBootstrapResource(resource, asyncCallback);
    },

    // Client-side Javascript for this clientInterface component. This one
    // needs minor templating to add in Socket.io client configuration values.
    // Use Handlebar.js rather than the configured template engine for core
    // files.
    createClientInterfaceJsResource: function (asyncCallback) {
      var originFilePath = pathHelpers.resolve(__dirname, "../../../client/socketIoClientInterface/socketIoServerInterface.js");
      var data = fs.readFileSync(originFilePath, self.config.textEncoding);
      var serverInterfaceTemplate = handlebars.compile(data);
      // Template parameters.
      var params = {
        namespace: self.config.namespace,
        config: JSON.stringify({})
      };
      if (self.config.socketClientConfig) {
        params.config = JSON.stringify(self.config.socketClientConfig);
      }
      // Generate a resource from the rendered template.
      var resource = resourceManager.createResource(serverInterfaceTemplate(params), {
        clientPath: self.config.baseClientPath + "/js/serverInterface.js",
        encoding: self.config.textEncoding,
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
      createBootstrapResourceFromFile("../../../client/socketIoClientInterface/thywillLoadLast.js", {
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
        if (Array.isArray(otherResources)) {
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
      var originFilePath = pathHelpers.resolve(__dirname, "../../../client/socketIoClientInterface/thywill.html");
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

      // Render the template and stash it as a resource.
      var mainPage = mainPageTemplate({
        resources : resourcesByType,
        encoding : self.config.pageEncoding
      });
      var resource = resourceManager.createResource(new Buffer (mainPage, self.config.textEncoding), {
        clientPath: self.config.baseClientPath + "/",
        encoding: self.config.textEncoding,
        originFilePath: originFilePath,
        type: resourceManager.types.HTML
      });
      self.storeResource(resource, asyncCallback);
    },
    // Create a trivial resource to be used for up-checks by a proxy server.
    createUpCheckResource: function (asyncCallback) {
      var resource = resourceManager.createResource(new Buffer ("{ alive: true }", self.config.textEncoding), {
        clientPath: self.config.baseClientPath + self.config.upCheckClientPath,
        encoding: self.config.textEncoding,
        type: resourceManager.types.JSON
      });
      self.storeResource(resource, asyncCallback);
    }
  };
  // Call the above functions in series. Any errors will abort part-way through
  // and be passed back in the callback.
  async.series(fns, callback);
};

/**
 * Take over the listeners already added to the http.Server passed in
 * configuration, and have it serve Resources.
 *
 * We only need to do this if Express is not being used.
 */
p._setHttpServerToServeResources = function () {
  var self = this;

  // Grab the listeners on the server object:
  this.serverListeners = this.config.server.server.listeners("request").splice(0);

  // Set our own listener to manage resource requests.
  this.config.server.server.on("request", function (req, res) {
    // Is this request in the right base path?
    var handled = false;
    if (req.url.match(self.config.baseClientPathRegExp)) {
      // But do we have a resource for this?
      var requestData = urlHelpers.parse(req.url);
      self.getResource(requestData.pathname, function (error, resource) {
        // If there's an error or a resource, handle it.
        if (error || resource) {
          handled = true;
          self.handleResourceRequest(req, res, null, error, resource);
          return;
        }
      });
    }
    // Otherwise pass it to the other listeners.
    if (!handled) {
      self.serverListeners.forEach(function (listener, index, array) {
        listener.call(self.config.server.server, req, res);
      });
    }
  });
};

/**
 * Add middleware to Express to ensure that it will serve Resources regardless
 * of current or future addition of routes or middleware.
 *
 * This involves being a little devious.
 */
p._setExpressToServeResources = function () {
  var self = this;
  var express = require("express");

  // This middleware essentially performs the action of a route. This is a way
  // to ensure that Thywill routes will run no matter the order in which
  // routes or middleware are added.
  var middleware = function (req, res, next) {
    // Is this request in the right base path?
    if (req.path.match(self.config.baseClientPathRegExp)) {
      // But do we have a resource for this?
      self.getResource(req.path, function (error, resource) {
        // If there's an error or a resource, handle it.
        if (error || resource) {
          self.handleResourceRequest(req, res, next, error, resource);
        } else {
          // Otherwise, onwards and let Express take over.
          next();
        }
      });
    } else {
      // Otherwise, onwards and let Express take over.
      next();
    }
  };

  // Add the middleware.
  middleware.isThywill = true;
  this.config.server.app.use(middleware);

  /**
   * Put the Thywill middleware in the right place in the Express stack,
   * which should be last before the router. At the time this is called,
   * the router middleware may or may not have been added, and other
   * middleware may also later be added.
   */
  function positionMiddleware () {
    // The stack wil be at least length 1, as the Thywill middleware has been put there
    // before this function is called.
    var desiredIndex = self.config.server.app.stack.length - 1;
    // Get the index of the router. Should be last, but if we can add
    // middleware out of sequence, so can other people.
    for (var index = 0; index < self.config.server.app.stack.length; index++) {
      // TODO: a less sketchy way of identifying the router middleware.
      if (self.config.server.app.stack[index].handle === self.config.server.app._router.middleware) {
        // If the router middleware is added, then routes have been
        // added, and thus no more middleware will be added.
        clearInterval(positionMiddlewareIntervalId);
        desiredIndex = index;
        break;
      }
    }

    // If it is already in the right place, then we're good.
    if(self.config.server.app.stack[desiredIndex].handle.isThywill) {
      return;
    }

    // Otherwise, remove from the present position.
    var stackItem;
    self.config.server.app.stack = self.config.server.app.stack.filter(function (element, index, array) {
      if (element.handle.isThywill) {
        stackItem = element;
      }
      return !element.handle.isThywill;
    });

    // Insert it into the relevant place.
    self.config.server.app.stack.splice(desiredIndex, 0, stackItem);
  }
  // This will run until the Router middleware is added, which happens
  // when the first route is set.
  var positionMiddlewareIntervalId = setInterval(positionMiddleware, 100);
};

/**
 * Set Socket.IO running on the http.Server instance.
 */
p._initializeSocketIo = function () {
  var self = this;
  // Establish Socket.IO on the server instance.
  this.socketFactory = io.listen(this.config.server.server);

  // Configure Socket.IO based on what we have in the configuration object.
  // This first set is server configuration - client configuration happens
  // later on, and must be put into a resource file using templates.
  var socketConfig = this.config.socketConfig;
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
    self.initializeNewSocketConnection(socket);
  });
};

/**
 * This is how we attach Express sessions to the sockets. The result is that
 * socket.handshake.session holds the session, and socket.handshake.sessionId
 * has the session ID.
 *
 * This code was adapted from:
 * https://github.com/alphapeter/socket.io-express
 */
p._attachExpressSessionsToSockets = function () {
  var self = this;
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
};

// -----------------------------------------------------------
// Connection and serving data methods
// -----------------------------------------------------------

/**
 * A new connection is made over Socket.IO, so sort out what needs to be done
 * with it, and set up its ability to send and receive.
 *
 * @param {Object} socket
 *   We are expecting a socket object with socket.handshake and
 *   socket.handshake.session, where session is an Express session.
 */
p.initializeNewSocketConnection = function (socket) {
  var self = this;
  var messageManager = self.thywill.messageManager;

  // If we're sending via pub/sub, then sign this socket up for its own channel.
  if (this.config.usePubSubForSending) {
    socket.join(socket.id);
  }

  /**
   * A message arrives and the raw data object from Socket.IO code is passed in.
   */
  socket.on("fromClient", function (rawMessage) {
    var message = messageManager.convertClientMessageToServerMessage(rawMessage);
    // Set the connectionId.
    message.setConnectionId(socket.id);
    // Sort out origin and destination - always from client, to server.
    message.setOrigin(messageManager.origins.CLIENT);
    message.setDestination(messageManager.destinations.SERVER);

    // If valid now, send it onward.
    if (message.isValid()) {
      self.emit(self.events.FROM_CLIENT, message);
    } else {
      self.thywill.log.debug("Empty or broken message received from connection: " + socket.id + " with contents: " + JSON.stringify(rawMessage));
    }
  });

  /**
   * The socket disconnects. Note that in practice this event is unreliable -
   * it works nearly all of the time, but not all of the time.
   */
  socket.on("disconnect", function() {
    var data = self.connectionDataFromSocket(socket);
    // Notify all listeners that a client has disconnected.
    self.emit(self.events.DISCONNECTION, data.connectionId, data.sessionId);
    // Send out notices to all cluster processes.
    self.thywill.cluster.sendToAll(self.clusterTask.disconnectionFrom, {
      connectionId: data.connectionId,
      sessionId: data.sessionId
    });
  });

  // Socket.io connections will try to reconnect automatically if configured
  // to do so, and emit this event on successful reconnection.
  /*
  socket.on("reconnect", function() {
    // Do nothing here, as a reconnection also emits "connect", and so it'll
    // be handled. This code is left as a reminder that this happens.
  });
  */

  // Finally, notify all listeners and other cluster processes that a new
  // client has connected.
  var data = this.connectionDataFromSocket(socket);
  this.emit(this.events.CONNECTION, data.connectionId, data.sessionId, data.session);
  this.thywill.cluster.sendToAll(this.clusterTask.connectionTo, {
    connectionId: data.connectionId,
    sessionId: data.sessionId
  });
};

/**
 * Extract the session data we're going to be using from the socket.
 *
 * @param {Object} socket
 *   A socket.
 * @param {Object}
 *   Of the form {connectionId: string, sessionId: string, session: object}.
 *   Either sessionId or session can be undefined under some circumstances,
 *   so check.
 */
p.connectionDataFromSocket = function (socket) {
  var data = {
    connectionId: socket.id,
    sessionId: undefined,
    session: undefined
  };
  switch (this.config.sessions.type) {
    case this.SESSION_TYPE.NONE:
      // Use the socket ID as a sessionID. As remarked elsewhere, not very
      // useful for anything other than example code, as it will change if
      // the socket disconnects and then reconnects.
      data.sessionId = socket.id;
      break;
    case this.SESSION_TYPE.EXPRESS:
      if (socket.handshake) {
        data.sessionId = socket.handshake.sessionId;
        data.session = socket.handshake.session;
      }
      break;
  }
  return data;
};

/**
 * Handle a request with http.Server or Express.
 *
 * @param {Object} req
 *   Request object from the server.
 * @param {Object} res
 *   Response object from the server.
 * @param {function} next
 *   If using Express, this is a function. Otherwise null.
 * @param {mixed} error
 *   Any error resulting from finding the resource.
 * @param {Resource} resource
 *   The resource to server up.
 */
p.handleResourceRequest = function (req, res, next, error, resource) {
  var self = this;

  /**
   * Helper function to send a 500 message.
   *
   * TODO: better error responses, actual HTML would be nice.
   */
  var send500 = function (error) {
    if (next) {
      next(error);
    } else {
      self.thywill.log.error(error);
      res.statusCode = 500;
      res.end("Error loading resource.");
    }
  };

  if (error) {
    send500(error);
    return;
  } else if (!resource) {
    send500(new Error("Missing resource."));
    return;
  }

  if (resource.isInMemory()) {
    res.setHeader("Content-Type", resource.type);
    // TODO: Using the buffer length is only going to be correct if people
    // always use right-sized buffers for the content they contain.
    res.setHeader("Content-Length", resource.buffer.length);
    if (res.send) {
      res.send(resource.buffer);
    } else {
      res.end(resource.buffer);
    }
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
    send500(new Error("Resource incorrectly configured: " + req.path));
  }
};

/**
 * @see ClientInterface#send
 */
p.send = function (message) {
  if (!message.isValid()) {
    this.thywill.log.warn(new Error("Invalid Message: " + message));
    return;
  }

  // Is this a message for the server rather than the client? It's always
  // possible we'll have server applications talking to each other this
  // way.
  var messageManager = this.thywill.messageManager;
  var destination = message.getDestination();
  if (destination === messageManager.destinations.SERVER) {
    this.received(message);
    return;
  }

  var channelId = message.getChannelId();
  var socketId = message.getConnectionId();
  // Strip the message down to what's to be sent to the client.
  var clientMessage = messageManager.convertServerMessageToClientMessage(message);

  // If there is a channel ID set, then publish message to the specified
  // channel.
  if (channelId) {
    // If there is a connection ID, then this channel message originates from
    // a connection, and that connection should not get a copy.
    if (socketId) {
      // Using except() is the same as setting the broadcast flag on a socket
      // instance when emitting - for this use case, where we want to avoid
      // sending to the message originator. But it will work even for clustered
      // processes using a Redis store: the socket instance for socketId might
      // not be available in this instance, as the client might be connected to
      // another of the clustered Node.js processes.
      this.socketFactory.of(this.config.namespace).to(channelId).except(socketId).emit("toClient", clientMessage);
    }
    // This channel message doesn't originate from a client connection, so
    // send it to all channel subscribers.
    else {
      this.socketFactory.of(this.config.namespace).to(channelId).emit("toClient", clientMessage);
    }
  }
  // Otherwise the message is destined for a single client connection, so send
  // it out through the pertinent socket instance.
  else {
    // If there are multiple Node processes in the backend and the application
    // is structured such that process A may want to send a message to a socket
    // connected to process B, then usePubSubForSending must be set true so
    // that messages can be published to the individual connection's channel.
    var destinationSocket = this.socketFactory.of(this.config.namespace).socket(socketId);
    if (destinationSocket) {
      destinationSocket.emit("toClient", clientMessage);
    } else if (this.config.usePubSubForSending) {
      this.socketFactory.of(this.config.namespace).to(socketId).emit("toClient", clientMessage);
    } else {
      this.thywill.log.debug("No socket connected to this process with id: " + socketId);
    }
  }
};

/**
 * @see ClientInterface#subscribe
 */
p.subscribe = function (connectionId, channelId, callback) {
  var socketPresent = this._subscribeLocalSocket(connectionId, channelId);
  // If the socket isn't connected to this process, then tell the other cluster
  // members to find the socket and subscribe it.
  if (!socketPresent) {
    this.thywill.cluster.sendToOthers(this.clusterTask.subscribe, {
      connectionId: connectionId,
      channelId: channelId
    });
  }
  callback();
};

/**
 * @see ClientInterface#subscribe
 *
 * @return {boolean}
 *   True if there was a local socket with this connectionId.
 */
p._subscribeLocalSocket = function (connectionId, channelId) {
  var socket = this.socketFactory.of(this.config.namespace).socket(connectionId);
  // Is this connection connected to this process?
  if (socket) {
    socket.join(channelId);
    return true;
  } else {
    return false;
  }
};

/**
 * @see ClientInterface#unsubscribe
 */
p.unsubscribe = function (connectionId, channelId, callback) {
  var socketPresent = this._unsubscribeLocalSocket(connectionId, channelId);
  // If the socket isn't connected to this process, then tell the other cluster
  // members to find the socket and unsubscribe it.
  if (!socketPresent) {
    this.thywill.cluster.sendToOthers(this.clusterTask.unsubscribe, {
      connectionId: connectionId,
      channelId: channelId
    });
  }
  callback();
};

/**
 * @see ClientInterface#unsubscribe
 *
 * @return {boolean}
 *   True if there was a local socket with this connectionId.
 */
p._unsubscribeLocalSocket = function (connectionId, channelId) {
  var socket = this.socketFactory.of(this.config.namespace).socket(connectionId);
  // Is this connection connected to this process?
  if (socket) {
    socket.leave(channelId);
    return true;
  } else {
    return false;
  }
};

//-----------------------------------------------------------
// Relating to tracking who is online.
//-----------------------------------------------------------

/**
 * @see ClientInterface#clientIsConnected
 */
p.clientIsConnected = function (connectionId, callback) {
  var self = this;
  var connected = Object.keys(this.connections).some(function (clusterMemberId, index, array) {
    return self.connections[clusterMemberId].connections[connectionId];
  });
  callback (null, connected);
};

/**
 * @see ClientInterface#clientIsConnectedLocally
 */
p.clientIsConnectedLocally = function (connectionId, callback) {
  var clusterMemberId = this.thywill.cluster.getLocalClusterMemberId();
  var connected = (this.connections[clusterMemberId].connections[connectionId] !== undefined);
  callback (null, connected);
};

/**
 * @see ClientInterface#sessionIsConnected
 */
p.sessionIsConnected = function (sessionId, callback) {
  var self = this;
  var connected = Object.keys(this.connections).some(function (clusterMemberId, index, array) {
    return self.connections[clusterMemberId].sessions[sessionId];
  });
  callback (null, connected);
};

/**
 * @see ClientInterface#getConnectionData
 */
p.getConnectionData = function (callback) {
  callback(null, this.connections);
};

/**
 * Update the local connection data to note a connection.
 *
 * @param {string} clusterMemberId
 *   The cluster member where the connection occurred.
 * @param {string} connectionId
 *   Unique ID of the connection.
 * @param {string} sessionId
 *   Unique ID of the session associated with this connection - one session
 *   might have multiple concurrent connections.
 */
p._updateConnectionDataForConnection = function(clusterMemberId, connectionId, sessionId) {
  var data = this.connections[clusterMemberId];
  data.connections[connectionId] = Date.now();
  if (!data.sessions[sessionId]) {
    data.sessions[sessionId] = [connectionId];
  } else {
    var sessionConnections = data.sessions[sessionId];
    if (sessionConnections.indexOf(connectionId) === -1) {
      sessionConnections.push(connectionId);
    }
  }
};

/**
 * Update the local connection data to note a disconnection.
 *
 * @param {string} clusterMemberId
 *   The cluster member where the disconnection occurred.
 * @param {string} connectionId
 *   Unique ID of the connection.
 * @param {string} sessionId
 *   Unique ID of the session associated with this connection - one session
 *   might have multiple concurrent connections.
 */
p._updateConnectionDataForDisconnection = function(clusterMemberId, connectionId, sessionId) {
  var data = this.connections[clusterMemberId];
  delete data.connections[connectionId];
  if (data.sessions[sessionId]) {
    var sessionConnections = data.sessions[sessionId];
    sessionConnections = data.sessions[sessionId].filter(function (element, index, array) {
      return (element !== connectionId);
    });
    if (sessionConnections.length === 0) {
      delete data.sessions[sessionId];
    }
  }
};

/**
 * Given all the connection data for a specific cluster member process, make it
 * the local copy of record for that cluster member process.
 *
 * On startup, processes request all the data from other processes, so as to
 * restore the local copy after a crash and restart situation.
 *
 * @param {string} clusterMemberId
 *   The cluster member whose data it is.
 * @param {object} data
 *   The connection data for this cluster member.
 */
p._updateAllConnectionDataForClusterMember = function (clusterMemberId, data) {
  this.connections[clusterMemberId] = data;
};

/**
 * This is called when another cluster member fails, to clear out its
 * connection data since all of the connected clients will now be
 * disconnected.
 *
 * @param {string} clusterMemberId
 *   The cluster member whose data it is.
 */
p._clearConnectionDataForClusterMember = function (clusterMemberId) {
  // Important that we replace the object at the top, rather than the
  // sessions and connections properties, as the original connections and
  // sessions items will be passed on and used to update applications.
  this.connections[clusterMemberId] = {
    connections: {},
    sessions: {}
  };
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
 * @param {Object} app
 *   An Express application.
 * @param {Resource} resource
 *   A resource.
 */
p.serveResourceViaExpress = function (app, resource) {
  this.config.server.app.all(resource.clientPath, this.generateExpressRoute(resource));
};

// -----------------------------------------------------------
// Other utility methods
// -----------------------------------------------------------

/**
 * Given a class definition, create Javascript code for it. This is used to
 * share some minor classes with the front end and save duplication of code.
 *
 * @param {function} classFunction
 *   A class definition.
 * @param {string} [indent]
 *   Indent string, e.g. two spaces: "  "
 * @param {string} [extraIndent]
 *   An additional indent to apply to all rows to get them to line up with
 *   whatever output they are put into. e.g. an extra two spaces "  ";
 * @return {string}
 *   Javascript code.
 */
p.classToCodeString = function (classFunction, indent, extraIndent) {
  indent = indent || "  ";
  var code = "";
  if (extraIndent) {
    code += extraIndent;
  }
  code += classFunction.toString();
  code += "\n\n";

  function getPropertyCode(property) {
    if (typeof property === "function") {
      return property.toString();
    } else {
      return JSON.stringify(property, null, indent);
    }
  }

  var prop, propCode;

  // "Static" items.
  for (prop in classFunction) {
    propCode = getPropertyCode(classFunction[prop]);
    code += classFunction.name + "." + prop + " = " + propCode + ";\n";
  }

  code += "\n";

  // Prototype functions.
  for (prop in classFunction.prototype) {
    propCode = getPropertyCode(classFunction.prototype[prop]);
    code += classFunction.name + ".prototype." + prop + " = " + propCode + ";\n\n";
  }

  // Add the extraIndent.
  if (extraIndent) {
    code = code.replace(/\n/g, "\n" + extraIndent);
  }

  return code;
};

// -----------------------------------------------------------
// Exports - Class Constructor
// -----------------------------------------------------------

module.exports = SocketIoClientInterface;
