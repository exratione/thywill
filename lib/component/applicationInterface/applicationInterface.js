
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
function ApplicationInterface() {
  this.componentType = "applicationInterface";
  this.initializationMethodNames.push("_startListening");
};
util.inherits(ApplicationInterface, Component);

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

ApplicationInterface.prototype._startListening = function(){
  this.on("thywill.clientInterface.receive", this.receive);
  this.on("thywill.clientInterface.connection", this.connection);
  this.on("thywill.clientInterface.disconnection", this.disconnection);
};

ApplicationInterface.prototype.send = function(client, message) {
  this.emit("thywill.applicationInterface.send", client, message);
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

ApplicationInterface.prototype.receive = function(client, message) {
  throw new Error("Not implemented.");  
};

ApplicationInterface.prototype.connection = function(client) {
  throw new Error("Not implemented.");  
};

ApplicationInterface.prototype.disconnection = function(client) {
  throw new Error("Not implemented.");  
};

//-----------------------------------------------------------
// Exports - Class Definition
//-----------------------------------------------------------

module.exports = ApplicationInterface;