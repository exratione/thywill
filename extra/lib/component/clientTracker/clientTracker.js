/**
 * @fileOverview
 * ClientTracker class definition.
 */

var util = require('util');
var Thywill = require('thywill');

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for client trackers, which keep track of connections and
 * sessions connected to the various processes in a cluster.
 *
 * A clientTracker implementation must emit the following events, which
 * require integration with the cluster communication mechanisms.
 *
 * When a cluster member goes down, emit the list of connectionIds and
 * sessionIds that were disconnected.
 * clientTracker.on(clientTracker.events.CLUSTER_MEMBER_DOWN, function (clusterMemberId, connectionData) {});
 *
 * Emit on connection of a client to this cluster member.
 * clientTracker.on(clientTracker.events.CONNECTION, function (client, session) {});
 *
 * Emit when a client disconnects from this or any other cluster member.
 * clientTracker.on(clientTracker.events.CONNECTION_TO, function (clusterMemberId, client {});
 *
 * Emit on disconnection of a client to this cluster member.
 * clientTracker.on(clientTracker.events.DISCONNECTION, function (client) {});
 *
 * Emit when a client disconnects from this or any other cluster member.
 * clientTracker.on(clientTracker.events.DISCONNECTION_FROM, function (clusterMemberId, client) {});
 */
function ClientTracker() {
  ClientTracker.super_.call(this);
  this.componentType = 'clientTracker';
  // Convenience reference.
  this.events = ClientTracker.EVENTS;
}
util.inherits(ClientTracker, Thywill.getBaseClass('Component'));
var p = ClientTracker.prototype;

//-----------------------------------------------------------
// 'Static'
//-----------------------------------------------------------

ClientTracker.EVENTS = {
  CONNECTION: 'connection',
  CONNECTION_TO: 'connectionTo',
  DISCONNECTION: 'disconnection',
  DISCONNECTION_FROM: 'disconnectionFrom',
  CLUSTER_MEMBER_DOWN: 'clusterMemberDown'
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Component#_getDependencies
 */
p._getDependencies = function () {
  return {
    components: ['clientInterface']
  };
};

/**
 * Is the specified client connected to any of the cluster's server processes?
 *
 * @param {Client|string} client
 *   A Client instance or connection ID.
 * @param {function} callback
 *   Of the form function (error, boolean).
 */
p.clientIsConnected = function (client, callback) {
  throw new Error('Not implemented.');
};

/**
 * Is the specified client connected to this process?
 *
 * @param {Client|string} client
 *   A Client instance or connection ID.
 * @param {function} callback
 *   Of the form function (error, boolean).
 */
p.clientIsConnectedLocally = function (client, callback) {
  throw new Error('Not implemented.');
};

/**
 * Are any clients with the specified session connected to any of the cluster's
 * server processes?
 *
 * @param {Client|string} client
 *   A Client instance or session ID.
 * @param {function} callback
 *   Of the form function (error, boolean).
 */
p.clientSessionIsConnected = function (client, callback) {
  throw new Error('Not implemented.');
};

/**
 * Obtain an array of connection IDs associated with this session.
 *
 * @param {string} sessionId
 *   The connection ID.
 * @param {function} callback
 *   Of the form function (error, connectionIds).
 */
p.connectionIdsForSession = function (sessionId, callback) {
  throw new Error('Not implemented.');
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
  throw new Error('Not implemented.');
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ClientTracker;
