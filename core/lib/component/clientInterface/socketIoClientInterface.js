/**
 * @fileOverview
 * Class definition for the SocketIO-based clientInterface implementation.
 */

var util = require("util");
var fs = require("fs");
var urlHelpers = require("url");
var pathHelpers = require("path");
var async = require("async");
var handlebars = require("handlebars");
var io = require("socket.io");
var send = require("send");
var Thywill = require("thywill");
var Message = require("./message");
var Client = require("./client");

// -----------------------------------------------------------
// Class Definition
// -----------------------------------------------------------

/**
 * @class
 * A web browser client interface built on top of Socket.IO. See
 * http://socket.io/ for details.
 *
 * This manages the server side of a single page web application that uses
 * websockets as means of passing messages back and forth between server and
 * client. It does the following:
 *
 * 1) Set up the Resources delivered to the client on the initial page load.
 * 2) Deliver messages between client and server via websockets.
 *
 * This implementation does not provide sessions; client information uses
 * connection IDs as session IDs and includes no session instance.
 */
function SocketIoClientInterface () {
  SocketIoClientInterface.super_.call(this);
  this.socketFactory = null;
  this.bootstrapResourceClientPaths = [];
}
util.inherits(SocketIoClientInterface, Thywill.getBaseClass("ClientInterface"));
var p = SocketIoClientInterface.prototype;

