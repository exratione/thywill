/**
 * @fileOverview
 * ClientInteface class definition.
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for Thywill client interfaces. This is not intended to be
 * instantiated.
 */
function ClientInterface() {
  ClientInterface.super_.call(this);
  this.componentType = "clientInterface";
};
util.inherits(ClientInterface, Thywill.getBaseClass("Component"));
var p = ClientInterface.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * Called when a message is received from a client.
 * 
 * @param {Message} message
 *   A Message instance.
 */
p.receive = function (message) {
  var self = this;
  if (!message.applicationId) {
    for (id in this.thywill.applications) {
      process.nextTick(function () {
        self.thywill.applications[id].receive(message);
      });
    }    
  } else if (this.thywill.applications[message.applicationId]) {
    this.thywill.applications[message.applicationId].receive(message); 
  }
};

/**
 * Called when a client connects or reconnects.
 * 
 * @param {string} sessionId
 *   Unique ID of the session.
 */
p.connection = function (sessionId) {
  var self = this;
  for (id in this.thywill.applications) {
    process.nextTick(function () {
      self.thywill.applications[id].connection(sessionId);
    });
  }
};

/**
 * Called when a client disconnects.
 * 
 * @param {string} sessionId
 *   Unique ID of the session.
 */
p.disconnection = function (sessionId) {
  var self = this;
  for (id in this.thywill.applications) {
    process.nextTick(function () {
      self.thywill.applications[id].disconnection(sessionId);
    });
  }
};

//-----------------------------------------------------------
//Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
 * Start the client interface running - should be the very last initialization
 * call, after all resources are set by all applications and components.
 * 
 * @param {Function} [callback] 
 *   Of the form function (error) {}, where error == null on success. 
 */
p._startup = function (callback) {
  throw new Error("Not implemented.");  
};

/**
 * Define a resource to be loaded immediately on client connection.
 * 
 * @param {Resource} resource
 *   A Resource instance.
 * @param {Function} [callback] 
 *   Of the form function (error) {}, where error == null on success.
 */
p.defineBootstrapResource = function (resource, callback) {
  throw new Error("Not implemented.");
};

/**
 * Return all bootstrap resource objects defined to date.
 * 
 * @param {Function} [callback] 
 *   Of the form function (error) {}, where error == null on success.
 */
p.getBootstrapResources = function (callback) {
  throw new Error("Not implemented."); 
};

/**
 * Define a resource to be loaded at some point after client connection.
 * 
 * @param {Function} [callback] 
 *   Of the form function (error) {}, where error == null on success.
 */
p.defineResource = function (resource, callback) {
  throw new Error("Not implemented.");
};

/**
 * Return a resource to the callback, or null if no resource is mapped to 
 * this path.
 * 
 * @param {string} path
 *   A request path.
 * @param {Function} [callback] 
 *   Of the form function (error, resource) {}, where error == null on success
 *   and resource is the resource to be returned.
 */
p.getResource = function (path, callback) {
  throw new Error("Not implemented.");
};

/**
 * Send a message out to a particular client.
 * 
 * @param {Message} message
 *   A Message instance.
 */
p.send = function (message) {
  throw new Error("Not implemented.");  
};

/**
 * Store key-value data for a specific session.
 * 
 * @param {string} sessionId
 *   A unique session ID.
 * @param {string} key
 *   Key for the data.
 * @param {Object} value
 *   Any object.
 * @param {Function} [callback] 
 *   Of the form function (error) {}, where error == null on success.
 */
p.setSessionData = function (sessionId, key, value, callback) {
  throw new Error("Not implemented."); 
};

/**
 * Retrieve the value data for a specific session and key.
 * 
 * @param {string} sessionId
 *   A unique session ID.
 * @param {string} key
 *   Key for the data.
 * @param {Function} [callback] 
 *   Of the form function (error, value) {}, where error == null on success
 *   and value is the value to be returned.
 */
p.getSessionData = function (sessionId, key, callback) {
  throw new Error("Not implemented."); 
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ClientInterface;