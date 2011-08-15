
var util = require("util");
var fs = require("fs");
var crypto = require("crypto");
var urlHelpers = require("url");
var pathHelpers = require("path");

var express = require("express");
var async = require("async");
var io = require("socket.io");

var parseCookie = require('connect').utils.parseCookie;
var Session = require('connect').middleware.session.Session;

var ClientInterface = require("../clientInterface");
var Client = require("../client");
var Message = require("../message");
var Resource = require("../resource");
var Component = require("../../component");

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
 *   "namespace": "/thywillNamespace"
 * }
 */
p._configure = function(thywill, config, callback) {
  var self = this;
  this.thywill = thywill;
  this.config = config; 
  this.readyCallback = callback;
  this._announceReady(Component.NO_ERRORS);
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
      var filepath = pathHelpers.resolve(__dirname, "../../../client/thywill.js");
      var data = fs.readFileSync(filepath, self.config.encoding);
      filepath = pathHelpers.resolve(__dirname, "./serverInterface.js");
      var serverInterface = fs.readFileSync(filepath, self.config.encoding);
      // this one needs minor templating:
      serverInterface = self.thywill.template.render(serverInterface, { namespace: self.config.namespace });
      data += "\n\n" + serverInterface;
      self.defineResource(new Resource(Resource.TYPE_JAVASCRIPT, self.config.basePath + "/thywill.js", data), asyncCallback);
    },
    function(asyncCallback) {
      // this one needs to be loaded after all other javascript resources
      var filepath = pathHelpers.resolve(__dirname, "../../../client/thywillLoadLast.js");
      var data = fs.readFileSync(filepath, self.config.encoding);
      self.defineResource(new Resource(Resource.TYPE_JAVASCRIPT, self.config.basePath + "/thywillLoadLast.js", data), asyncCallback);      
    },
    function(asyncCallback) {
      // defining the standard jquery resource
      var filepath = pathHelpers.resolve(__dirname, "../../../client/jquery.js");
      var data = fs.readFileSync(filepath, self.config.encoding);
      self.defineResource(new Resource(Resource.TYPE_JAVASCRIPT, self.config.basePath + "/jquery.js", data), asyncCallback);
    },
    function(asyncCallback) {
      // load up the other bootstrap resources defined elsewhere and pass them on to the next waterfall function in line.
      self.getBootstrapResources(asyncCallback);
    },
    function(resources, asyncCallback) {
      
      // Load and template the main thywill HTML page, with calls to the necessary CSS and Javascript resources
      
      var filepath = pathHelpers.resolve(__dirname, "../../../client/thywill.html");
      var data = fs.readFileSync(filepath, self.config.encoding);

      var jsElementTemplate = '<script type="text/javascript" src="<%= path %>"></script>\n  ';
      var cssElementTemplate = '@import url("<%= path %>");\n  ';
      
      // these Javascript resources have to be first in line, in this order.
      var js = '<script type="text/javascript" src="' + self.config.basePath + '/jquery.js"></script>\n  ';
      js += '<script type="text/javascript" src="/socket.io/socket.io.js"></script>\n  ';
      js += '<script type="text/javascript" src="' + self.config.basePath + '/thywill.js"></script>\n  ';
      
      // now load the rest of the resources, typically from the applications
      var css= "";
      for( var i = 0, length = resources.length; i < length; i++ ) {
        if( resources[i].type == Resource.TYPE_JAVASCRIPT ) {
          js += self.thywill.template.render(jsElementTemplate, { path: resources[i].path });
        } else if( resources[i].type == Resource.TYPE_CSS ) {
          css += self.thywill.template.render(cssElementTemplate, { path: resources[i].path });
        }
      }
      
      js += '<script type="text/javascript" src="' + self.config.basePath + '/thywillLoadLast.js"></script>\n  ';
      
      // and store the rendered result
      data = self.thywill.template.render(data, { js: js, css: css, encoding: self.config.encoding });
      self.defineResource(new Resource(Resource.TYPE_HTML, self.config.basePath + "/", data), asyncCallback);
    },
  ];
  async.waterfall(fns, callback);  
};

p._prepareForShutdown = function(callback) {
  // leave everything running to allow other components to do things as a part of their graceful shutdown processes
  callback.call(this);
};

//-----------------------------------------------------------
// Methods
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
      if( !socket.client ) {
        self.thywill.log.debug("Message received before client ID set:" + messageObj);
      } else {
        self.receive(new Message(
          messageObj.data.data, 
          socket.client.id,
          messageObj.data.applicationId
        ));
      }
    } else {
      self.thywill.log.debug("Empty or broken message received from client: " + socket.client.id);
    }
  });
  
  /*
   * The start of client ID negotiation from the client. Either accept what is sent, or force a new ID.
   * 
   * declaredClientId - an encrypted ID passed from the client.
   */
  socket.on("idDeclarationFromClient", function(declaredClientId) {
    var updateClientWithNewId = true;
    if( declaredClientId ) {
      
      // decrypt:
      var decipher = crypto.createDecipher("aes-256-cbc", self.config.encryption.key);
      var clientId = decipher.update(declaredClientId, "hex", "utf8") + decipher.final("utf8");
      
      // does it match a GUID? If it does, treat it as valid.
      if( Client.isValidClientId(clientId) ) {
        socket.client = new Client();
        socket.client.id = clientId;
        updateClientWithNewId = false;
        self.thywill.log.debug("Client connected with valid ID: " + socket.client.id);
      } else {
        // not valid, so create a new one
        socket.client = new Client();
        self.thywill.log.debug("Client connected with invalid ID, creating new ID: " + socket.client.id);
      }
    } else {
      // no ID, so create one
      socket.client = new Client();
      self.thywill.log.debug("Client connected without ID, creating new ID: " + socket.client.id);
    }
    
    if( updateClientWithNewId ) {
      // and pass the state of affairs back down to the client
      var cipher = crypto.createCipher("aes-256-cbc", self.config.encryption.key);
      var encryptedClientId = cipher.update(socket.client.id, "utf8", "hex") + cipher.final("hex");
      socket.emit("updateClientId", encryptedClientId);
    }
    
    // and sort out local mapping of Ids
    self._mapClientIdToSocketId(socket.client.id, socket.id);
    
    // and tell applications that a new client has connected 
    self.connection(socket.client);
    
  });
  
  socket.on("disconnect", function() {
    // clear out the interval set up earlier to stop it repeating.
    self.disconnection(socket.client.id);
  });  
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

/*
 * Map a clientId to a socketId.
 * 
 * TODO: needs scaling - this is too crude
 * 
 */
p._mapClientIdToSocketId = function(clientId, socketId) {
  if( !this.clientIdToSocketIdMap ) {
    this.clientIdToSocketIdMap = {};
  }
  this.clientIdToSocketIdMap[clientId] = socketId;
};

/*
 * Given a clientId, get the socketId.
 * 
 * TODO: needs scaling - this is too crude
 * 
 */
p._getSocketId = function(clientId) {
  return this.clientIdToSocketIdMap[clientId];
};


p.send = function(message) {
  var socketId = this._getSocketId(message.clientId);
  
  if( message.isValid() ) {
    var destinationSocket = this.socketFactory.of(this.config.namespace).socket(socketId);
    if( destinationSocket ) {
      destinationSocket.emit("messageToClient", {data: message.data, applicationId: message.applicationId});
    } else {
      this.thywill.log.debug("SocketIO.send: invalid socketId: " + socketId + " for clientId: " + message.clientId);
    }
  }
};

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
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = SocketIO;