
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

p.send = function(message, clientId) {
  this.thywill.clientInterface.send(message, clientId);
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

p._registerApplication = function(application) {
  throw new Error("Not implemented.");  
};

p.receive = function(message, clientId) {
  throw new Error("Not implemented.");  
};

p.connection = function(client) {
  throw new Error("Not implemented.");  
};

p.disconnection = function(clientId) {
  throw new Error("Not implemented.");  
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = AppInterface;