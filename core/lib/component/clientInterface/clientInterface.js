/**
 * @fileOverview
 * ClientInterface superclass definition.
 */

var util = require('util');
var Thywill = require('thywill');

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
 * clientInterface.on(clientInterface.events.FROM_CLIENT, function (client, applicationId, message) {});
 *
 * Emit on connection of a client to this cluster process.
 * clientInterface.on(clientInterface.events.CONNECTION, function (client) {});
 *
 * Emit on disconnection of a client from this cluster process.
 * clientInterface.on(clientInterface.events.DISCONNECTION, function (client) {});
 */
function ClientInterface () {
  ClientInterface.super_.call(this);
  this.componentType = 'clientInterface';
  // Convenience reference.
  this.events = ClientInterface.EVENTS;
}
util.inherits(ClientInterface, Thywill.getBaseClass('Component'));
var p = ClientInterface.prototype;

//-----------------------------------------------------------
// 'Static'
//-----------------------------------------------------------

ClientInterface.EVENTS = {
  CONNECTION: 'connection',
  DISCONNECTION: 'disconnection',
  FROM_CLIENT: 'fromClient'
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
      'log',
      'cluster',
      'cacheManager',
      'resourceManager',
      'templateEngine',
      'minifier'
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
  throw new Error('Not implemented.');
};

//-----------------------------------------------------------
// Relating to sending messages and channels.
//-----------------------------------------------------------

/**
 * Send a message, usually to one specific client.
 *
 * @param {string} applicationId
 *   Application that the message is associated with.
 * @param {Client|string} client
 *   Client instance or connection ID that will receive the message.
 * @param {mixed|Message} message
 *   The message data.
 */
p.sendToConnection = function (applicationId, client, message) {
  throw new Error('Not implemented.');
};

/**
 * Send a message to all the active connections associated with a session. This
 * can only be used if a clientTracker component is configured.
 *
 * @param {string} applicationId
 *   Application that the message is associated with.
 * @param {Client|string} client
 *   Client instance or session ID that will receive the message.
 * @param {mixed|Message} message
 *   The message data.
 */
p.sendToSession = function (applicationId, client, message) {
  throw new Error('Not implemented.');
};

/**
 * Send a message to all the active connections subscribed to a channel.
 *
 * @param {string} applicationId
 *   Application that the message is associated with.
 * @param {string} channelId
 *   Unique ID for the channel that will receive the message.
 * @param {mixed|Message} message
 *   The message data.
 * @param {Client|string|array} [excludeClients]
 *   Client instances or connection IDs to exclude from the broadcast.
 */
p.sendToChannel = function (applicationId, channelId, message, excludeClients) {
  throw new Error('Not implemented.');
};

/**
 * Subscribe one or more connections to one or more channels.
 *
 * @param {Client|string|array} clients
 *   The Client instances or connection IDs to be subscribed.
 * @param {string|array} channelIds
 *   One or more channel identifiers.
 * @param {function} callback
 *   Of the form function (error).
 */
p.subscribe = function (clients, channelIds, callback) {
  throw new Error('Not implemented.');
};

/**
 * Unsubscribe one or more connections from one or more channels.
 *
 * @param {Client|string|array} clients
 *   The Client instances or connection IDs to be subscribed.
 * @param {string|array} channelIds
 *   One or more channel identifiers.
 * @param {function} callback
 *   Of the form function (error).
 */
p.unsubscribe = function (clients, channelIds, callback) {
  throw new Error('Not implemented.');
};

/**
 * If set to use sessions, load the session for this client.
 *
 * @param {Client|string} client
 *   Client instance or session ID.
 * @param {function} callback
 *   Of the form function (error, session).
 */
p.loadSession = function (client, callback) {
  throw new Error('Not implemented.');
};

/**
 * If set to use sessions, store the session for this client.
 *
 * @param {Client|string} client
 *   Client instance or session ID.
 * @param {mixed} session
 *   A session instance.
 * @param {function} callback
 *   Of the form function (error).
 */
p.storeSession = function (client, session, callback) {
  throw new Error('Not implemented.');
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
  throw new Error('Not implemented.');
};

/**
 * Return all bootstrap resource objects defined to date.
 *
 * @param {function} callback
 *   Of the form function (error, resources), where resources is an array.
 */
p.getBootstrapResources = function (callback) {
  throw new Error('Not implemented.');
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
  throw new Error('Not implemented.');
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
  throw new Error('Not implemented.');
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ClientInterface;
