
var util = require("util");
var fs = require("fs");
var urlHelpers = require("url");
var pathHelpers = require("path");

var async = require("async");
var io = require("socket.io");

var ClientInterface = require("../clientInterface");
var Client = require("../client");
var Message = require("../message");
var Resource = require("../resource");
var Component = require("../../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function SocketIO() {
  SocketIO.super_.call(this);
  this.socketFactory = null;
  this.bootstrapResourcePaths = [];
};
util.inherits(SocketIO, ClientInterface);
var p = SocketIO.prototype;

//-----------------------------------------------------------
// Initialization and Shutdown
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
  this._announceReady(Component.NO_ERRORS);
};

p._startup = function(callback) {
  
  // set up Socket.IO on the server object
  this.socketFactory = io.listen(this.thywill.server); 
  this.socketFactory.of(config.namespace).on("connection", function(socket) { 
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
      serverInterface = self.thywill.template.render(serverInterface, { namespace: config.namespace });
      data += "\n\n" + serverInterface;
      self.defineResource(new Resource(Resource.TYPE_JAVASCRIPT, self.config.basePath + "/thywill.js", data), asyncCallback);
    },
    function(asyncCallback) {
      var filepath = pathHelpers.resolve(__dirname, "../../../client/jquery.js");
      var data = fs.readFileSync(filepath, self.config.encoding);
      self.defineResource(new Resource(Resource.TYPE_JAVASCRIPT, self.config.basePath + "/jquery.js", data), asyncCallback);
    },
    function(asyncCallback) {
      // load up the other bootstrap resources defined elsewhere and pass them on to the
      // next waterfall function in line.
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
 * and set up its ability to send and receive.
 */
p._initializeConnection = function(socket) {
  var self = this;
  
  // set up client data for the new connection.
  socket.client = new Client();
  
  // set up the necessary responses to socket events
  socket.on("message", function(encodedMessage) {
    var message = new Message(encodedMessage);
    self.receive(message, socket.client.id);
  });
  socket.on("disconnect", function() {
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

p.send = function(message, clientId) {
  if( this.socketFactory.sockets.socket(clientId) ) {
    this.socketFactory.sockets.socket(clientId).send(message.encode());
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