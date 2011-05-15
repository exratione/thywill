
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
  this.factory.appInterface.receive(message, clientId);
};

p.connection = function(client) {
  this.factory.appInterface.connection(client);
};

p.disconnection = function(clientId) {
  this.factory.appInterface.disconnection(clientId);
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

p.send = function(message, clientId) {
  throw new Error("Not implemented.");  
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ClientInterface;