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
function ClientInterface () {
  ClientInterface.super_.call(this);
  this.componentType = "clientInterface";
}
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
  // Send to all applications if no toApplicationId specified.
  if (!message.toApplicationId) {
    for (var id in this.thywill.applications) {
      process.nextTick(function () {
        self.thywill.applications[id].receive(message);
      });
    }
  } else if (this.thywill.applications[message.toApplicationId]) {
    this.thywill.applications[message.toApplicationId].receive(message);
  }
};

/**
 * Called when a client connects or reconnects.
 *
 * @param {string} connectionId
 *   Unique ID of the connection.
 * @param {string} sessionId
 *   Unique ID of the session associated with this connection - one session
 *   might have multiple concurrent connections.
 * @param {Object} session
 *   The session.
 */
p.connection = function (connectionId, sessionId, session) {
  var self = this;
  for (var id in this.thywill.applications) {
    process.nextTick(function () {
      self.thywill.applications[id].connection(connectionId, sessionId, session);
    });
  }
};

/**
 * Called when a client disconnects.
 *
 * @param {string} connectionId
 *   Unique ID of the connection.
 * @param {string} sessionId
 *   Unique ID of the session associated with this connection - one session
 *   might have multiple concurrent connections.
 */
p.disconnection = function (connectionId, sessionId) {
  var self = this;
  for (var id in this.thywill.applications) {
    process.nextTick(function () {
      self.thywill.applications[id].disconnection(connectionId, sessionId);
    });
  }
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
 * Start the client interface running - should be the very last initialization
 * call, after all resources are set by all applications and components.
 *
 * @param {Function} [callback]
 *   Of the form function (error) {}, where error === null on success.
 */
p._startup = function (callback) {
  throw new Error("Not implemented.");
};

/**
 * Define a resource to be loaded immediately on client connection.
 *
 * @param {Resource} resource
 *   A Resource instance.
 * @param {function} callback
 *   Of the form function (error, storedResource) {}, where error === null on
 *   success and storedResource is the provided resource object with any
 *   amendments that might have been made by the store.
 */
p.storeBootstrapResource = function (resource, callback) {
  throw new Error("Not implemented.");
};

/**
 * Return all bootstrap resource objects defined to date.
 *
 * @param {function} callback
 *   Of the form function (error, resources) {}, where error === null on
 *   success and resources is an array.
 */
p.getBootstrapResources = function (callback) {
  throw new Error("Not implemented.");
};

/**
 * Define a resource to be loaded at some point after client connection.
 *
 * @param {Resource} resource
 *   A Resource instance.
 * @param {function} callback
 *   Of the form function (error, storedResource) {}, where error === null on
 *   success and storedResource is the provided resource object with any
 *   amendments that might have been made by the store.
 */
p.storeResource = function (resource, callback) {
  throw new Error("Not implemented.");
};

/**
 * Return a resource to the callback, or null if no resource is mapped to
 * this path.
 *
 * @param {string} clientPath
 *   A request path.
 * @param {function} [callback]
 *   Of the form function (error, resource), where error === null on success
 *   and resource is the resource to be returned.
 */
p.getResource = function (clientPath, callback) {
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

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ClientInterface;
