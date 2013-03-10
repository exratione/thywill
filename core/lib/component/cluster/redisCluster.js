/**
 * @fileOverview
 * RedisCluster class definition.
 */

var util = require("util");
var path = require("path");
var async = require("async");
var clusterMaster = require("cluster-master");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A Cluster implementation backed by Redis. Communication between cluster
 * members is managed via Redis publish/subscribe mechanisms.
 *
 * The RedisCluster implementation spawns a separate process via the Node.js
 * code cluster functionality to run a heartbeat and check on other cluster
 * member heartbeats.
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
  communication: {
    _configInfo: {
      description: "Wrapper for configuration of communication between cluster members.",
      types: "object",
      required: true
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
  },
  heartbeat: {
    _configInfo: {
      description: "Wrapper for heartbeat configuration.",
      types: "object",
      required: true
    },
    interval: {
      _configInfo: {
        description: "Milliseconds between broadcast heartbeats for a cluster member.",
        types: "integer",
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
    },
    timeout: {
      _configInfo: {
        description: "Milliseconds since the last received heartbeat when a cluster member is presumed dead.",
        types: "integer",
        required: true
      }
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
  this.config.communication.subscribeRedisClient.on("message", function (channel, json) {
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
  // Set up heartbeats via the same pub/sub mechanism.
  // ---------------------------------------------------------

  this.heartbeatTimestamps = {};
  this.heartbeatStatus = {};
  // Cluster member status starts out UNKNOWN - no alerting happens unless
  // status switches from UP to DOWN or vice versa. A switch from UNKNOWN
  // to one of those two does nothing.
  this.config.clusterMemberIds.forEach(function (clusterMemberId, index, array) {
    self.heartbeatStatus[clusterMemberId] = self.clusterMemberStatus.UNKNOWN;
  });

  // Only start the heartbeat after the expensive setup stuff is done and
  // Thywill is ready, otherwise there might be all sorts of blocking issues
  // taking place to disrupt timing.
  //
  // As things stand, we still throw off heartbeat management into a separate
  // thread to try to ensure it runs on time.
  this.thywill.on("thywill.ready", function () {

    /**
     * Invoked when a message is sent from the heartbeat process.
     *
     * @param {string} message
     *   A JSON string from the process.
     */
    function heartbeatProcessMessage (message) {
      try {
        message = JSON.parse(message);
      } catch (e) {
        self.thywill.log.error(e);
        return;
      }

      switch (message.type) {
        case "log":
          self.thywill.log[message.level](message.message);
          break;

        case "up":
          if (self.heartbeatStatus[message.clusterMemberId] === self.clusterMemberStatus.DOWN) {
            self.heartbeatStatus[message.clusterMemberId] = self.clusterMemberStatus.UP;
            self.thywill.log.warn("RedisCluster: " + message.clusterMemberId + " is up.");
            self.emit(self.eventNames.CLUSTER_MEMBER_UP, {
              clusterMemberId: message.clusterMemberId
            });
          } else if (self.heartbeatStatus[message.clusterMemberId] === self.clusterMemberStatus.UNKNOWN) {
            self.heartbeatStatus[message.clusterMemberId] = self.clusterMemberStatus.UP;
          }
          break;

        case "down":
          self.heartbeatStatus[message.clusterMemberId] = self.clusterMemberStatus.DOWN;
          self.thywill.log.warn("RedisCluster: " + message.clusterMemberId + " is down. " + message.sinceLast + "ms since last heartbeat.");
          self.emit(self.eventNames.CLUSTER_MEMBER_DOWN, {
            clusterMemberId: message.clusterMemberId
          });
          break;
      }
    }

    // Set up the heartbeat process arguments by converting them to JSON and
    // then a base64 encoded string.
    var heartbeatProcessArguments = {
      clusterMemberIds: self.config.clusterMemberIds,
      heartbeatInterval: self.config.heartbeat.interval,
      heartbeatTimeout: self.config.heartbeat.timeout,
      localClusterMemberId: self.config.localClusterMemberId,
      redisPort: self.config.communication.publishRedisClient.port,
      redisHost: self.config.communication.publishRedisClient.host,
      redisOptions: self.config.communication.publishRedisClient.options,
      redisPrefix: self.config.redisPrefix
    };

    heartbeatProcessArguments = JSON.stringify(heartbeatProcessArguments);
    heartbeatProcessArguments = new Buffer(heartbeatProcessArguments, "utf8").toString("base64");

    clusterMaster({
      exec: path.join(__dirname, "redisClusterHeartbeat.js"),
      size: 1,
      // Pass over all of the environment.
      env: process.ENV,
      args: [heartbeatProcessArguments],
      silent: false,
      signals: false,
      onMessage: heartbeatProcessMessage
    });
  });

  // ---------------------------------------------------------
  // Subscribe to the channels to start picking up tasks.
  // ---------------------------------------------------------

  var fns = [
    function (asyncCallback) {
      self.config.communication.subscribeRedisClient.subscribe(self.channels[self.config.localClusterMemberId], asyncCallback);
    },
    function (asyncCallback) {
      self.config.communication.subscribeRedisClient.subscribe(self.allChannel, asyncCallback);
    },
    function (asyncCallback) {
      self.config.heartbeat.subscribeRedisClient.subscribe(self.heartbeatChannel, asyncCallback);
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
    this.config.communication.publishRedisClient.publish(this.channels[clusterMemberId], JSON.stringify(data));
  }
};

/**
 * @see Cluster#sendToAll
 */
p.sendToAll = function (taskName, data) {
  data.taskName = taskName;
  data.clusterMemberId = this.config.localClusterMemberId;
  this.config.communication.publishRedisClient.publish(this.allChannel, JSON.stringify(data));
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
      self.config.communication.publishRedisClient.publish(self.channels[clusterMemberId], JSON.stringify(data));
    }
  });
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = RedisCluster;
