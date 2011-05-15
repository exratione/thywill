
var util = require("util");
var fs = require("fs");
var urlHelpers = require("url");
var pathHelpers = require("path");

var async = require("async");
var io = require("socket.io");

var ClientInterface = require("../clientInterface");
var Client = require("../client");
var Message = require("../message");
var Resource = require("../../resources/resource");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function SocketIO() {
  SocketIO.super_.call(this);
  this.sockets = {};
  this.socketFactory = null;
  this.serverListeners = [];
};
util.inherits(SocketIO, ClientInterface);
var p = SocketIO.prototype;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

/*
 * The clientInterface component is the last to be configured, so it has access to 
 * fully configured instances of all the other components and their data.
 */
p._configure = function(config, callback) {
  var self = this;
  this.config = config; 
  this.readyCallback = callback;
 
  // intercept and respond to all server requests - replace all listeners with
  // our own function, but keep track of them so they can be called by our listener.
  var server = this.factory.server;
  this.serverListeners = server.listeners('request');
  server.removeAllListeners('request');
  server.on('request', function (req, res) {
    self._handleRequest(req, res);
  });
  
  
  // TODO do I need to handle other server events, e.g. upgrade
  
  
  // set up Socket.IO on the server object
  this.socketFactory = io.listen(this.factory.server); 
  this.socketFactory.on('connection', function(socket) { 
    self._initializeConnection(socket);
  });   
  
  // set up resources for the main thywill page and its Javascript.
  // 
  // waterfall passes the 2nd and later parameters passed to asyncCallback
  // as arguments prior to the asyncCallback to the next function in line
  var fns = [
    function(asyncCallback) {
      self.factory.resources.getBootstrapResources(asyncCallback);
    },
    function(resources, asyncCallback) {
      
      // Load and template the main thywill HTML page, with calls to CSS and Javascript resources
      
      var filepath = pathHelpers.resolve(__dirname, "../../../client/thywill.html");
      var data = new String(fs.readFileSync(filepath));

      var jsElementTemplate = '\n<script type="text/javascript" src="<%= path %>"></script>';
      var cssElementTemplate = '\n@import url("<%= path %>");';
        
      var js = "";
      var css= "";
      for( var i = 0, length = resources.length; i < length; i++ ) {
        if( resources[i].type == Resource.TYPE_JAVASCRIPT ) {
          elements += self.factory.template.render(jsElementTemplate, { path: resources[i].path });
        } else if( resources[i].type == Resource.TYPE_HTML ) {
          elements += self.factory.template.render(cssElementTemplate, { path: resources[i].path });
        }
      }
      data = self.factory.template.render(data, { js: js, css: css });
      self.factory.resources.defineBootstrapResource(new Resource(Resource.TYPE_HTML, self.config.basePath + "/index.html", data), asyncCallback);
    },
    function(asyncCallback) {
      var filepath = pathHelpers.resolve(__dirname, "../../../client/thywill.js");
      var data = new String(fs.readFileSync(filepath));
      self.factory.resources.defineBootstrapResource(new Resource(Resource.TYPE_JAVASCRIPT, self.config.basePath + "/thywill.js", data), asyncCallback);
    },
  ];
  async.waterfall(fns, function(error) {
    self._announceReady(error);
  });
  
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/*
 * A new connection is made over Socket.IO, so sort out what needs to be done with it,
 * and set up its ability to send and receive.
 */
p._initializeConnection = function(socket) {
  var self = this;
  
  // set up client data for the new connection.
  socket.client = new Client();
  this.sockets[socket.client.id] = socket;
  
  // set up the necessary responses to socket events
  socket.on('message', function(encodedMessage) {
    var message = new Message(encodedMessage);
    self.receive(message, socket.client.id);
  });
  socket.on('disconnect', function() {
    delete self.sockets[socket.client.id];
    self.disconnection(socket.client.id);
  });  
};

/*
 * Handle a request from the server.
 */
p._handleRequest = function(req, res) {
  var self = this;
  var requestData = urlHelpers.parse(req.url);
  
  this.factory.resources.getResource(requestData.pathname, function(error, resource) {
    if( error ) {
      self.factory.log.error(error);
    } else if( resource ) {
      // we have a resource, so send it to the client.
      var headers = {
        'Content-Type': resource.type,
        'Content-Length': resource.data.length
      };
      res.writeHead(200, headers);
      res.end(resource.data);
    } else {
      // No resource for this path, so pass the request on to the other listeners 
      // that were earlier removed from the server.
      for (var i = 0, length = self.serverListeners.length; i < length; i++) {
        self.serverListeners[i].call(self, req, res);
      }
    } 
  });
};

p.send = function(message, clientId) {
  if( this.sockets[clientId] ) {
    this.sockets[clientId].send(message.encode());
  }
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = SocketIO;