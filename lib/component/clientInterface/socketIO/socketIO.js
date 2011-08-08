
var util = require("util");
var fs = require("fs");
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
  this.sessionStore = null;
  this.cookieName = "thywill.sid";
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

p._startup = function(callback) {
  var self = this; 
  
  var server = this.thywill.server;
  
  // configure the server object to use sessions. We're doing this to 
  // let socket.io code get access to the session store. See this for reference:
  // http://www.danielbaulig.de/socket-ioexpress/
  // http://senchalabs.github.com/connect/middleware-session.html
  this.sessionStore = new express.session.MemoryStore();
  server.configure(function () {
    server.use(express.cookieParser());
    server.use(express.session({
      store: this.sessionStore,
      secret: "thywillSecret", 
      key: self.cookieName
     }));
  });
  
  // set up Socket.IO on the server object
  this.socketFactory = io.listen(this.thywill.server); 
  this.socketFactory.of(this.config.namespace).on("connection", function(socket) { 
    self._initializeConnection(socket);
  });   
  
  // sort out the authorization/handshake. We're using this to connect express and socket.io
  // in a way that allows session information to be touched by both sides. The following 
  // block of code drops the session itself in socket.handshake that is available on connection.
  // See: http://www.danielbaulig.de/socket-ioexpress/
  this.socketFactory.set("authorization", function (data, accept) {
    if( data.headers.cookie ) {
      data.cookie = parseCookie(data.headers.cookie);
      data.sessionID = data.cookie[self.cookieName];
      // save the session store to the data object (as required by the Session constructor)
      data.sessionStore = self.sessionStore;
      data.sessionStore.get(data.sessionID, function (error, session) {
        if( error ) {
          accept(error.message, false);
        } else {
          // create a session object, passing data as request and our just acquired session data
          data.session = new Session(data, session);
          accept(null, true);
        }
      });
    } else {
      return accept("No cookie transmitted.", false);
    }
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
  
  var handshake = socket.handshake;
  
  // setup an inteval that will keep our session fresh
  var intervalID = setInterval(function () {
    // reload the session (just in case something changed,
    // we don't want to override anything, but the age)
    // reloading will also ensure we keep an up to date copy
    // of the session with our connection.
    handshake.session.reload( function () { 
      // "touch" it (resetting maxAge and lastAccess)
      // and save it back again.
      handshake.session.touch().save(function(error) {});
    });
  }, 60 * 1000); // TODO make the timeout interval a config parameter
  
  // set up client data for the new connection, if one is not already present.
  if( handshake.session && !handshake.session.client ) {
    handshake.session.client = new Client();
    handshake.session.save(function(error) {});
  }
  
  /*
   * Set up the necessary responses to socket events.
   * 
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
        socket.handshake.session.client.id,
        messageObj.data.applicationId
      ));
    } else {
      self.thywill.log.debug("Empty or broken message received from client: " + socket.client.id);
    }
  });
  
  socket.on("disconnect", function() {
    // clear out the interval set up earlier to stop it repeating.
    clearInterval(intervalID);
    self.disconnection(handshake.session.client.id);
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

p.send = function(message) {
  if( message.isValid() ) {
    var destinationSocket = this.socketFactory.sockets.socket(message.clientId);
    if( destinationSocket ) {
      destinationSocket.emit("messageToClient", {data: message.data, applicationId: message.applicationId});
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