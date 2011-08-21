
var util = require("util");
var Component = require("../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * The superclass for interfaces between thywill and applications built on
 * thywill.js. These interfaces manage the communication between applications
 * and thywill.js.
 */
function AppInterface() {
  AppInterface.super_.call(this);
  this.componentType = "appInterface";
};
util.inherits(AppInterface, Component);
var p = AppInterface.prototype;
    
//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/*
 * Send a message to a specific client.
 * 
 * message: instance of the Message class
 */
p.send = function(message) {
  this.thywill.clientInterface.send(message);
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/*
 * Tell the interface that an application exists. To be called during the initial thywill setup.
 */
p._registerApplication = function(application) {
  throw new Error("Not implemented.");  
};

/*
 * Called when a message is received from a client.
 * 
 * message: instance of Message class
 */
p.receive = function(message) {
  throw new Error("Not implemented.");  
};

/*
 * Called when a client first connects.
 * 
 * client: instance of Client class
 */
p.connection = function(client) {
  throw new Error("Not implemented.");  
};

/*
 * Called when a client reconnects after a disconnection for whatever reason.
 * 
 * clientId: unique ID of the client in question.
 */
p.reconnection = function(clientId) {
  throw new Error("Not implemented.");  
};

/*
 * Called when a client disconnects.
 * 
 * clientId: unique ID of the client in question.
 */
p.disconnection = function(clientId) {
  throw new Error("Not implemented.");  
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = AppInterface;