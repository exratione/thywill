
var util = require("util");
var Component = require("../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function ClientInterface() {
  ClientInterface.super_.call(this);
  this.componentType = "clientInterface";
  this.applicationInterface = null;
};
util.inherits(ClientInterface, Component);
var p = ClientInterface.prototype;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

p.setApplicationInterface = function(applicationInterface) {
  this.applicationInterface = applicationInterface;
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.receive = function(client, message) {
  this.applicationInterface.receive(client, message);
};

p.connection = function(client) {
  this.applicationInterface.connection(client);
};

p.disconnection = function(client) {
  this.applicationInterface.disconnection(client);
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

p.send = function(client, message) {
  throw new Error("Not implemented.");  
};

//-----------------------------------------------------------
// Exports - Class Definition
//-----------------------------------------------------------

module.exports = ClientInterface;