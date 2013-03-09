/**
 * @fileOverview
 * ClientInterface superclass definition.
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for Thywill client interfaces.
 *
 * ClientInterface implementations must emit the following events, which
 * require integration with the cluster communication mechanisms.
 *
 * Emit when a message arrives from a client.
 * clientInterface.on(clientInterface.events.FROM_CLIENT, function (message) {});
 *
 * When a cluster member goes down, emit the list of connectionIds and
 * sessionIds that were disconnected.
 * clientInterface.on(clientInterface.events.CLUSTER_MEMBER_DOWN, function (clusterMemberId, connectionData) {});
 *
 * Emit on connection of a client.
 * clientInterface.on(clientInterface.events.CONNECTION, function (connectionId, sessionId, session) {});
 *
 * Emit when a client disconnects from this or any other cluster member.
 * clientInterface.on(clientInterface.events.CONNECTION_TO, function (clusterMemberId, connectionId, sessionId) {});
 *
 * Emit on disconnection of a client.
 * clientInterface.on(clientInterface.events.DISCONNECTION, function (connectionId, sessionId) {});
 *
 * Emit when a client disconnects from this or any other cluster member.
 * clientInterface.on(clientInterface.events.DISCONNECTION_FROM, function (clusterMemberId, connectionId, sessionId) {});
 */
function ClientInterface () {
  ClientInterface.super_.call(this);
  this.componentType = "clientInterface";
  // Useful reference.
  this.events = ClientInterface.EVENTS;
}
util.inherits(ClientInterface, Thywill.getBaseClass("Component"));
var p = ClientInterface.prototype;

//-----------------------------------------------------------
// "Static"
//-----------------------------------------------------------

ClientInterface.EVENTS = {
  CONNECTION: "connection",
  CONNECTION_TO: "connectionTo",
  DISCONNECTION: "disconnection",
  DISCONNECTION_FROM: "disconnectionFrom",
  CLUSTER_MEMBER_DOWN: "clusterMemberDown",
  FROM_CLIENT: "fromClient"
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
