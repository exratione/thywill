
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
};
util.inherits(ApplicationInterface, Component);
var p = ApplicationInterface.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.send = function(message, clientId, applicationId) {
  this.factory.clientInterface.send(message, clientId, applicationId);
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

p._registerApplication = function(application) {
  throw new Error("Not implemented.");  
};

p.receive = function(message, clientId, applicationId) {
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

module.exports = ApplicationInterface;