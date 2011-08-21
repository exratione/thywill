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

/*
 * Send a message to a specific client.
 * 
 * message: instance of the Message class
 */
p.send = function(message) {
  this.thywill.appInterface.send(message);
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/*
 * Called when the application is first registered with thywill.js. Use it to initialize
 * resources and pass them to the resources component. 
 * 
 * var resource = new Resource(type, weight, path, data);
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

/*
 * Called when a message is received from a client.
 * 
 * message: instance of Message class
 */
p.receive = function(message) {
  throw new Error("Not implemented.");  
};

/*
 * Called when a client first connects.
 * 
 * message: instance of Client class
 */
p.connection = function(client) {
  throw new Error("Not implemented.");  
};

/*
 * Called when a client reconnects after a disconnection for whatever reason.
 * 
 * clientId: unique ID of the client in question.
 */
p.reconnection = function(clientId) {
  throw new Error("Not implemented.");  
};


/*
 * Called when a client disconnects.
 * 
 * clientId: unique ID of the client in question.
 */
p.disconnection = function(clientId) {
  throw new Error("Not implemented.");  
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Application;