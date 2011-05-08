
var util = require("util");
var ClientInterface = require("../clientInterface");
var Client = require("../client");
var Message = require("../message");
var io = require('socket.io');

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function SocketIO() {
  SocketIO.super_.call(this);
  this.componentType = "socketIO";
  this.sockets = {};
  this.socketFactory = null;
};
util.inherits(SocketIO, ClientInterface);
var p = SocketIO.prototype;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

p._configure = function(config, callback) {

  this.config = config; 
  this.readyCallback = callback;
  
  
  
  
  // TODO: set up server to serve the client HTML pages
  
  // NEED: generic thywill html/js + separate socket.io stuff
  
  
  
  // set up Socket.IO on the server object
  var self = this;
  this.socketFactory = io.listen(this.factory.server); 
  this.socketFactory.on('connection', function(socket) { 
    self._initializeConnection(socket);
  });   
  
  // There are no asynchronous initialization functions here or in the superclasses.
  // So we can just call them and forge ahead without having to wait around or check
  // for completion.
  this.ready = true;
  this._announceReady();
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

p.send = function(message, clientId) {
  if( this.sockets[clientId] ) {
    this.sockets[clientId].send(message.encode());
  }
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = SocketIO;