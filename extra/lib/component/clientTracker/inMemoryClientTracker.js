/**
 * @fileOverview
 * InMemoryClientTracker class definition.
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A ClientTracker implementation that stores all data in memory. Every cluster
 * member process keeps an up to date record of client connections to all
 * cluster processes.
 *
 * Obviously this doesn't scale as well as other implementations to large
 * numbers of cluster member processes - there is a lot of cross-talk needed
 * between cluster members to keep the data updated in all of them. It is best
 * used when your applications must make very frequent requests to ClientTracker
 * methods.
 *
 * @see ClientTracker
 */
function InMemoryClientTracker() {
  InMemoryClientTracker.super_.call(this);
}
util.inherits(InMemoryClientTracker, Thywill.getBaseClass("ClientTracker"));
var p = InMemoryClientTracker.prototype;

//-----------------------------------------------------------
// Methods: initialization.
//-----------------------------------------------------------

/**
 * @see Component#_configure
 */
p._configure = function (thywill, config, callback) {
  var self = this;
  this.thywill = thywill;
  this.config = config;

  // -----------------------------------------------------------------
  // Data structures for keeping track of who is online.
  // -----------------------------------------------------------------

  this.connections = {};
  this.thywill.cluster.getClusterMemberIds().forEach(function (clusterMemberId, index, array) {
    self.connections[clusterMemberId] = {
      connections: {},
      sessions: {}
    };
  });

  // -----------------------------------------------------------------
  // React to local connections and disconnections.
  // -----------------------------------------------------------------

  var clientInterface = this.thywill.clientInterface;
  var localClusterMemberId = this.thywill.cluster.getLocalClusterMemberId();
  clientInterface.on(clientInterface.events.CONNECTION, function (connectionId, sessionId, session) {
    self._reactToConnectionTo(localClusterMemberId, connectionId, sessionId);
  });
  clientInterface.on(clientInterface.events.DISCONNECTION, function (connectionId, sessionId, session) {
    self._reactToDisconnectionFrom(localClusterMemberId, connectionId, sessionId);
  });

  // -----------------------------------------------------------------
  // Cluster configuration: communication between processes.
  // -----------------------------------------------------------------

  // Task names used internally by this clientTracker implementation.
  this.clusterTask = {
    // Delivery of all connected client data for a specific process.
    connectionData: "thywill:clientTracker:connectedData",
    // Request for all connected client data for a specific process.
    connectionDataRequest: "thywill:clientTracker:connectedDataRequest",
    // Client connection notice from another cluster member.
    connectionTo: "thywill:clientTracker:connectionTo",
    // Client disconnection notice from another cluster member.
    disconnectionFrom: "thywill:clientTracker:disconnectionFrom"
  };

  // A cluster member fails and goes down. Emit the connection data, then clear it.
  this.thywill.cluster.on(this.thywill.cluster.eventNames.CLUSTER_MEMBER_DOWN, function (data) {
    var connections = self.connections[data.clusterMemberId].connections;
    var sessions = self.connections[data.clusterMemberId].sessions;
    self.emit(self.events.CLUSTER_MEMBER_DOWN, data.clusterMemberId, {
      connections: connections,
      sessions: sessions
    });
    self._clearConnectionDataForClusterMember(data.clusterMemberId);
  });
  // A cluster member comes back up. Either it was down, or the heartbeat
  // mechanism messed up and it was up all along. Make sure we have an up to
  // date set of connection data either way.
  this.thywill.cluster.on(this.thywill.cluster.eventNames.CLUSTER_MEMBER_UP, function (data) {
    self.thywill.cluster.sendTo(data.clusterMemberId, self.clusterTask.connectionDataRequest, {});
  });
  // Connection notice from another cluster member.
  this.thywill.cluster.on(this.clusterTask.connectionTo, function (data) {
    self._reactToConnectionTo(data.clusterMemberId, data.connectionId, data.sessionId);
  });
  // Disconnection notice from another cluster member.
  this.thywill.cluster.on(this.clusterTask.disconnectionFrom, function (data) {
    self._reactToDisconnectionFrom(data.clusterMemberId, data.connectionId, data.sessionId);
  });
  // Delivery of connection data from another server.
  this.thywill.cluster.on(this.clusterTask.connectionData, function (data) {
    self.thywill.log.debug("SocketIoClientInterface: delivery of connection data from: " + data.clusterMemberId);
    self._updateAllConnectionDataForClusterMember(data.clusterMemberId, data.connections);
  });
  // Request for connection data from another server.
  this.thywill.cluster.on(this.clusterTask.connectionDataRequest, function (data) {
    self.thywill.log.debug("SocketIoClientInterface: request for connection data from: " + data.clusterMemberId);
    self.thywill.cluster.sendTo(data.clusterMemberId, self.clusterTask.connectionData, {
      connections: self.connections[localClusterMemberId]
    });
  });

  // -----------------------------------------------------------------
  // Final steps of configuration.
  // -----------------------------------------------------------------

  // When Thywill launches, after this._setup() is done:
  this.thywill.on("thywill.ready", function () {
    // Request an update on who is connected from all other cluster members, so
    // as to bring data up to date in the case where a cluster member falls over.
    self.thywill.cluster.sendToOthers(self.clusterTask.connectionDataRequest);
  });

  // Set ready status.
  this.readyCallback = callback;
  this._announceReady(this.NO_ERRORS);
};

//-----------------------------------------------------------
// Methods: other.
//-----------------------------------------------------------

