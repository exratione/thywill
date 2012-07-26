/**
 * @fileOverview
 * Application class definition.
 */

var Component = require("../component");
var util = require("util");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for applications built on thywill.js.
 */
function Application(id) {
  Application.super_.call(this);
  if (!id) {
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

/**
 * Send a message to a specific client.
 * 
 * @param {Message} message
 *   Instance of the Message class.
 */
p.send = function(message) {
  this.thywill.clientInterface.send(message);
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
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
 * 
 * @param {Function} callback
 *   Of the form function(error) {}, where error == null on success.
 */
p._defineClientResources = function(callback) {
  throw new Error("Not implemented.");
};

/**
 * Called when a message is received from a client.
 * 
 * @param {Message} message
 *   Instance of the Message class.
 */
p.receive = function(message) {
  throw new Error("Not implemented.");  
};

/**
 * Called when a client connects or reconnects.
 * 
 * @param {string} sessionId
 *   Unique ID of the session.
 */
p.connection = function(sessionId) {
  throw new Error("Not implemented.");  
};

/**
 * Called when a client disconnects.
 * 
 * @param {string} sessionId
 *   Unique ID of the session.
 */
p.disconnection = function(sessionId) {
  throw new Error("Not implemented.");  
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Application;