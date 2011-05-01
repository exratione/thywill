
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

p.receive = function(message, clientId, applicationId) {
  this.factory.applicationInterface.receive(message, clientId, applicationId);
};

p.connection = function(client) {
  this.factory.applicationInterface.connection(client);
};

p.disconnection = function(clientId) {
  this.factory.applicationInterface.disconnection(clientId);
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

p.send = function(message, clientId, applicationId) {
  throw new Error("Not implemented.");  
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ClientInterface;