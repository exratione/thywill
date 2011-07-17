
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
p._configure = function(thywill, config, callback) {
  var self = this;
  this.thywill = thywill;
  this.config = config; 
  this.readyCallback = callback;
 
  // intercept and respond to all server requests - replace all listeners with
  // our own function, but keep track of them so they can be called by our listener.
  this.serverListeners = this.thywill.server.listeners("request");
  this.thywill.server.removeAllListeners("request");
  this.thywill.server.on("request", function (req, res) {
    self._handleRequest(req, res);
  });
  
  // set up Socket.IO on the server object
  this.socketFactory = io.listen(this.thywill.server); 
  this.socketFactory.on("connection", function(socket) { 
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
      data += "\n\n" + fs.readFileSync(filepath, self.config.encoding);
      self.thywill.resources.defineResource(new Resource(Resource.TYPE_JAVASCRIPT, self.config.basePath + "/thywill.js", data), asyncCallback);
    },
    function(asyncCallback) {
      var filepath = pathHelpers.resolve(__dirname, "../../../client/jquery.js");
      var data = fs.readFileSync(filepath, self.config.encoding);
      self.thywill.resources.defineResource(new Resource(Resource.TYPE_JAVASCRIPT, self.config.basePath + "/jquery.js", data), asyncCallback);
    },
    function(asyncCallback) {
      // load up the other bootstrap resources defined elsewhere and pass them on to the
      // next waterfall function in line.
      self.thywill.resources.getBootstrapResources(asyncCallback);
    },
    function(resources, asyncCallback) {
      
      // Load and template the main thywill HTML page, with calls to the necessary CSS and Javascript resources
      
      var filepath = pathHelpers.resolve(__dirname, "../../../client/thywill.html");
      var data = fs.readFileSync(filepath, self.config.encoding);

      var jsElementTemplate = '<script type="text/javascript" src="<%= path %>"></script>\n  ';
      var cssElementTemplate = '@import url("<%= path %>");\n  ';
      
      // these Javascript resources have to be first in line, in this order.
      var js = '<script type="text/javascript" src="' + self.config.basePath + '/jquery.js"></script>\n  ';
      js += '<script type="text/javascript" src="/socket/socket.io.js"></script>\n  ';
      js += '<script type="text/javascript" src="' + self.config.basePath + '/thywill.js"></script>\n  ';

      // now load the rest of the resources
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
      self.thywill.resources.defineResource(new Resource(Resource.TYPE_HTML, self.config.basePath + "/", data), asyncCallback);
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
  socket.on("message", function(encodedMessage) {
    var message = new Message(encodedMessage);
    self.receive(message, socket.client.id);
  });
  socket.on("disconnect", function() {
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
  
  this.thywill.resources.getResource(requestData.pathname, function(error, resource) {
    if( error ) {
      self.thywill.log.error(error);
    } 
    
    if( resource ) {
      // we have a resource, so send it to the client.
      var headers = {
        "Content-Type": resource.type,
        "Content-Length": resource.data.length
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