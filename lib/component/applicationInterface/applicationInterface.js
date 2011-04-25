
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
  ApplicationInterface.super_.call(this);
  this.componentType = "applicationInterface";
  this.clientInterface = null;
};
util.inherits(ApplicationInterface, Component);
var p = ApplicationInterface.prototype;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

p.setClientInterface = function(clientInterface) {
  this.clientInterface = clientInterface;
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.send = function(client, message) {
  this.clientInterface.send(client, message);
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

p.receive = function(client, message) {
  throw new Error("Not implemented.");  
};

p.connection = function(client) {
  throw new Error("Not implemented.");  
};

p.disconnection = function(client) {
  throw new Error("Not implemented.");  
};

//-----------------------------------------------------------
// Exports - Class Definition
//-----------------------------------------------------------

module.exports = ApplicationInterface;