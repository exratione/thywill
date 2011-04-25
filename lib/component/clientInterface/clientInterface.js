
var util = require("util");
var Component = require("../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function ClientInterface() {
  ClientInterface.super_.call(this);
  this.componentType = "clientInterface";
  this._startListening();  
};
util.inherits(ClientInterface, Component);
var p = ClientInterface.prototype;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

p._startListening = function(){
  this.on("thywill.applicationInterface.send", this.send);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.receive = function(client, message) {
  this.emit("thywill.clientInterface.receive", client, message);
};

p.connection = function(client) {
  this.emit("thywill.clientInterface.connection", client);
};

p.disconnection = function(client) {
  this.emit("thywill.clientInterface.disconnection", client);
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