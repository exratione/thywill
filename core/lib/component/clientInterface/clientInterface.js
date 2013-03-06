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
 * @param {ServerMessage} message
 *   A ServerMessage instance.
 */
p.received = function (message) {
  var self = this;
  var toApplicationId = message.getToApplication();
  if (this.thywill.applications[toApplicationId]) {
    this.thywill.applications[toApplicationId].received(message);
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
 * Send a message out to a client or channel.
 *
 * @param {ServerMessage} message
 *   A ServerMessage instance.
 */
p.send = function (message) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Relating to resources.
//-----------------------------------------------------------

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
 * @param {function} callback
 *   Of the form function (error, resource), where error === null on success
 *   and resource is the resource to be returned.
 */
p.getResource = function (clientPath, callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Relating to publish / subscribe.
//-----------------------------------------------------------

/**
 * Subscribe this connection to a channel.
 *
 * @param {string} connectionId
 *   The connection ID.
 * @param {string} channelId
 *   The channel identifier.
 * @param {function} callback
 *   Of the form function (error).
 */
p.subscribe = function (connectionId, channelId, callback) {
  throw new Error("Not implemented.");
};

/**
 * Unsubscribe this connection from a channel.
 *
 * @param {string} connectionId
 *   The connection ID.
 * @param {string} channelId
 *   The channel identifier.
 * @param {function} callback
 *   Of the form function (error).
 */
p.unsubscribe = function (connectionId, channelId, callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Relating to tracking who is online.
//-----------------------------------------------------------

/**
 * Is the specified client connected to any of the cluster's server processes?
 *
 * @param {string} connectionId
 *   The connection ID.
 * @param {function} callback
 *   Of the form function (error, boolean).
 */
p.clientIsConnected = function (connectionId, callback) {
  throw new Error("Not implemented.");
};

/**
 * Is the specified client connected to this process?
 *
 * @param {string} connectionId
 *   The connection ID.
 * @param {function} callback
 *   Of the form function (error, boolean).
 */
p.clientIsConnectedLocally = function (connectionId, callback) {
  throw new Error("Not implemented.");
};

/**
 * Are any clients with the specified session connected to any of the cluster's
 * server processes?
 *
 * @param {string} sessionId
 *   The connection ID.
 * @param {function} callback
 *   Of the form function (error, boolean).
 */
p.sessionIsConnected = function (sessionId, callback) {
  throw new Error("Not implemented.");
};

/**
 * Return a reference to a data structure for connected sessions and clients
 * for all of the cluster members.
 *
 * This data may or may not be a clone of the actual data structure used by
 * the clientInterface to keep track of who is online.
 *
 * @param {function} callback
 *   Of the form function (error, data).
 */
p.getConnectionData = function (callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ClientInterface;
