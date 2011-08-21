
var util = require("util");
var Component = require("../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function ClientInterface() {
  ClientInterface.super_.call(this);
  this.componentType = "clientInterface";
};
util.inherits(ClientInterface, Component);
var p = ClientInterface.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/*
 * Called when a message is received from a client.
 * 
 * message: instance of Message class
 */
p.receive = function(message) {
  this.thywill.appInterface.receive(message);
};

/*
 * Called when a client first connects.
 * 
 * client: instance of Client class
 */
p.connection = function(client) {
  this.thywill.appInterface.connection(client);
};

/*
 * Called when an existing client reconnects after being disconnected.
 * 
 * clientId: unique ID of the client in question.
 */
p.reconnection = function(clientId) {
  this.thywill.appInterface.reconnection(client);
};


/*
 * Called when a client disconnects.
 * 
 * clientId: unique ID of the client in question.
 */
p.disconnection = function(clientId) {
  this.thywill.appInterface.disconnection(clientId);
};

//-----------------------------------------------------------
//Methods to be implemented by subclasses.
//-----------------------------------------------------------

/*
 * Start the client interface running - should be the very last initialization call, 
 * after all resources are set by all applications and components.
 * 
 * callback - function(error), where error == Component.NO_ERROR on success. 
 */
p._startup = function(callback) {
  throw new Error("Not implemented.");  
};

/*
 * A resource to be loaded immediately on client connection.
 * 
 * callback - function(error), where error == Component.NO_ERROR on success.
 */
p.defineBootstrapResource = function(resource, callback) {
  throw new Error("Not implemented.");
};

/*
 * Return all bootstrap resource objects defined to date.
 * 
 * callback - function(error, [resource, resource...]), where error == null on success
 */
p.getBootstrapResources = function(callback) {
  throw new Error("Not implemented."); 
};

/*
 * A resource to be loaded at some point after client connection.
 * 
 * callback - function(error), where error == null on success.
 */
p.defineResource = function(resource, callback) {
  throw new Error("Not implemented.");
};

/*
 * Pass a resource or null to the callback if no resource is mapped to this path.
 * 
 * callback - function(error, resource), where error == null on success.
 */
p.getResource = function(path, callback) {
  throw new Error("Not implemented.");
};

/*
 * Send a message out to a particular client.
 * 
 * message: instance of Message class
 */
p.send = function(message) {
  throw new Error("Not implemented.");  
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ClientInterface;