/**
 * @see ClientTracker#clientIsConnected
 */
p.clientIsConnected = function (connectionId, callback) {
  var self = this;
  var connected = Object.keys(this.connections).some(function (clusterMemberId, index, array) {
    return self.connections[clusterMemberId].connections[connectionId];
  });
  callback (this.NO_ERRORS, connected);
};

/**
 * @see ClientTracker#clientIsConnectedLocally
 */
p.clientIsConnectedLocally = function (connectionId, callback) {
  var clusterMemberId = this.thywill.cluster.getLocalClusterMemberId();
  var connected = (this.connections[clusterMemberId].connections[connectionId] !== undefined);
  callback (this.NO_ERRORS, connected);
};

/**
 * @see ClientTracker#sessionIsConnected
 */
p.sessionIsConnected = function (sessionId, callback) {
  var self = this;
  var connected = Object.keys(this.connections).some(function (clusterMemberId, index, array) {
    return self.connections[clusterMemberId].sessions[sessionId];
  });
  callback (this.NO_ERRORS, connected);
};

/**
 * @see ClientTracker#connectionIdsForSession
 */
p.connectionIdsForSession = function (sessionId, callback) {
  var self = this;
  var connectionIds = [];
  var connected = Object.keys(this.connections).forEach(function (clusterMemberId, index, array) {
    var ids = self.connections[clusterMemberId].sessions[sessionId];
    if (ids) {
      connectionIds = connectionIds.concat(ids);
    }
  });
  callback (this.NO_ERRORS, connectionIds);
};

/**
 * @see ClientTracker#getConnectionData
 */
p.getConnectionData = function (callback) {
  callback(this.NO_ERRORS, this.connections);
};

/**
 * Update the local connection data to note a connection. Emit an event.
 *
 * @param {string} clusterMemberId
 *   The cluster member where the connection occurred.
 * @param {string} connectionId
 *   Unique ID of the connection.
 * @param {string} sessionId
 *   Unique ID of the session associated with this connection - one session
 *   might have multiple concurrent connections.
 * @param {string} [session]
 *   Session data - only provided for local connections.
 */
p._reactToConnectionTo = function(clusterMemberId, connectionId, sessionId, session) {
  // Update the local records.
  var data = this.connections[clusterMemberId];
  data.connections[connectionId] = Date.now();
  if (!data.sessions[sessionId]) {
    data.sessions[sessionId] = [connectionId];
  } else {
    var sessionConnections = data.sessions[sessionId];
    if (sessionConnections.indexOf(connectionId) === -1) {
      sessionConnections.push(connectionId);
    }
  }
  // Emit tracking events and notify other cluster members, depending on
  // whether this is a connection to the local process or not.
  if (this.thywill.cluster.getLocalClusterMemberId() === clusterMemberId) {
    this.thywill.cluster.sendToOthers(this.clusterTask.connectionTo, {
      connectionId: connectionId,
      sessionId: sessionId
    });
    this.emit(this.events.CONNECTION, connectionId, sessionId, session);
  }
  this.emit(this.events.CONNECTION_TO, clusterMemberId, connectionId, sessionId);
};

/**
 * Update the local connection data to note a disconnection. Emit an event.
 *
 * @param {string} clusterMemberId
 *   The cluster member where the disconnection occurred.
 * @param {string} connectionId
 *   Unique ID of the connection.
 * @param {string} sessionId
 *   Unique ID of the session associated with this connection - one session
 *   might have multiple concurrent connections.
 */
p._reactToDisconnectionFrom = function(clusterMemberId, connectionId, sessionId) {
  // Update the local records.
  var data = this.connections[clusterMemberId];
  delete data.connections[connectionId];
  if (data.sessions[sessionId]) {
    data.sessions[sessionId] = data.sessions[sessionId].filter(function (element, index, array) {
      return (element !== connectionId);
    });
    if (data.sessions[sessionId].length === 0) {
      delete data.sessions[sessionId];
    }
  }
  // Emit tracking events and notify other cluster members, depending on
  // whether this is a connection to the local process or not.
  if (this.thywill.cluster.getLocalClusterMemberId() === clusterMemberId) {
    this.thywill.cluster.sendToOthers(this.clusterTask.disconnectionFrom, {
      connectionId: connectionId,
      sessionId: sessionId
    });
    this.emit(this.events.DISCONNECTION, connectionId, sessionId);
  }
  this.emit(this.events.DISCONNECTION_FROM, clusterMemberId, connectionId, sessionId);
};

/**
 * Given all the connection data for a specific cluster member process, make it
 * the local copy of record for that cluster member process.
 *
 * On startup, processes request all the data from other processes, so as to
 * restore the local copy after a crash and restart situation.
 *
 * @param {string} clusterMemberId
 *   The cluster member whose data it is.
 * @param {object} data
 *   The connection data for this cluster member.
 */
p._updateAllConnectionDataForClusterMember = function (clusterMemberId, data) {
  this.connections[clusterMemberId] = data;
};

/**
 * This is called when another cluster member fails, to clear out its
 * connection data since all of the connected clients will now be
 * disconnected.
 *
 * @param {string} clusterMemberId
 *   The cluster member whose data it is.
 */
p._clearConnectionDataForClusterMember = function (clusterMemberId) {
  // Important that we replace the object at the top, rather than the
  // sessions and connections properties, as the original connections and
  // sessions items will be passed on and used to update applications.
  this.connections[clusterMemberId] = {
    connections: {},
    sessions: {}
  };
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = InMemoryClientTracker;
