var Component = require("../component/component");
var util = require("util");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * The superclass for applications built on thywill.js.
 */
function Application(id) {
  Application.super_.call(this);
  if( !id ) {
    throw new Error("Application class constructor requires an id parameter");
  }
  this.id = id;
  this.resources = [];
};
util.inherits(Application, Component);
var p = Application.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.send = function(message, clientId) {
  this.factory.applicationInterface.send(message, clientId, this.id);
};

/*
 * Return the array of resource definitions for this application, used 
 * to establish the client interface.
 */
p.getClientResources = function() {
  return this.resources; 
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/*
 * Called when the application is first registered with thywill.js, as an 
 * opportunity to assemble and cache resources.
 */
p.initializeClientResources = function(callback) {
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

module.exports = Application;