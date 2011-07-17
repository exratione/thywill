
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

p.receive = function(message, clientId) {
  this.thywill.appInterface.receive(message, clientId);
};

p.connection = function(client) {
  this.thywill.appInterface.connection(client);
};

p.disconnection = function(clientId) {
  this.thywill.appInterface.disconnection(clientId);
};

//-----------------------------------------------------------
//Methods to be implemented by subclasses.
//-----------------------------------------------------------

/*
 * A resource to be loaded immediately on client connection.
 * 
 * callback - function(error), where error == null on success.
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
 */
p.send = function(message, clientId) {
  throw new Error("Not implemented.");  
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ClientInterface;