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
  this.componentType = "application";
  this.id = id;
};
util.inherits(Application, Component);
var p = Application.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.send = function(message, clientId) {
  this.thywill.appInterface.send(message, clientId);
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/*
 * Called when the application is first registered with thywill.js. Use it to initialize
 * resources and pass them to the resources component. 
 * 
 * var resource = new Resource(type, path, data);
 * this.thywill.clientInterface.defineResource(resource);
 * 
 * or
 * 
 * this.thywill.clientInterface.defineBootstrapResource(resource);
 * 
 * Bootstrap resources are loaded immediately in the client. Other resources are available to be called later.
 */
p._defineClientResources = function(callback) {
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