// -----------------------------------------------------------
// "Static" parameters
// -----------------------------------------------------------

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
    server: {
      _configInfo: {
        description: "An http.Server instance.",
        types: "object",
        required: true
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
 * @see Component#_configure
 *
 * The clientInterface component is the last core component to be configured,
 * and so it has access to fully configured instances of all the other core
 * components and their data.
 */
p._configure = function (thywill, config, callback) {
  var self = this;
  this.thywill = thywill;
  this.config = config;
  // Create this once; it'll see a lot of use.
  this.config.baseClientPathRegExp = new RegExp("^" + this.config.baseClientPath.replace("/", "\\/") + "\\/?");

  // -----------------------------------------------------------------
  // Cluster configuration: communication between processes.
  // -----------------------------------------------------------------

  // Task names used internally by this clientInterface implementation.
  this.clusterTask = {
    // Request to subscribe a client if they exist locally.
    subscribe: "thywill:clientInterface:subscribeClient",
    // Request to unsubscribe a client if they exist locally.
    unsubscribe: "thywill:clientInterface:unsubscribeClient"
  };
  // Subscribe a connectionId if it exists locally.
  this.thywill.cluster.on(this.clusterTask.subscribe, function (data) {
    self._subscribeLocalSocket(data.connectionId, data.channelIds);
  });
  // Subscribe a connectionId if it exists locally.
  this.thywill.cluster.on(this.clusterTask.unsubscribe, function (data) {
    self._unsubscribeLocalSocket(data.connectionId, data.channelIds);
  });

  // -----------------------------------------------------------------
  // Finish up configuration.
  // -----------------------------------------------------------------

  // Set ready status.
  this.readyCallback = callback;
  this._announceReady(this.NO_ERRORS);
};

/**
 * Start the client interface running. This is the final function called during
 * the Thywill launch, once everything else is in place and ready.
 *
 * @param {Function} callback
 *   Of the form function (error).
 */
p._startup = function (callback) {
  this._setHttpServerToServeResources();
  this._initializeSocketIo();
  this._setupBootstrapResources(callback);
};

/**
 * Assemble all of the bootstrap resources to be delivered to the client on the
 * first page load.
 *
 * @param {Function} callback
 *   Of the form function (error).
 */
p._setupBootstrapResources = function (callback) {
  var self = this;
  var resourceManager = this.thywill.resourceManager;

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
    // Create a resource for the socket.IO client code. Make sure it's first.
    createSocketIoJSResource: function (asyncCallback) {
      var path = "../../../../node_modules/socket.io-client/dist/socket.io.min.js";
      var originFilePath = pathHelpers.resolve(__dirname, path);
      var data = fs.readFileSync(originFilePath, self.config.textEncoding);
      // Generate a resource.
      var resource = resourceManager.createResource(data, {
        clientPath: self.config.baseClientPath + "/js/socket.io.js",
        encoding: self.config.textEncoding,
        originFilePath: originFilePath,
        type: resourceManager.types.JAVASCRIPT,
        weight: -99999
      });
      self.storeBootstrapResource(resource, asyncCallback);
    },

    // Create a resource for the main client-side Thywill Javascript. We are
    // passing in some additional code and values via templating.
    createMainThywillJsResource: function (asyncCallback) {
      var path = "../../../client/socketIoClientInterface/thywill.js";
      var originFilePath = pathHelpers.resolve(__dirname, path);
      var data = fs.readFileSync(originFilePath, self.config.textEncoding);
      var thywillTemplate = handlebars.compile(data);
      // Template parameters.
      var params = {
        messageClass: self.classToCodeString(Message, "  ", "  "),
        namespace: self.config.namespace,
        config: JSON.stringify({})
      };
      if (self.config.socketClientConfig) {
        params.config = JSON.stringify(self.config.socketClientConfig);
      }
      // Generate a resource from the rendered template.
      var resource = resourceManager.createResource(thywillTemplate(params), {
        clientPath: self.config.baseClientPath + "/js/thywill.js",
        encoding: self.config.textEncoding,
        originFilePath: originFilePath,
        type: resourceManager.types.JAVASCRIPT,
        weight: 0
      });
      self.storeBootstrapResource(resource, asyncCallback);
    },

    // Client-side Javascript for the ApplicationInterface.
    createClientInterfaceJsResource: function (asyncCallback) {
      var path = "../../../client/socketIoClientInterface/socketIoApplicationInterface.js";
      createBootstrapResourceFromFile(path, {
        clientPath: self.config.baseClientPath + "/js/applicationInterface.js",
        encoding: self.config.textEncoding,
        type: resourceManager.types.JAVASCRIPT,
        weight: 1
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
        }
      );
    },

    // Template the main thywill HTML page, adding the necessary CSS and
    // Javascript resources. Again using Handlebar.js rather than the
    // configured template engine.
    createMainPageResource: function (asyncCallback) {
      var path = "../../../client/socketIoClientInterface/thywill.html";
      var originFilePath = pathHelpers.resolve(__dirname, path);
      var data = fs.readFileSync(originFilePath, self.config.textEncoding);
      var mainPageTemplate = handlebars.compile(data);

      // Split out the assembled resources into arrays by type.
      var resourcesByType = {};
      for (var i = 0, length = resources.length; i < length; i++) {
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
      var resource = new Buffer (mainPage, self.config.textEncoding);
      resource = resourceManager.createResource(resource, {
        clientPath: self.config.baseClientPath + "/",
        encoding: self.config.textEncoding,
        originFilePath: originFilePath,
        type: resourceManager.types.HTML
      });
      self.storeResource(resource, asyncCallback);
    },
    // Create a trivial resource to be used for up-checks by a proxy server.
    createUpCheckResource: function (asyncCallback) {
      var resource = new Buffer ("{ alive: true }", self.config.textEncoding);
      var resource = resourceManager.createResource(resource, {
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

  // Remove all existing listeners from the server, while keeping a copy of
  // them.
  this.serverListeners = this.config.server.server.listeners("request").splice(0);
  this.config.server.server.removeAllListeners('request');

  /**
   * Helper function - send the request on to other listeners.
   */
  function passToOtherListeners (req, res) {
    self.serverListeners.forEach(function (listener, index, array) {
      listener.call(self.config.server.server, req, res);
    });
  }

  // Set our own listener to manage resource requests.
  this.config.server.server.on("request", function (req, res) {
    // Is this request in the right base path?
    if (!req.url.match(self.config.baseClientPathRegExp)) {
      passToOtherListeners(req, res);
      return;
    }
    // But do we have a resource for this?
    var requestData = urlHelpers.parse(req.url);
    self.getResource(requestData.pathname, function (error, resource) {
      // If there's an error or a resource, handle it.
      if (error || resource) {
        self.handleResourceRequest(req, res, error, resource);
      } else {
        passToOtherListeners(req, res);
      }
    });
  });
};

/**
 * Set Socket.IO running on the http.Server instance.
 */
p._initializeSocketIo = function () {
  var self = this;
  // Establish Socket.IO on the server instance.
  this.config.socketConfig = this.config.socketConfig || {};
  this.config.socketConfig.global = this.config.socketConfig.global || {};
  this.socketFactory = io.listen(this.config.server.server, this.config.socketConfig.global);

  // Now walk through to apply whatever environment-specific Socket.IO
  // configuration is provided in the configuration object. These
  // configuration properties will override the general ones, but will
  // only be used if the NODE_ENV environment variable matches the
  // environmentName - e.g. "production", "development", etc.
  var environmentConfig = this.config.socketConfig[process.env.NODE_ENV];
  if (environmentConfig) {
    for (var property in environmentConfig) {
      this.socketFactory.set(property, environmentConfig[property]);
    }
  }

  // Tell socket.io what to do when a connection starts - this will kick off the
  // necessary setup for an ongoing connection with a client.
  this.socketFactory.of(this.config.namespace).on("connection", function (socket) {
    self.initializeNewSocketConnection(socket);
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
 *   If the clientInterface is configured to use sessions, then we are
 *   expecting a socket object with socket.handshake,
 *   socket.handshake.session, and socket.handshake.sessionId, where session is
 *   an Express session.
 */
p.initializeNewSocketConnection = function (socket) {
  var self = this;
  var data = this.connectionDataFromSocket(socket);

  // If we're sending via pub/sub, then sign this socket up for its own channel.
  if (this.config.usePubSubForSending) {
    socket.join(socket.id);
  }

  /**
   * A message arrives and the raw data object from Socket.IO code is passed in.
   */
  socket.on("fromClient", function (applicationId, rawMessage) {
    if (!applicationId || !rawMessage || typeof rawMessage !== "object") {
      self.thywill.log.debug("Invalid message emit arguments from connection: " + data.connectionId + " for application " + applicationId + " with contents: " + JSON.stringify(arguments));
      return;
    }
    var message = new Message(rawMessage.data, rawMessage._);
    // If valid now, send it onward.
    if (message.isValid()) {
      // Don't pass the session from the data, as it'll be out of date.
      var client = new Client({
        connectionId: data.connectionId,
        sessionId: data.sessionId
      });
      self.emit(self.events.FROM_CLIENT, client, applicationId, message);
    } else {
      self.thywill.log.debug("Empty or broken message received from connection: " + data.connectionId + " for application " + applicationId + " with contents: " + JSON.stringify(rawMessage));
    }
  });

  /**
   * The socket disconnects. Note that in practice this event is unreliable -
   * it works nearly all of the time, but not all of the time.
   */
  socket.on("disconnect", function() {
    // Don't pass the session from the data, as it'll be out of date.
    var client = new Client({
      connectionId: data.connectionId,
      sessionId: data.sessionId
    });
    self.emit(self.events.DISCONNECTION, client);
  });

  // Socket.ioconnections will try to reconnect automatically if configured
  // to do so, and emit this event on successful reconnection.
  /*
  socket.on("reconnect", function() {
    // Do nothing here, as a reconnection also emits "connect", and so it'll
    // be handled. This code is left as a reminder that this happens.
  });
  */

  // Finally, emit a notice.
  this.emit(this.events.CONNECTION, new Client(data));
};

/**
 * Extract the connection data we're going to be using from the socket.
 *
 * @param {Object} socket
 *   A socket.
 * @param {Object}
 */
p.connectionDataFromSocket = function (socket) {
  var data = {
    connectionId: socket.id,
    // Use the socket ID as a sessionID. As remarked elsewhere, not very
    // useful for anything other than example code, as it will change if
    // the socket disconnects and then reconnects.
    sessionId: socket.id,
    session: undefined
  };
  return data;
};

/**
 * Handle a request.
 *
 * @param {Object} req
 *   Request object from the server.
 * @param {Object} res
 *   Response object from the server.
 * @param {mixed} error
 *   Any error resulting from finding the resource.
 * @param {Resource} resource
 *   The resource to server up.
 */
p.handleResourceRequest = function (req, res, error, resource) {
  var self = this;

  if (error) {
    this._send500ResourceResponse(req, res, error);
    return;
  } else if (!resource) {
    this._send500ResourceResponse(req, res, new Error("Missing resource."));
    return;
  }

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
    // data in memory or be set up to be piped.
    this._send500ResourceResponse(req, res, new Error("Resource incorrectly configured: " + req.path));
  }
};

/**
 * Send a 500 error response down to the client when a resource is requested.
 *
 * @param {Object} req
 *   Request object from the server.
 * @param {Object} res
 *   Response object from the server.
 * @param {mixed} error
 *   The error.
 */
p._send500ResourceResponse = function (req, res, error) {
  // TODO: better error responses, actual HTML would be nice.
  this.thywill.log.error(error);
  res.statusCode = 500;
  res.end("Error loading resource.");
};

/**
 * @see ClientInterface#sendToClient
 */
p.sendToConnection = function (applicationId, client, message) {
  // If there are multiple Node processes in the backend and the application
  // is structured such that process A may want to send a message to a socket
  // connected to process B, then usePubSubForSending must be set true so
  // that messages can be published to the individual connection's channel.
  var connectionId = this._clientOrConnectionIdToConnectionId(client);
  message = this._wrapAsMessage(message);
  var destinationSocket = this.socketFactory.of(this.config.namespace).socket(connectionId);
  if (destinationSocket) {
    destinationSocket.emit("toClient", applicationId, message);
  } else if (this.config.usePubSubForSending) {
    this.socketFactory.of(this.config.namespace).to(connectionId).emit("toClient", applicationId, message);
  } else {
    this.thywill.log.debug("No socket connected to this process with id: " + connectionId);
  }
};

/**
 * @see ClientInterface#sendToSession
 */
p.sendToSession = function (applicationId, client, message) {
  // ClientTracker functionality is required to send to a session, as we
  // need to determine all of the associated connections.
  if (!this.thywill.clientTracker) {
    this.thywill.log.error(new Error("Sending a message to all the connections for a session requires a clientTracker component."));
    return;
  }
  var sessionId = this._clientOrSessionIdToSessionId(client);
  message = this._wrapAsMessage(message);
  var self = this;
  this.thywill.clientTracker.connectionIdsForSession(sessionId, function (error, connectionIds) {
    if (error) {
      self.thywill.log.error(error);
    } else {
      connectionIds.forEach(function (connectionId, index, array) {
        self.sendToConnection(applicationId, connectionId, message);
      });
    }
  });
};

/**
 * @see ClientInterface#sendToChannel
 */
p.sendToChannel = function (applicationId, channelId, message, excludeClients) {
  var self = this;
  message = this._wrapAsMessage(message);
  var s = this.socketFactory.of(this.config.namespace).to(channelId);
  if (excludeClients) {
    if (!Array.isArray(excludeClients)) {
      excludeClients = [excludeClients];
    }
    excludeClients.forEach(function (client, index, array) {
      // Using except() is the same as setting the broadcast flag on a socket
      // instance when emitting. It will work even for clustered processes
      // using a Redis store: the socket instance for socketId might not be
      // available in this instance, as the client might be connected to
      // another of the clustered Node.js processes.
      s = s.except(self._clientOrConnectionIdToConnectionId(client));
    });
  }
  s.emit("toClient", applicationId, message);
};

/**
 * Ensure message data is wrapped in a Message instance.
 *
 * @param {mixed|Message} message
 *   The message data.
 */
p._wrapAsMessage = function (message) {
  if (!(message instanceof Message)) {
    message = new Message(message);
  }
  return message;
};

/**
 * @see ClientInterface#subscribe
 */
p.subscribe = function (clients, channelIds, callback) {
  var self = this;
  if (!Array.isArray(clients)) {
    clients = [clients];
  }
  if (!clients.length) {
    callback();
    return;
  }

  clients.forEach(function (client, index, array) {
    var connectionId = self._clientOrConnectionIdToConnectionId(client);
    if(self._subscribeLocalSocket(connectionId, channelIds)) {
      return;
    }
    // The connection isn't local, but we know which cluster member the socket is
    // connected to, so tell it directly.
    for (var clusterMemberId in self.connections) {
      if (self.connections[clusterMemberId].connections[connectionId]) {
        self.thywill.cluster.sendTo(clusterMemberId, self.clusterTask.subscribe, {
          connectionId: connectionId,
          channelIds: channelIds
        });
      }
    }
  });
  callback();
};

/**
 * @see ClientInterface#subscribe
 *
 * @return {boolean}
 *   True if there was a local socket with this connectionId.
 */
p._subscribeLocalSocket = function (connectionId, channelIds) {
  var socket = this.socketFactory.of(this.config.namespace).socket(connectionId);
  // Is this connection connected to this process?
  if (socket) {
    if (!Array.isArray(channelIds)) {
      channelIds = [channelIds];
    }
    channelIds.forEach(function (channelId, index, array) {
      socket.join(channelId);
    });
    return true;
  } else {
    return false;
  }
};

/**
 * @see ClientInterface#unsubscribe
 */
p.unsubscribe = function (clients, channelIds, callback) {
  var self = this;
  if (!Array.isArray(clients)) {
    clients = [clients];
  }
  if (!clients.length) {
    callback();
    return;
  }

  clients.forEach(function (client, index, array) {
    var connectionId = self._clientOrConnectionIdToConnectionId(client);
    if(self._unsubscribeLocalSocket(connectionId, channelIds)) {
      callback();
      return;
    }
    // The connection isn't local, but we know which cluster member the socket is
    // connected to, so tell it directly.
    for (var clusterMemberId in self.connections) {
      if (self.connections[clusterMemberId].connections[connectionId]) {
        self.thywill.cluster.sendTo(clusterMemberId, self.clusterTask.unsubscribe, {
          connectionId: connectionId,
          channelIds: channelIds
        });
      }
    }
  });
  callback();
};

/**
 * @see ClientInterface#unsubscribe
 *
 * @return {boolean}
 *   True if there was a local socket with this connectionId.
 */
p._unsubscribeLocalSocket = function (connectionId, channelIds) {
  var socket = this.socketFactory.of(this.config.namespace).socket(connectionId);
  // Is this connection connected to this process?
  if (socket) {
    if (!Array.isArray(channelIds)) {
      channelIds = [channelIds];
    }
    channelIds.forEach(function (channelId, index, array) {
      socket.leave(channelId);
    });
    return true;
  } else {
    return false;
  }
};

/**
 * @see ClientInterface#loadSession
 */
p.loadSession = function (client, callback) {
  // Not using sessions.
  callback();
};

/**
 * @see ClientInterface#storeSession
 */
p.storeSession = function (client, session, callback) {
  // Not using sessions.
  callback();
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
  this.thywill.resourceManager.store(resource.clientPath, resource, callback);
};

/**
 * @see ClientInterface#getResource
 */
p.getResource = function (clientPath, callback) {
  this.thywill.resourceManager.load(clientPath, callback);
};

// -----------------------------------------------------------
// Other utility methods
// -----------------------------------------------------------

/**
 * Return a connection ID if given a Client instance or a connection ID.
 *
 * @param {Client|string} clientOrConnectionId
 *   Client instance or connection ID.
 */
p._clientOrConnectionIdToConnectionId = function (clientOrConnectionId) {
  if (clientOrConnectionId instanceof Client) {
    return clientOrConnectionId.getConnectionId();
  } else {
    return clientOrConnectionId;
  }
};

/**
 * Return a session ID if given a Client instance or a session Id.
 *
 * @param {Client|string} clientOrSessionId
 *   Client instance or session ID.
 */
p._clientOrSessionIdToSessionId = function (clientOrSessionId) {
  if (clientOrSessionId instanceof Client) {
    return clientOrSessionId.getSessionId();
  } else {
    return clientOrSessionId;
  }
};

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
