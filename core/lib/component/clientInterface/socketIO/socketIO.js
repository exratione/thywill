/**
 * @fileOverview
 * Class definition for the SocketIO-based clientInterface implementation.
 */

var util = require("util");
var fs = require("fs");
var crypto = require("crypto");
var urlHelpers = require("url");
var pathHelpers = require("path");

var express = require("express");
var async = require("async");
var ejs = require("ejs");
var io = require("socket.io");

var ClientInterface = require("../clientInterface");
var Message = require("../message");
var Resource = require("../resource");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A web browser client interface built on top of socket.io: see 
 * http://socket.io/ for details.
 */
function SocketIO() {
  SocketIO.super_.call(this);
  this.socketFactory = null;
  this.bootstrapResourcePaths = [];
};
util.inherits(SocketIO, ClientInterface);
var p = SocketIO.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

SocketIO.CONFIG_TEMPLATE = {
  encoding: {
    _configInfo: {
       description: "The content encoding for text and web pages.",
       types: "string",
       required: true
     } 
  },
  basePath: {
    _configInfo: {
       description: "The base path for all thywill URLs with a leading but no trailing slash. e.g. '/thywill'.",
       types: "string",
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
  encryption: {
    key: {
      _configInfo: {
        description: "An encryption key.",
        types: "string",
        required: true
      } 
    }
  },
  socketConfig: {
    _configInfo: {
      description: "Container object for environment-specific Socket.IO configuration objects.",
      types: "object",
      required: false
    }     
  },
  clientConfig: {
    _configInfo: {
      description: "Container object for Socket.IO client configuration parameters.",
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
 *   "encoding": "utf-8",
 *   "basePath": "/thywill",
 *   "namespace": "/thywillNamespace",
 *   "socketConfig": {
 *      "environmentName" | "global": {
 *        any socket.io configuration parameters - e.g. "log level": 3
 *      }, 
 *      
 *      ...
 *      
 *      other socket.io environment configurations, if necessary
 *   }
 * }
 * 
 * If "global" is specified for any of the socket.io environments, the other 
 * declarations will be ignored and the global one applied.
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
  var clientConfig = this.config.clientConfig;
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
  
  // Now, the various static resource URLs encoded in Socket.IO 
  // (e.g. /socket.io.js) are not so helpful - we want them to be prefixed by
  // the resource setting path. Unfortunately they're fairly hardcoded.
  
  
  
  
  
  
  // Tell socket what to do when a connection starts - this will kick off the
  // necessary setup for an ongoing connection with a client.
  this.socketFactory.of(this.config.namespace).on("connection", function (socket) { 
    self._initializeConnection(socket);
  });   
  
  // Set up resources needed for the main Thywill page.
  // 
  // This is executed via async.waterfall(), which passes the 2nd and later
  // parameters of asyncCallback as arguments to the next function in line.
  var fns = [
    // Load client-side Javascript resources and merge into a single resource.        
    function (asyncCallback) {
      var filepath = pathHelpers.resolve(__dirname, "../../../../client/thywill.js");
      var js = fs.readFileSync(filepath, self.config.encoding);
      filepath = pathHelpers.resolve(__dirname, "../../../../client/component/clientInterface/socketIO/serverInterface.js");
      var serverInterfaceJs = fs.readFileSync(filepath, self.config.encoding);
      // This one needs minor templating to add in Socket.io client
      // configuration values. Use EJS rather than the configured templating
      // engine for this core file, so that we are certain the templating
      // will work as expected.
      var templateParams = {
        namespace: self.config.namespace
      };
      if (clientConfig) {
        templateParams.config = JSON.stringify(clientConfig);
      } 
      serverInterfaceJs = ejs.render(serverInterfaceJs, {locals: templateParams});
      js += "\n\n" + serverInterfaceJs;
      self.defineBootstrapResource(new Resource(Resource.TYPE_JAVASCRIPT, 0, self.config.basePath + "/thywill.js", js), asyncCallback);
    },
    // Define a Javascript resource that needs to be loaded after all other
    // Javascript resources.
    function (asyncCallback) {
      var filepath = pathHelpers.resolve(__dirname, "../../../../client/thywillLoadLast.js");
      var data = fs.readFileSync(filepath, self.config.encoding);
      self.defineBootstrapResource(new Resource(Resource.TYPE_JAVASCRIPT, 99999, self.config.basePath + "/thywillLoadLast.js", data), asyncCallback);      
    },
    // Load up other bootstrap resources defined elsewhere (i.e. in
    // applications) and pass them on to the next waterfall function in line.
    function (asyncCallback) {
      self.getBootstrapResources(asyncCallback);
    },
    // Order the bootstrap resources by weight.
    function (resources, asyncCallback) {
      async.sortBy(
          resources,
          function (resource, innerAsyncCallback) {
            innerAsyncCallback.call(self, null, resource.weight);
          },
          function (error, sortedResources) {
            asyncCallback.call(self, error, sortedResources);
          }
      );
    },
    // Load and template the main thywill HTML page, with calls to the
    // necessary CSS and Javascript resources.
    function (resources, asyncCallback) {
      var filepath = pathHelpers.resolve(__dirname, "../../../../client/thywill.html");
      var mainPage = fs.readFileSync(filepath, self.config.encoding);

      var jsElementTemplate = '<script type="text/javascript" src="<%= path %>"></script>\n  ';
      var cssElementTemplate = '@import url("<%= path %>");\n  ';

      // This Javascript resource has to be first in line, as it is supplied
      // by Socket.io.
      var js = '<script type="text/javascript" src="' + self.socketFactory.get('resource') + '/socket.io.js"></script>\n  ';
      var css= "";
      
      // Now set up the rest of the resources, typically from the applications.
      for (var i = 0, length = resources.length; i < length; i++) {
        if (resources[i].type == Resource.TYPE_JAVASCRIPT) {
          js += ejs.render(jsElementTemplate, {
            locals: {path: resources[i].path}
          });
        } else if (resources[i].type == Resource.TYPE_CSS) {
          css += ejs.render(cssElementTemplate, {
            locals: {path: resources[i].path}
          });
        }
      }
      
      // Create and store the rendered result.
      mainPage = ejs.render(mainPage, {
        locals: {js: js, css: css, encoding: self.config.encoding}
      });
      self.defineResource(new Resource(Resource.TYPE_HTML, 0, self.config.basePath + "/", mainPage), asyncCallback);
    },
  ];
  async.waterfall(fns, callback);  
};

/**
 * Called when the application will be shutdown: do everything that needs to be
 * done, and call the callback function ONLY WHEN EVERYTHING YOU NEED TO DO 
 * IS COMPLETE.
 * 
 * @param {Function} callback
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
      self.receive(new Message(
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
 * Send a message out to a particular client.
 * 
 * @param {Message} message
 *   A Message instance.
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
   if( !error ) {
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
  // called as callback(error, [resource, resource...]
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
  this.thywill.datastore.store(resource.path, resource, function (error) {
    callback.call(this, error);
  });
};

/**
 * @see ClientInterface#getResource
 */
p.getResource = function (path, callback) {
  this.thywill.datastore.load(path, callback);
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