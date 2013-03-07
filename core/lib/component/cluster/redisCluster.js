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
 * A Cluster implementation backed by Redis. Communication between cluster
 * members is managed via Redis publish/subscribe mechanisms.
 *
 * @see Cluster
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
  heartbeatInterval: {
    _configInfo: {
      description: "Milliseconds between broadcast heartbeats for a cluster member.",
      types: "integer",
      required: true
    }
  },
  heartbeatTimeout: {
    _configInfo: {
      description: "Milliseconds since the last received heartbeat when a cluster member is presumed dead.",
      types: "integer",
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
  publishRedisClient: {
    _configInfo: {
      description: "A Redis client instance from package 'redis'. This must not be the same instance as the subscribeRedisClient.",
      types: "object",
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
  this.thywill = thywill;
  this.config = config;
  this.readyCallback = callback;

  // ---------------------------------------------------------
  // Set up cluster communication via pub/sub.
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // Set up heartbeats via the pub/sub mechanism.
  // ---------------------------------------------------------

  this.heartbeatTaskName = "thywill:cluster:heartbeat";
  this.heartbeatTimestamps = {};
  this.heartbeatStatus = {};
  // Cluster member status starts out UNKNOWN - no alerting happens unless
  // status switches from UP to DOWN or vice versa. A switch from UNKNOWN
  // to one of those two does nothing.
  this.config.clusterMemberIds.forEach(function (clusterMemberId, index, array) {
    self.heartbeatStatus[clusterMemberId] = self.clusterMemberStatus.UNKNOWN;
  });

  // Only start after the expensive setup stuff is done and Thywill is ready,
  // otherwise there might be all sorts of blocking issues taking place.
  this.thywill.on("thywill.ready", function () {
    // Set a process to detect failed heartbeats by timeout.
    self.heartbeatCheckIntervalId = setInterval(function () {
      // We only check timestamps that have previously arrived - properties of
      // the timestamps object aren't set until the first heartbeat from a given
      // cluster member. This makes things less confused during startup of
      // multiple processes.
      var timeoutTimestamp = Date.now() - self.config.heartbeatTimeout;
      for (var clusterMemberId in self.heartbeatTimestamps) {
        if (self.heartbeatTimestamps[clusterMemberId] < timeoutTimestamp) {
          // Only emit an alert if the cluster member was previously noted as up.
          if (self.heartbeatStatus[clusterMemberId] === self.clusterMemberStatus.UP) {
            self.emit(self.taskNames.CLUSTER_MEMBER_DOWN, {
              clusterMemberId: clusterMemberId
            });
          }
          self.heartbeatStatus[clusterMemberId] = self.clusterMemberStatus.DOWN;
        }
      }
    }, self.config.heartbeatInterval);

    // Emit heartbeats at an interval.
    self.heartbeatIntervalId = setInterval(function () {
      self.sendToOthers(self.heartbeatTaskName, {
        clusterMemberId: self.getLocalClusterMemberId()
      });
    }, self.config.heartbeatInterval);

    // Listen for heartbeats from other cluster members and update the local
    // timestamps.
    self.on(self.heartbeatTaskName, function (data) {
      self.heartbeatTimestamps[data.clusterMemberId] = Date.now();
      // If that cluster member was down, emit a note that it's up.
      if (self.heartbeatStatus[data.clusterMemberId] === self.clusterMemberStatus.DOWN) {
        self.emit(self.taskNames.CLUSTER_MEMBER_UP, {
          clusterMemberId: data.clusterMemberId
        });
      }
      self.heartbeatStatus[data.clusterMemberId] = self.clusterMemberStatus.UP;
    });
  });

  // ---------------------------------------------------------
  // Subscribe to the channels to start picking up tasks.
  // ---------------------------------------------------------

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
 * @see Cluster#getClusterMemberIds
 */
p.getClusterMemberIds = function () {
  return this.config.clusterMemberIds;
};

/**
 * @see Cluster#getLocalClusterMemberId
 */
p.getLocalClusterMemberId = function () {
  return this.config.localClusterMemberId;
};

/**
 * @see Cluster#getClusterMemberStatus
 */
p.getClusterMemberStatus = function (clusterMemberId, callback) {
  callback(this.NO_ERRORS, this.getClusterMemberStatusSync(clusterMemberId));
};

/**
 * Since cluster member status is maintained in memory, the async method isn't
 * required for this implementation.
 *
 * @see Cluster#getClusterMemberStatus
 */
p.getClusterMemberStatusSync = function (clusterMemberId) {
  return this.heartbeatStatus[clusterMemberId];
};

/**
 * @see Cluster#isDesignatedHandlerFor
 */
p.isDesignatedHandlerFor = function (clusterMemberId, callback) {
  // A simplistic implementation that doesn't account for multiple cluster
  // members falling over. The handler is just the next one along in the array
  // of cluster members.
  var index = this.config.clusterMemberIds.indexOf(clusterMemberId) + 1;
  if (index === this.config.clusterMemberIds.length) {
    index = 0;
  }
  var isDesignatedHandler = (index === this.config.clusterMemberIds.indexOf(this.getLocalClusterMemberId()));
  callback(this.NO_ERRORS, isDesignatedHandler);
};

/**
 * @see Cluster#sendTo
 */
p.sendTo = function (clusterMemberId, taskName, data) {
  data.taskName = taskName;
  data.clusterMemberId = this.config.localClusterMemberId;
  if (clusterMemberId === this.config.localClusterMemberId) {
    this.emit(taskName, data);
  } else if (this.channels[clusterMemberId]) {
    this.config.publishRedisClient.publish(this.channels[clusterMemberId], JSON.stringify(data));
  }
};

/**
 * @see Cluster#sendToAll
 */
p.sendToAll = function (taskName, data) {
  data.taskName = taskName;
  data.clusterMemberId = this.config.localClusterMemberId;
  this.config.publishRedisClient.publish(this.allChannel, JSON.stringify(data));
};

/**
 * @see Cluster#sendToOthers
 */
p.sendToOthers = function (taskName, data) {
  var self = this;
  data.taskName = taskName;
  data.clusterMemberId = this.config.localClusterMemberId;
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
