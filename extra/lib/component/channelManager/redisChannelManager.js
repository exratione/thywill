/**
 * @fileOverview
 * RedisChannelManager class definition.
 */

var async = require('async');
var util = require('util');
var Thywill = require('thywill');

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A channel manager that stores channel information in Redis.
 *
 * It maintains lookup sets for each channel and each session that belongs to
 * at least one channel.
 *
 * This implementation requires that a clientTracker implementation is used.
 *
 * TODO: mechanisms for clearing out old sessions?
 *
 * @see ChannelManager
 */
function RedisChannelManager() {
  RedisChannelManager.super_.call(this);
  this.channels = {};
}
util.inherits(RedisChannelManager, Thywill.getBaseClass('ChannelManager'));
var p = RedisChannelManager.prototype;

//-----------------------------------------------------------
// 'Static' parameters
//-----------------------------------------------------------

RedisChannelManager.CONFIG_TEMPLATE = {
  redisPrefix: {
    _configInfo: {
      description: 'A prefix applied to Redis keys.',
      types: 'string',
      required: true
    }
  },
  redisClient: {
    _configInfo: {
      description: 'A Redis client instance from package "redis".',
      types: 'object',
      required: true
    }
  }
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Component#_getDependencies
 */
p._getDependencies = function () {
  return {
    components: ['clientInterface', 'clientTracker']
  };
};

/**
 * @see Component#_configure
 */
p._configure = function (thywill, config, callback) {
  var self = this;
  this.thywill = thywill;
  this.config = config;
  this.readyCallback = callback;

  // Watch the clientTracker for people arriving who need to be subscribed.
  var clientTracker = this.thywill.clientTracker;
  clientTracker.on(clientTracker.events.CONNECTION, function (connectionId, sessionId, session) {
    self.subscribeNewConnection(connectionId, sessionId);
  });

  // Listen on the cluster for various communications.
  this.clusterTask = {
    // Delivery of all connected client data for a specific process.
    sessionsAdded: 'thywill:channelManager:sessionsAdded',
    // Request for all connected client data for a specific process.
    sessionsRemoved: 'thywill:channelManager:sessionsRemoved'
  };
  this.thywill.cluster.on(this.clusterTask.sessionsAdded, function (task) {
    self.emit(self.events.SESSIONS_ADDED, task.channelId, task.sessionIds);
  });
  this.thywill.cluster.on(this.clusterTask.sessionsRemoved, function (task) {
    self.emit(self.events.SESSIONS_REMOVED, task.channelId, task.sessionIds);
  });

  // There are no asynchronous initialization functions here or in the
  // superclasses. So we can just call them and forge ahead without having
  // to wait around or check for completion.
  this._announceReady(this.NO_ERRORS);
};

/**
 * @see ChannelManager#getChannelIdsForSession
 */
p.getChannelIdsForSession = function (sessionId, callback) {
  var key = this.getKeyForChannelsBySession(sessionId);
  this.config.redisClient.smembers(key, callback);
};

/**
 * @see ChannelManager#addSessionIds
 */
p.addSessionIds = function (channelId, sessionIds, callback) {
  var self = this;
  var key = this.getKeyForSessionsByChannel(channelId);
  if (!Array.isArray(sessionIds)) {
    sessionIds = [sessionIds];
  }

  if (!sessionIds.length) {
    callback();
    return;
  }

  var multi = this.config.redisClient.multi();
  sessionIds.forEach(function (sessionId, index, array) {
    multi.sadd(key, sessionId);
  });
  sessionIds.forEach(function (sessionId, index, array) {
    var thisKey = self.getKeyForChannelsBySession(sessionId);
    multi.sadd(thisKey, channelId);
  });

  var fns = {
    runRedisTransaction: function (asyncCallback) {
      multi.exec(asyncCallback);
    },
    subscribeSessions: function (asyncCallback) {
      self.subscribeSessions(channelId, sessionIds, asyncCallback);
    },
    issueClusterNotice: function (asyncCallback) {
      self.thywill.cluster.sendToAll(self.clusterTask.sessionsAdded, {
        channelId: channelId,
        sessionIds: sessionIds
      });
      asyncCallback();
    }
  };
  async.series(fns, function (error) {
    callback(error);
  });
};

/**
 * @see ChannelManager#removeSessionIds
 */
p.removeSessionIds = function (channelId, sessionIds, callback) {
  var self = this;
  var key = this.getKeyForSessionsByChannel(channelId);
  if (!Array.isArray(sessionIds)) {
    sessionIds = [sessionIds];
  }

  if (!sessionIds.length) {
    callback();
    return;
  }

  var multi = this.config.redisClient.multi();
  sessionIds.forEach(function (sessionId, index, array) {
    multi.srem(key, sessionId);
  });
  sessionIds.forEach(function (sessionId, index, array) {
    var thisKey = self.getKeyForChannelsBySession(sessionId);
    multi.srem(thisKey, channelId);
  });

  var fns = {
    runRedisTransaction: function (asyncCallback) {
      multi.exec(asyncCallback);
    },
    subscribeSessions: function (asyncCallback) {
      self.unsubscribeSessions(channelId, sessionIds, asyncCallback);
    },
    issueClusterNotice: function (asyncCallback) {
      self.thywill.cluster.sendToAll(self.clusterTask.sessionsRemoved, {
        channelId: channelId,
        sessionIds: sessionIds
      });
      asyncCallback();
    }
  };
  async.series(fns, function (error) {
    callback(error);
  });
};

/**
 * @see ChannelManager#clear
 */
p.clear = function (channelId, callback) {
  var self = this;
  this.getSessionIds(channelId, function (error, sessionIds) {
    if (error) {
      callback(error);
    } else {
      self.removeSessionIds(channelId, sessionIds, function (error) {
        callback(error, sessionIds);
      });
    }
  });
};

/**
 * @see ChannelManager#getSessionIds
 */
p.getSessionIds = function (channelId, callback) {
  var key = this.getKeyForSessionsByChannel(channelId);
  this.config.redisClient.smembers(key, callback);
};

//-----------------------------------------------------------
// Methods: utility.
//-----------------------------------------------------------

/**
 * Return a key for the hash storing channel IDs for a specific session.
 *
 * @param {string} sessionId
 * @return {string}
 */
p.getKeyForChannelsBySession = function (sessionId) {
  return this.config.redisPrefix + 'sessionchannelids:' + sessionId;
};

/**
 * Return a key for the hash storing session IDs for a specific channel.
 *
 * @param {string} channelId
 * @return {string}
 */
p.getKeyForSessionsByChannel = function (channelId) {
  return this.config.redisPrefix + 'channelsessionids:' + channelId;
};

/**
 * Subscribe the added sessions.
 *
 * @param {string} channelId
 * @param {array} sessionIds
 * @param {function} callback
 */
p.subscribeSessions = function (channelId, sessionIds, callback) {
  var self = this;
  async.forEach(sessionIds, function (sessionId, asyncCallback) {
    self.subscribeSession(channelId, sessionId, asyncCallback);
  }, callback);
};

/**
 * Subscribe the added session.
 *
 * @param {string} channelId
 * @param {string} sessionId
 * @param {function} callback
 */
p.subscribeSession = function (channelId, sessionId, callback) {
  var self = this;
  this.thywill.clientTracker.connectionIdsForSession(sessionId, function (error, connectionIds) {
    self.thywill.clientInterface.subscribe(connectionIds, channelId, callback);
  });
};

/**
 * Unubscribe the removed sessions.
 *
 * @param {string} channelId
 * @param {array} sessionIds
 * @param {function} callback
 */
p.unsubscribeSessions = function (channelId, sessionIds, callback) {
  var self = this;
  async.forEach(sessionIds, function (sessionId, asyncCallback) {
    self.unsubscribeSession(channelId, sessionId, asyncCallback);
  }, callback);
};

/**
 * Unsubscribe the removed session.
 *
 * @param {string} channelId
 * @param {string} sessionId
 * @param {function} callback
 */
p.unsubscribeSession = function (channelId, sessionId, callback) {
  var self = this;
  this.thywill.clientTracker.connectionIdsForSession(sessionId, function (error, connectionIds) {
    self.thywill.clientInterface.unsubscribe(connectionIds, channelId, callback);
  });
};

/**
 * To be called on connection of a new client, to subscribe it to any channels
 * it belongs to.
 *
 * @param {string} connectionId
 *   A connection ID provided by the clientInterface implementation.
 */
p.subscribeNewConnection = function (connectionId, sessionId) {
  var self = this;
  this.getChannelIdsForSession(sessionId, function (error, channelIds) {
    if (error) {
      self.thywill.log.error(error);
    } else if (channelIds && channelIds.length) {
      self.thywill.clientInterface.subscribe(connectionId, channelIds, function (error) {
        if (error) {
          self.thywill.log.error(error);
        }
      });
    }
  });
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = RedisChannelManager;
