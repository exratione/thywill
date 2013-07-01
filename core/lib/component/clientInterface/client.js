/**
 * @fileOverview
 * Client class definition.
 */

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A Client instance wraps values associated with a client connection. The
 * minimal expected set of values are:
 *
 * - connectionId
 * - sessionId
 * - session
 *
 * Though it is perfectly possible for sessionId or session to be unset, or
 * for sessionId === connectionId if the clientInterface implementation
 * doesn't use sessions.
 *
 * @param {object} data
 *   A set of client properties.
 */
function Client (data) {
  if (data && typeof data === 'object') {
    for (var prop in data) {
      this[prop] = data[prop];
    }
  }
}
var p = Client.prototype;

//-----------------------------------------------------------
// 'Static' parameters
//-----------------------------------------------------------

Client.DATA = {
  CONNECTION_ID: 'connectionId',
  SESSION_ID: 'sessionId',
  SESSION: 'session'
};

//-----------------------------------------------------------
// Methods: getters and setters
//-----------------------------------------------------------

p.getConnectionId = function () {
  return this.connectionId;
};
p.setConnectionId = function (connectionId) {
  this.connectionId = connectionId;
};
p.getSessionId = function () {
  return this.sessionId;
};
p.setSessionId = function (sessionId) {
  this.sessionId = sessionId;
};
p.getSession = function () {
  return this.connectionId;
};
p.setSession = function (session) {
  this.session = session;
};

//-----------------------------------------------------------
// Methods: utility
//-----------------------------------------------------------

/**
 * Return a plain object representation of the client, suitable for storing,
 * passing through cluster communication, or in messages, etc.
 *
 * This will always exclude a session, if present.
 *
 * @return {object}
 */
p.toData = function () {
  return {
    connectionId: this.connectionId,
    sessionId: this.sessionId
  };
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Client;
