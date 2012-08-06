/**
 * @fileOverview
 * Application class definition.
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for applications running on Thywill.
 */
function Application(id) {
  Application.super_.call(this);
  if (!id) {
    throw new Error("Application class constructor requires an id parameter");
  }
  this.componentType = "application";
  this.id = id;
};
util.inherits(Application, Thywill.getBaseClass("Component"));
var p = Application.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * Send a message, usually to one specific client.
 * 
 * @param {Message} message
 *   Instance of the Message class.
 */
p.send = function (message) {
  this.thywill.clientInterface.send(message);
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
 * This method is invoked when the application is first registered on Thywill
 * server startup. It should be used to define the resources that will be
 * loaded by a client immediately on connection. These will typically include
 * third party libraries and the core Javascript client code that starts an
 * application running, renders a user interface, and so on.
 * 
 * These bootstrap resources are defined via the resourceManager and
 * clientInterface components:
 * 
 * var resource = this.thywill.resourceManager.createResource(type, ...);
 * this.thywill.clientInterface.storeBootstrapResource(resource, callback);
 * 
 * @param {Function} callback
 *   Of the form function (error) {}, where error == null on success.
 */
p._defineBootstrapResources = function (callback) {
  throw new Error("Not implemented.");
};

/**
 * Called when a message is received from a client.
 * 
 * @param {Message} message
 *   Instance of the Message class.
 */
p.receive = function (message) {
  throw new Error("Not implemented.");  
};

/**
 * Called when a client connects or reconnects.
 * 
 * @param {string} sessionId
 *   Unique ID of the session.
 */
p.connection = function (sessionId) {
  throw new Error("Not implemented.");  
};

/**
 * Called when a client disconnects.
 * 
 * @param {string} sessionId
 *   Unique ID of the session.
 */
p.disconnection = function (sessionId) {
  throw new Error("Not implemented.");  
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Application;
