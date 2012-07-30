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
var ejs = require("ejs");
var io = require("socket.io");

var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A web browser client interface built on top of Socket.IO: see 
 * http://socket.io/ for details.
 * 
 * This manages passing messages back and forth between a web browser and
 * Thywill. This involves setting up resources for the initial page load,
 * and then interfacing with the client Javascript after the page has loaded.
 */
function SocketIO() {
  SocketIO.super_.call(this);
  this.socketFactory = null;
  this.bootstrapResourcePaths = [];
};
util.inherits(SocketIO, Thywill.getBaseClass("ClientInterface"));
var p = SocketIO.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

SocketIO.CONFIG_TEMPLATE = {
  basePath: {
    _configInfo: {
       description: "The base path for all Thywill URLs with a leading but no trailing slash. e.g. '/thywill'.",
       types: "string",
       required: true
     } 
  },
  encoding: {
    _configInfo: {
       description: "The content encoding for text and web pages.",
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
  minifyJavascript: {
    _configInfo: {
       description: "If true, merge and minify Javascript resources.",
       types: "boolean",
       required: true
     } 
  },
  namespace: {
    _configInfo: {
       description: "Socket.IO allows connection multiplexing by assigning a namespace; this is generally a good idea.",
       types: "string",
       required: true
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
  }
};

//-----------------------------------------------------------
// Initialization and Shutdown
//-----------------------------------------------------------

/**
 * The clientInterface component is the last to be configured, so it has 
 * access to fully configured instances of all the other components and their
 * data.
 * 
 * The config object should be of the following form:
 * 
 * {
 *   "component": "socketIO",
 *   "basePath": "/echo",
 *   "encoding": "utf-8",
 *   "minifyCss": false,
 *   "minifyJavascript": false,
 *   "namespace": "/echoNamespace",
 *   "socketClientConfig": {
 *     "resource": "echo/socket.io",
 *     
 *     ... Socket.IO client configuration ...
 *     
 *   },
 *   "socketConfig": {
 *     "global": {
 *       "resource": "/echo/socket.io",
 *      
 *       ... global Socket.IO configuration ...
 *       
 *     },
 *     "production": {
 *       ... environment-specific Socket.IO configuration ...
 *     },
 *     ...
 *   }
 * }
 * 
 * For Socket.IO configuration, see: 
 * https://github.com/LearnBoost/Socket.IO/wiki/Configuring-Socket.IO
 * 
 * @param {Thywill} thywill
 *   A Thwyill instance.
 * @param {Object} config
 *   An object representation of the configuration for this component.
 * @param {Function} [callback] 
 *   Of the form function (error) {}, where error == null on success. 
 */
p._configure = function (thywill, config, callback) {
  var self = this;
  this.thywill = thywill;
  this.config = config; 
  this.readyCallback = callback;
  this._announceReady(this.NO_ERRORS);
};

/**
 * Start the client interface running, in this case by setting up various
 * resources and URLs on the Express server and initializing socket.io.
 * 
 * @param {Function} [callback] 
 *   Of the form function (error) {}, where error == null on success. 
 */
p._startup = function (callback) {
  var self = this;
  
  // Grab the listeners on the server object:
  this.serverListeners = this.thywill.server.listeners('request').splice(0);
  
  // And set our own listener to manage resource requests. This will be trumped
  // by Socket.IO's request handler, and only called if that doesn't find 
  // something.
  var re = new RegExp("^" + this.config.basePath + "\\/");
  this.thywill.server.on("request", function (req, res) {
    if (req.url.match(re)) {
      self._handleResourceRequest(req, res);
    } else {
      // Not a resource URL, so pass it to the other listeners.
      for (var i = 0, l = self.serverListeners.length; i < l; i++) {
        self.serverListeners[i].call(self.thywill.server, req, res);
      }
    }
  });
 
  // Set up Socket.IO on the server object.
  this.socketFactory = io.listen(this.thywill.server); 
  
  // Configure Socket.IO based on what we have in the configuration object.
  // This first set is server configuration - client configuration happens
  // later on, and must be put into a resource file using templates.
  var socketConfig = this.config.socketConfig;
  var socketClientConfig = this.config.socketClientConfig;
  var resourceSettings = [];
  if (socketConfig) {
    if (socketConfig.global && socketConfig.global instanceof Object) {
      // There's a global configuration set, so use it.
      this.socketFactory.configure(function () {
        for (property in socketConfig.global) {
          self.socketFactory.set(property, socketConfig.global[property]);
        }             
      });
    } 

    // Now walk through the async series below applying whatever 
    // environment-specific Socket.IO configurations are provided in the 
    // configuration object. These configuration properties will only be used
    // if the NODE_ENV environment variable matches the environmentName - e.g.
    // "production", "development", etc.
    var properties = [];
    for (var property in socketConfig) {
      if (property != "global") {
        properties.push(property);
      }
    }
    async.forEachSeries(
      properties, 
      function (environmentName) {
        var environmentConfig = socketConfig[environmentName];
        if (environmentConfig && environmentConfig instanceof Object) {
          self.socketFactory.configure(environmentName, function () {
            for (property in environmentConfig) { 
              self.socketFactory.set(property, environmentConfig[property]);
            }     
          }); 
        }
      },
      function (error) { 
        // We don't much care about this callback or when the series
        // completes.
      } 
    );  
  }
  
  // Tell socket what to do when a connection starts - this will kick off the
  // necessary setup for an ongoing connection with a client.
  this.socketFactory.of(this.config.namespace).on("connection", function (socket) { 
    self._initializeConnection(socket);
  });   
  
  // Set up an array of functions to be executed in series that will build the 
  // array of bootstrap resources needed for the main Thywill page.
  var resources = [];
  var resourceManager = this.thywill.resourceManager;
  // Helper function.
  var readFromFile = function(relativePath) {
    var filepath = pathHelpers.resolve(__dirname, relativePath);
    return fs.readFileSync(filepath, self.config.encoding);
  };
  // Helper function.
  var setResourceAndContinue = function(resource, asyncCallback) {
    self.defineBootstrapResource(resource, function(error) {
      asyncCallback.call(self, error);
    });
  };
  // Array of loader functions to be called in series.
  var fns = [
    // Main client-side Thywill Javascript.      
    function (asyncCallback) {
      var js = readFromFile("../../../../client/thywill.js");
      var resource = resourceManager.createResource(resourceManager.types.JAVASCRIPT, 0, self.config.basePath + "/thywill.js", js);
      setResourceAndContinue(resource, asyncCallback);
    },
    // Client-side Javascript for this clientInterface component.    
    function (asyncCallback) {
      var js = readFromFile("../../../../client/component/clientInterface/socketIO/serverInterface.js");
      // This one needs minor templating to add in Socket.io client
      // configuration values. Use EJS rather than the configured template
      // engine for core files.
      var templateParams = {
        namespace: self.config.namespace,
        config: {}
      };
      if (socketClientConfig) {
        templateParams.config = JSON.stringify(socketClientConfig);
      } 
      js = ejs.render(js, {locals: templateParams}); 
      var resource = resourceManager.createResource(resourceManager.types.JAVASCRIPT, 0, self.config.basePath + "/serverInterface.js", js);
      setResourceAndContinue(resource, asyncCallback);
    },
    // Define a Javascript resource that needs to be loaded after all other
    // Javascript resources.
    function (asyncCallback) {
      var js = readFromFile("../../../../client/thywillLoadLast.js");
      var resource = resourceManager.createResource(resourceManager.types.JAVASCRIPT, 999999, self.config.basePath + "/thywillLoadLast.js", js);
      setResourceAndContinue(resource, asyncCallback); 
    },
    // Load up bootstrap resources defined here and elsewhere (i.e. in 
    // applications) and stash them in an accessible array.
    function (asyncCallback) {
      self.getBootstrapResources(function(error, otherResources) {
        if (otherResources instanceof Array) {
          resources = resources.concat(otherResources);
        }
        asyncCallback.call(error);
      });
    },
    // Order the bootstrap resources by weight.
    function (asyncCallback) {
      async.sortBy(
        resources,
        function (resource, innerAsyncCallback) {
          innerAsyncCallback.call(self, null, resource.weight);
        },
        function (error, sortedResources) {
          resources = sortedResources;
          asyncCallback.call(self, error);
        }
      );
    },
    // If we are compressing and merging CSS/JS resources, then get to it.
    function (asyncCallback) {
      self.thywill.minify.minifyResources(resources, self.config.minifyJavascript, self.config.minifyCss, function(error, minifiedResources, addedResources) {
        // Replace the resource array with the new minified array.
        resources = minifiedResources;
        // Store any newly added resources, which should be the merged/minified
        // Javascript and CSS.
        async.forEach(
          addedResources,
          function (resource, innerAsyncCallback) {
            self.defineResource(resource, innerAsyncCallback);          
          },
          function (error) {
            asyncCallback.call(self, error);
          }
        );
      });
    },
    // Template the main thywill HTML page, adding the necessary CSS and 
    // Javascript resources.
    function (asyncCallback) {
      var mainPage = readFromFile("../../../../client/thywill.html");
      var jsElementTemplate = '<script type="text/javascript" src="<%= path %>"></script>\n  ';
      var cssElementTemplate = '@import url("<%= path %>");\n  ';

      // This Javascript resource is supplied by Socket.io. 
      // 
      // TODO: how best to get it running as a resource rather than this ad-hoc placement?
      //
      var js = '<script type="text/javascript" src="' + self.socketFactory.get('resource') + '/socket.io.js"></script>\n  ';
      var css= "";
      
      // Now set up the rest of the resources, typically from the applications.
      for (var i = 0, length = resources.length; i < length; i++) {
        if (resources[i].type == resourceManager.types.JAVASCRIPT) {
          js += ejs.render(jsElementTemplate, {
            locals: {path: resources[i].path}
          });
        } else if (resources[i].type == resourceManager.types.CSS) {
          css += ejs.render(cssElementTemplate, {
            locals: {path: resources[i].path}
          });
        }
      }
      
      // Create and store the rendered result.
      mainPage = ejs.render(mainPage, {
        locals: {js: js, css: css, encoding: self.config.encoding}
      });
      self.defineResource(resourceManager.createResource(resourceManager.types.HTML, 0, self.config.basePath + "/", mainPage), asyncCallback);
    },
  ];
  async.series(fns, callback);  
};

/**
 * @see Component#_prepareForShutdown
 */
p._prepareForShutdown = function (callback) {
  // Leave everything running to allow other components to do things as a part
  // of their graceful shutdown processes.
  callback.call(this);
};

//-----------------------------------------------------------
// Connection Methods
//-----------------------------------------------------------

/**
 * A new connection is made over Socket.IO, so sort out what needs to be done with it,
 * and set up its ability to send and receive. 
 * 
 * @param {Object} socket
 *   We are expecting a socket object with socket.handshake and 
 *   socket.handshake.session, where session is an Express session.
 */
p._initializeConnection = function (socket) {
  var self = this;
  
  /**
   * A message arrives and the raw data object from socket.io code is passed
   * in, which in 0.7 should look like:
   * 
   * {
   *   data:{
   *     applicationId: applicationId,
   *     data: myMessageData
   *   }
   * }
   * 
   * We just want the inner object data and target applicationId, if it is
   * present.
   */ 
  socket.on("messageFromClient", function (messageObj) { 
    if (messageObj && messageObj.data && messageObj.data.data) {
      self.receive(self.thywill.messageManager.createMessage(
        messageObj.data.data, 
        socket.id,
        messageObj.data.applicationId
      ));
    } else {
      self.thywill.log.debug("Empty or broken message received from session: " + socket.id);
    }
  });

  socket.on("disconnect", function () {
    self.disconnection(socket.id);
  });  
  
  // Socket.io connections will try to reconnect automatically if configured
  // to do so, and emit this event on successful reconnection.
  socket.on("reconnect", function () {    
    self.connection(socket.id); 
  });
  
  // Finally, tell applications that a new client has connected.
  self.connection(socket.id);  
};

/**
 * Handle a request from the server.
 * 
 * @param {Object} req
 *   Request object from the Express server.
 * @param {Object} res
 *   Response object from the Express server.
 */
p._handleResourceRequest = function (req, res) {
  var self = this;
  var requestData = urlHelpers.parse(req.url);
  
  
  // TODO: consider a caching layer to prevent this going to the resourceManager
  // every time - not that it matters for in-memory implementations, but it
  // will later.
 
  
  this.getResource(requestData.pathname, function (error, resource) {
    if (error) {
      self.thywill.log.error(error);
      res.statusCode = 500;
      res.end("Error on loading resource.");   
    } else if (resource) {
      // We have a resource, so send it to the client.
      var headers = {
        "Content-Type": resource.type,
        "Content-Length": resource.data.length
      };
      res.writeHead(200, headers);
      res.end(resource.data);
    } else {
      res.statusCode = 404;
      res.end("No such resource.");      
    } 
  });
};

/**
 * @see ClientInterface#send
 */
p.send = function (message) {
  var socketId = message.sessionId;

  if (message.isValid()) {
    var destinationSocket = this.socketFactory.of(this.config.namespace).socket(socketId);
    if (destinationSocket) {
      destinationSocket.emit("messageToClient", {data: message.data, applicationId: message.applicationId});
    } else {
      this.thywill.log.debug("SocketIO.send: invalid socketId: " + socketId + " for sessionId: " + message.sessionId);
    }
  }
};

//-----------------------------------------------------------
// Resource methods
//-----------------------------------------------------------

/**
 * @see ClientInterface#defineBootstrapResource
 */
p.defineBootstrapResource = function (resource, callback) {
  var self = this;
  this.defineResource(resource, function (error) {
   if (!error) {
     self.bootstrapResourcePaths.push(resource.path);
   } 
   callback.call(this, error);
  });
};

/**
 * @see ClientInterface#getBootstrapResources
 */
p.getBootstrapResources = function (callback) {
  var self = this;
  // This will pass each element of bootstrapResourcePaths into the 
  // function (path, asyncCallback). The 2nd arguments passed to asyncCallback
  // are assembled into an array to pass to the final callback - which will be
  // called as callback(error, [resource, resource...])
  async.concat(
   this.bootstrapResourcePaths,
   function (path, asyncCallback) {
     self.getResource(path, asyncCallback);
   },
   callback
  );
};

/**
 * @see ClientInterface#defineResource
 */
p.defineResource = function (resource, callback) {
  var self = this;
  this.thywill.resourceManager.store(resource.path, resource, function (error) {
    callback.call(this, error);
  });
};

/**
 * @see ClientInterface#getResource
 */
p.getResource = function (path, callback) {
  this.thywill.resourceManager.load(path, callback);
};

//-----------------------------------------------------------
// Session methods
//-----------------------------------------------------------

/**
 * @see ClientInterface#setSessionData
 */
p.setSessionData = function (sessionId, key, value, callback) {
  var socket = this.socketFactory.of(this.config.namespace).socket(socketId);
  if (socket) {
    socket.set(key, value, callback);
  } else {
    callback.call(this, "SocketIO.setSessionData: no socket with ID: " + socketId);
  }
};

/**
 * @see ClientInterface#getSessionData
 */
p.getSessionData = function (sessionId, key, callback) {
  var socket = this.socketFactory.of(this.config.namespace).socket(socketId);
  if (socket) {
    socket.get(key, callback);
  } else {
    callback.call(this, "SocketIO.getSessionData: no socket with ID: " + socketId);
  }
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = SocketIO;