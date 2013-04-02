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
 * ClientInterface implementations must emit the following events:
 *
 * Emit when a message arrives from a client.
 * clientInterface.on(clientInterface.events.FROM_CLIENT, function (message) {});
 *
 * Emit on connection of a client to this cluster process.
 * clientInterface.on(clientInterface.events.CONNECTION, function (connectionId, sessionId, session) {});
 *
 * Emit on disconnection of a client from this cluster process.
 * clientInterface.on(clientInterface.events.DISCONNECTION, function (connectionId, sessionId) {});
 */
function ClientInterface () {
  ClientInterface.super_.call(this);
  this.componentType = "clientInterface";
  // Convenience reference.
  this.events = ClientInterface.EVENTS;
}
util.inherits(ClientInterface, Thywill.getBaseClass("Component"));
var p = ClientInterface.prototype;

//-----------------------------------------------------------
// "Static"
//-----------------------------------------------------------

ClientInterface.EVENTS = {
  CONNECTION: "connection",
  DISCONNECTION: "disconnection",
  FROM_CLIENT: "fromClient"
};

//-----------------------------------------------------------
// Methods.
//-----------------------------------------------------------

/**
 * @see Component#_getDependencies
 */
p._getDependencies = function () {
  return {
    components: [
      "log",
      "cluster",
      "cacheManager",
      "resourceManager",
      "messageManager",
      "templateEngine",
      "minifier"
    ]
  };
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
 * Start the client interface running - should be the very last initialization
 * call, after all resources are set by all applications and components.
 *
 * @param {Function} callback
 *   Of the form function (error).
 */
p._startup = function (callback) {
  throw new Error("Not implemented.");
};

/**
 * Send a message out to either:
 *
 * - A client connection.
 * - All the client connections for a session.
 * - A channel with many subscribed connections.
 *
 * Which of these options is used depends on the ServerMessage metadata.
 * See the MessageManager component for convenience methods to create
 * ServerMessage instances with the appropriate addressing metadata.
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
 *   Of the form function (error, storedResource), where storedResource is
 *   the provided resource object with any amendments that might have been
 *   made by the store.
 */
p.storeBootstrapResource = function (resource, callback) {
  throw new Error("Not implemented.");
};

/**
 * Return all bootstrap resource objects defined to date.
 *
 * @param {function} callback
 *   Of the form function (error, resources), where resources is an array.
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
 *   Of the form function (error, storedResource), where toredResource is the
 *   provided resource object with any amendments that might have been made by
 *   the store.
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
 *   Of the form function (error, resource), where resource is the resource to
 *   be returned.
 */
p.getResource = function (clientPath, callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Relating to publish / subscribe.
//-----------------------------------------------------------

/**
 * Subscribe one or more connections to one or more channels.
 *
 * @param {string|array} connectionIds
 *   The connection IDs to be subscribed.
 * @param {string|array} channelIds
 *   One or more channel identifiers.
 * @param {function} callback
 *   Of the form function (error).
 */
p.subscribe = function (connectionIds, channelIds, callback) {
  throw new Error("Not implemented.");
};

/**
 * Unsubscribe one or more connections from one or more channels.
 *
 * @param {string|array} connectionIds
 *   The connection IDs to be subscribed.
 * @param {string|array} channelIds
 *   One or more channel identifiers.
 * @param {function} callback
 *   Of the form function (error).
 */
p.unsubscribe = function (connectionIds, channelIds, callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ClientInterface;
