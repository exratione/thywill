/**
 * @fileOverview
 * RedisCluster class definition.
 */

var util = require("util");
var async = require("async");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A Cluster implementation for single processes - i.e. there is no cluster.
 * Useful for stubbing out and testing cluster code, or otherwise acting as
 * a placeholder.
 */
function RedisCluster() {
  RedisCluster.super_.call(this);
}
util.inherits(RedisCluster, Thywill.getBaseClass("Cluster"));
var p = RedisCluster.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

RedisCluster.CONFIG_TEMPLATE = {
  clusterMemberIds: {
    _configInfo: {
      description: "The IDs of all the cluster members.",
      types: "array",
      required: true
    }
  },
  localClusterMemberId: {
    _configInfo: {
      description: "The cluster member ID for this process.",
      types: "string",
      required: true
    }
  },
  redisPrefix: {
    _configInfo: {
      description: "A prefix used for channels and keys in Redis.",
      types: "string",
      required: true
    }
  },
  publishRedisClient: {
    _configInfo: {
      description: "A Redis client instance from package 'redis'. This must not be the same instance as the subscribeRedisClient.",
      types: "object",
      required: true
    }
  },
  subscribeRedisClient: {
    _configInfo: {
      description: "A Redis client instance from package 'redis'. This will be used for pub/sub subscriptions, so should not be reused elsewhere.",
      types: "object",
      required: true
    }
  }
};

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

/**
 * @see Component#_configure
 */
p._configure = function (thywill, config, callback) {
  var self = this;
  // Minimal configuration setup.
  this.thywill = thywill;
  this.config = config;
  this.readyCallback = callback;

  // Define channel names.
  this.channels = {};
  this.config.clusterMemberIds.forEach(function (clusterMemberId, index, array) {
    self.channels[clusterMemberId] = self.config.redisPrefix + clusterMemberId;
  });
  this.allChannel = this.config.redisPrefix + "all";

  // If the channel emits, then emit from this instance.
  this.config.subscribeRedisClient.on("message", function (channel, json) {
    var data;
    try {
      data = JSON.parse(json);
    } catch (e) {
      self.thywill.log.error(e);
    }
    if (data) {
      self.emit(data.taskName, data);
    }
  });

  // Subscribe to channels for all cluster members and this one.
  var fns = [
    function (asyncCallback) {
      self.config.subscribeRedisClient.subscribe(self.channels[self.config.localClusterMemberId], asyncCallback);
    },
    function (asyncCallback) {
      self.config.subscribeRedisClient.subscribe(self.allChannel, asyncCallback);
    }
  ];
  async.series(fns, function (error) {
    self._announceReady(error);
  });
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * Return an array of IDs for the members of this cluster.
 *
 * @return {array}
 */
p.getClusterMemberIds = function () {
  return this.config.clusterMemberIds;
};

/**
 * Send data that will be emitted by the Cluster instance on the specific
 * cluster member.
 *
 * @param {string} clusterMemberId
 * @param {string} taskName
 * @param {mixed} data
 */
p.sendTo = function (clusterMemberId, taskName, data) {
  data.taskName = taskName;
  if (clusterMemberId === this.config.localClusterMemberId) {
    this.emit(taskName, data);
  } else if (this.channels[clusterMemberId]) {
    this.config.publishRedisClient.publish(this.channels[clusterMemberId], JSON.stringify(data));
  }
};

/**
 * Send data that will be emitted by the Cluster instance in all cluster
 * members.
 *
 * @param {string} taskName
 * @param {mixed} data
 */
p.sendToAll = function (taskName, data) {
  data.taskName = taskName;
  this.config.publishRedisClient.publish(this.allChannel, JSON.stringify(data));
};

/**
 * Send data that will be emitted by the Cluster instance in all cluster
 * members other than this one.
 *
 * @param {string} taskName
 * @param {mixed} data
 */
p.sendToOthers = function (taskName, data) {
  var self = this;
  data.taskName = taskName;
  this.config.clusterMemberIds.forEach(function (clusterMemberId, index, array) {
    if (clusterMemberId !== self.config.localClusterMemberId) {
      self.config.publishRedisClient.publish(self.channels[clusterMemberId], JSON.stringify(data));
    }
  });
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = RedisCluster;
