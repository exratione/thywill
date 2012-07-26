
var util = require("util");
var fs = require("fs");
var crypto = require("crypto");
var urlHelpers = require("url");
var pathHelpers = require("path");

var express = require("express");
var async = require("async");
var io = require("socket.io");

var ClientInterface = require("../clientInterface");
var Message = require("../message");
var Resource = require("../resource");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * A web browser client interface built on top of socket.io: see http://socket.io/ for details.
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
  }
};

//-----------------------------------------------------------
// Initialization and Shutdown
//-----------------------------------------------------------

/*
 * The clientInterface component is the last to be configured, so it has access to 
 * fully configured instances of all the other components and their data.
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
 * If "global" is specified for any of the socket.io environments, the other declarations will be 
 * ignored and the global one applied.
 * 
 */
p._configure = function(thywill, config, callback) {
  var self = this;
  this.thywill = thywill;
  this.config = config; 
  this.readyCallback = callback;
  this._announceReady(this.NO_ERRORS);
};

/*
 * Start the client interface running, in this case by setting up various resources 
 * and URLs on the Express server and initializing socketIO.
 */
p._startup = function(callback) {
  var self = this; 
  var server = this.thywill.server;
 
  // set up Socket.IO on the server object
  this.socketFactory = io.listen(this.thywill.server); 
  
  var socketConfig = this.config.socketConfig;
  if( socketConfig ) {
    if( socketConfig.global && socketConfig.global instanceof Object ) {
      
      // there's a global configuration set, so use it.
      
      this.socketFactory.configure(function() {
        for( property in socketConfig.global ) {
          self.socketFactory.set(property, socketConfig.global[property]);
        }             
      });
    } else {
      
      // we walk through the async series below applying whatever environment-specific Socket.IO 
      // configurations are provided in the configuration object.
      
      var properties = [];
      for( var property in socketConfig ){
        properties.push(property);
      }
      
      async.forEachSeries(
          properties, 
          function(environmentName) {
            var environmentConfig = socketConfig[environmentName];
            if( environmentConfig && environmentConfig instanceof Object ) {
              self.socketFactory.configure(environmentName, function() {
                for( property in environmentConfig ) { 
                  self.socketFactory.set(property, environmentConfig[property]);
                }     
              }); 
            }
          },
          function(error) { } // we don't much care about this callback or when the series completes.
      );  
    }
  }
  
  this.socketFactory.of(this.config.namespace).on("connection", function(socket) { 
    self._initializeConnection(socket);
  });   
  
  // set up resources for the main thywill page and its Javascript.
  // 
  // waterfall passes the 2nd and later parameters passed to asyncCallback
  // as arguments prior to the asyncCallback to the next function in line
  var fns = [
    function(asyncCallback) {
      // move some of the distinct client-side Javascript into a single resource.
      var filepath = pathHelpers.resolve(__dirname, "../../../../client/thywill.js");
      var data = fs.readFileSync(filepath, self.config.encoding);
      filepath = pathHelpers.resolve(__dirname, "../../../../client/component/clientInterface/socketIO/serverInterface.js");
      var serverInterface = fs.readFileSync(filepath, self.config.encoding);
      // this one needs minor templating:
      serverInterface = self.thywill.template.render(serverInterface, { namespace: self.config.namespace });
      data += "\n\n" + serverInterface;
      self.defineBootstrapResource(new Resource(Resource.TYPE_JAVASCRIPT, 0, self.config.basePath + "/thywill.js", data), asyncCallback);
    },
    function(asyncCallback) {
      // this one needs to be loaded after all other javascript resources
      var filepath = pathHelpers.resolve(__dirname, "../../../../client/thywillLoadLast.js");
      var data = fs.readFileSync(filepath, self.config.encoding);
      self.defineBootstrapResource(new Resource(Resource.TYPE_JAVASCRIPT, 99999, self.config.basePath + "/thywillLoadLast.js", data), asyncCallback);      
    },
    function(asyncCallback) {
      // load up the other bootstrap resources defined elsewhere and pass them on to the next waterfall function in line.
      self.getBootstrapResources(asyncCallback);
    },
    function(resources, asyncCallback) {
      // order the bootstrap resources by weight
      async.sortBy(
          resources,
          function(resource, innerAsyncCallback) {
            innerAsyncCallback.call(self, null, resource.weight);
          },
          function(error, sortedResources) {
            asyncCallback.call(self, error, sortedResources);
          }
      );
    },
    function(resources, asyncCallback) {

      // Load and template the main thywill HTML page, with calls to the necessary CSS and Javascript resources
      
      var filepath = pathHelpers.resolve(__dirname, "../../../../client/thywill.html");
      var data = fs.readFileSync(filepath, self.config.encoding);

      var jsElementTemplate = '<script type="text/javascript" src="<%= path %>"></script>\n  ';
      var cssElementTemplate = '@import url("<%= path %>");\n  ';

      // this Javascript resource has to be first in line, as it's supplied by Socket.io.
      var js = '<script type="text/javascript" src="/socket.io/socket.io.js"></script>\n  ';
      
      // now load the rest of the resources, typically from the applications
      var css= "";
      for( var i = 0, length = resources.length; i < length; i++ ) {
        if( resources[i].type == Resource.TYPE_JAVASCRIPT ) {
          js += self.thywill.template.render(jsElementTemplate, { path: resources[i].path });
        } else if( resources[i].type == Resource.TYPE_CSS ) {
          css += self.thywill.template.render(cssElementTemplate, { path: resources[i].path });
        }
      }
      
      // and store the rendered result
      data = self.thywill.template.render(data, { js: js, css: css, encoding: self.config.encoding });
      self.defineResource(new Resource(Resource.TYPE_HTML, 0, self.config.basePath + "/", data), asyncCallback);
    },
  ];
  async.waterfall(fns, callback);  
};

