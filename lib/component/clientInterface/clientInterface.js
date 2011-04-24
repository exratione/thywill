
var util = require("util");
var Component = require("../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function ClientInterface() {
  this.componentType = "clientInterface";
  this.initializationFunctionNames.push("_startListening");
};
util.inherits(ClientInterface, Component);

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

ClientInterface.prototype._startListening = function(){
  this.on("thywill.applicationInterface.send", this.send);
};

ClientInterface.prototype.receive = function(client, message) {
  this.emit("thywill.clientInterface.receive", client, message);
};

ClientInterface.prototype.connection = function(client) {
  this.emit("thywill.clientInterface.connection", client);
};

ClientInterface.prototype.disconnection = function(client) {
  this.emit("thywill.clientInterface.disconnection", client);
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

ClientInterface.prototype.send = function(client, message) {
  throw new Error("Not implemented.");  
};

//-----------------------------------------------------------
// Exports
//-----------------------------------------------------------

module.exports = ClientInterface;