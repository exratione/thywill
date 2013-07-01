/**
 * @fileOverview
 * ChannelManager class definition.
 */

var util = require('util');
var Thywill = require('thywill');

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for channel managers, used to set up and manipulate channels.
 * For our purposes here, a channel is defined as a collection of client
 * sessions.
 *
 * A channelManager implementation must emit the following events, which
 * require integration with the cluster communication mechanisms.
 *
 * Sessions are added to a channel in any process in the cluster.
 * channelManager.on(channelManager.events.SESSIONS_ADDED, function (channelId, sessionIds) {});
 *
 * Sessions are removed from a channel in any process in the cluster.
 * channelManager.on(channelManager.events.SESSIONS_REMOVED, function (channelId, sessionIds) {});
 */
function ChannelManager() {
  ChannelManager.super_.call(this);
  this.componentType = 'channelManager';
  // Convenience reference.
  this.events = ChannelManager.EVENTS;
}
util.inherits(ChannelManager, Thywill.getBaseClass('Component'));
var p = ChannelManager.prototype;

//-----------------------------------------------------------
// 'Static'
//-----------------------------------------------------------

ChannelManager.EVENTS = {
  SESSIONS_ADDED: 'sessionsAdded',
  SESSIONS_REMOVED: 'sessionsRemoved'
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
 * Obtain all of the channel IDs that the provided session is a member
 * of.
 *
 * @param {string} sessionId
 *   A session ID.
 * @param {function} callback
 *   Of the form function (error, channels), where channels is an array.
 */
p.getChannelIdsForSession = function (sessionId, callback) {
  throw new Error('Not implemented.');
};

/**
 * Add one or more session IDs to this channel.
 *
 * @param {string} channelId
 *   Unique ID for the channel.
 * @param {string|array} sessionIds
 *   A session ID or array of session IDs.
 * @param {function} callback
 *   Of the form function (error).
 */
p.addSessionIds = function (channelId, sessionIds, callback) {
  throw new Error('Not implemented.');
};

/**
 * Remove one or more session IDs from this channel.
 *
 * @param {string} channelId
 *   Unique ID for the channel.
 * @param {string|array} sessionIds
 *   A session ID or array of session IDs.
 * @param {function} callback
 *   Of the form function (error).
 */
p.removeSessionIds = function (channelId, sessionIds, callback) {
  throw new Error('Not implemented.');
};

/**
 * Remove all session IDs from this channel. The removed session IDs are
 * returned in the callback.
 *
 * @param {string} channelId
 *   Unique ID for the channel.
 * @param {function} callback
 *   Of the form function (error, sessionIds).
 */
p.clear = function (channelId, callback) {
  throw new Error('Not implemented.');
};

/**
 * Get the session IDs associated with this channel.
 *
 * @param {string} channelId
 *   Unique ID for the channel.
 * @param {function} callback
 *   Of the form function (error, sessionIds), where sessionIds is an array.
 */
p.getSessionIds = function (channelId, callback) {
  throw new Error('Not implemented.');
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ChannelManager;