p._prepareForShutdown = function(callback) {
  // leave everything running to allow other components to do things as a part of their graceful shutdown processes
  callback.call(this);
};

//-----------------------------------------------------------
// Connection Methods
//-----------------------------------------------------------

/*
 * A new connection is made over Socket.IO, so sort out what needs to be done with it,
 * and set up its ability to send and receive. We are expecting a socket object with
 * socket.handshake and socket.handshake.session, where session is an Express session.
 */
p._initializeConnection = function(socket) {
  var self = this;
  
  /*
   * Set up the necessary responses to socket events.
   */
  
  /*
   * messageObj - the raw data object from socket.io code, which in 0.7 should look like:
   * 
   * {
   *   data:{
   *     applicationId: applicationId,
   *     data: myMessageData
   *   }
   * }
   * 
   * We just want the inner object data and target applicationId, if it is present.
   * 
   */ 
  socket.on("messageFromClient", function(messageObj) { 
    
    if( messageObj && messageObj.data && messageObj.data.data ) {
      self.receive(new Message(
        messageObj.data.data, 
        socket.id,
        messageObj.data.applicationId
      ));
    } else {
      self.thywill.log.debug("Empty or broken message received from session: " + socket.id);
    }
  });

  socket.on("disconnect", function() {
    self.disconnection(socket.id);
  });  
  
  // socket.io connections will try to reconnect automatically if configured to do so, 
  // and emit this event on successful reconnectinn.
  socket.on("reconnect", function() {    
    self.connection(socket.id); 
  });
  
  // finally tell applications that a new client has connected 
  self.connection(socket.id);  
  
};

/*
 * Handle a request from the server.
 */
p._handleResourceRequest = function(req, res) {
  var self = this;
  var requestData = urlHelpers.parse(req.url);
 
  this.getResource(requestData.pathname, function(error, resource) {
    if( error ) {
      self.thywill.log.error(error);
      res.statusCode = 500;
      res.end("Error on loading resource.");   
    } else if( resource ) {
      // we have a resource, so send it to the client.
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


p.send = function(message) {
  var socketId = message.sessionId;
  
  if( message.isValid() ) {
    var destinationSocket = this.socketFactory.of(this.config.namespace).socket(socketId);
    if( destinationSocket ) {
      destinationSocket.emit("messageToClient", {data: message.data, applicationId: message.applicationId});
    } else {
      this.thywill.log.debug("SocketIO.send: invalid socketId: " + socketId + " for sessionId: " + message.sessionId);
    }
  }
};

//-----------------------------------------------------------
// Resource methods
//-----------------------------------------------------------


p.defineBootstrapResource = function(resource, callback) {
  var self = this;
  this.defineResource(resource, function(error) {
   if( !error ) {
     self.bootstrapResourcePaths.push(resource.path);
   } 
   callback.call(this, error);
  });
};

p.getBootstrapResources = function(callback) {
  var self = this;
  // this will pass each element of bootstrapResourcePaths into the 
  // function(path, asyncCallback). The 2nd arguments passed to asyncCallback
  // are assembled into an array to pass to the final callback - which will be
  // called as callback(error, [resource, resource...]
  async.concat(
   this.bootstrapResourcePaths,
   function(path, asyncCallback) {
     self.getResource(path, asyncCallback);
   },
   callback
  );
};

p.defineResource = function(resource, callback) {
  var self = this;
  this.thywill.datastore.store(resource.path, resource, function(error) {
    if( !error ) {
      // make sure that the Express server knows about the resource and can fetch it
      self.thywill.server.get(resource.path, function(req, res) {
        self._handleResourceRequest(req, res);
      });
    }
    callback.call(this, error);
  });
};

p.getResource = function(path, callback) {
  this.thywill.datastore.load(path, callback);
};

//-----------------------------------------------------------
// Session methods
//-----------------------------------------------------------
 
p.setSessionData = function(sessionId, key, value, callback) {
  var socket = this.socketFactory.of(this.config.namespace).socket(socketId);
  if( socket ) {
    socket.set(key, value, callback);
  } else {
    callback.call(this, "SocketIO.setSessionData: no socket with ID: " + socketId);
  }
};

p.getSessionData = function(sessionId, key, callback) {
  var socket = this.socketFactory.of(this.config.namespace).socket(socketId);
  if( socket ) {
    socket.get(key, callback);
  } else {
    callback.call(this, "SocketIO.getSessionData: no socket with ID: " + socketId);
  }
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = SocketIO;