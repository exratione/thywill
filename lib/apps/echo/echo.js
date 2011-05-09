var Application = require("../application");
var Message = require("../../component/clientInterface/message");
var util = require("util");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * A trivial application example. This does nothing but provide a UI to enter messages, 
 * and echo back all received messages with the same content.
 */
function Echo(id) {
  Application.super_.call(this, id);
};
util.inherits(Echo, Application);
var p = Echo.prototype;

//-----------------------------------------------------------
// Methods 
//-----------------------------------------------------------

/*
 * Called when the application is first registered with thywill.js, as an 
 * opportunity to assemble and cache resources.
 */
p.initializeClientResources = function(callback) {

  
  
};

p.receive = function(message, clientId) {
  // Echo back the content of received messages.
  var echoMessage = new Message(message.data, this.id);
  this.send(echoMessage, clientId);
};

p.connection = function(client) {
  // do nothing
};

p.disconnection = function(clientId) {
  // do nothing  
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Echo;