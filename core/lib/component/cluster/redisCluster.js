/**
 * @fileOverview
 * RedisCluster class definition.
 */

var util = require('util');
var childProcess = require('child_process');
var path = require('path');
var async = require('async');
var Thywill = require('thywill');

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A Cluster implementation backed by Redis. Communication between cluster
 * members is managed via Redis publish/subscribe mechanisms.
 *
 * The RedisCluster implementation spawns a separate process to run a heartbeat
 * and check on other cluster member heartbeats via a publish/subscribe
 * channel.
 *
 * The heartbeat runs in a separate process and channel to ensure that it runs
 * on time, and is lagged as little as possible, thus allowed faster detection
 * of cluster member process failures and restarts.
 *
 * @see Cluster
 */
function RedisCluster() {
  RedisCluster.super_.call(this);
}
util.inherits(RedisCluster, Thywill.getBaseClass('Cluster'));
var p = RedisCluster.prototype;

//-----------------------------------------------------------
// 'Static' parameters
//-----------------------------------------------------------

RedisCluster.CONFIG_TEMPLATE = {
  clusterMemberIds: {
    _configInfo: {
      description: 'The IDs of all the cluster members.',
      types: 'array',
      required: true
    }
  },
  communication: {
    _configInfo: {
      description: 'Wrapper for configuration of communication between cluster members.',
      types: 'object',
      required: true
    },
    publishRedisClient: {
      _configInfo: {
        description: 'A Redis client instance from package "redis". This must not be the same instance as the subscribeRedisClient.',
        types: 'object',
        required: true
      }
    },
    subscribeRedisClient: {
      _configInfo: {
        description: 'A Redis client instance from package "redis". This will be used for pub/sub subscriptions, so should not be reused elsewhere.',
        types: 'object',
        required: true
      }
    }
  },
  heartbeat: {
    _configInfo: {
      description: 'Wrapper for heartbeat configuration.',
      types: 'object',
      required: true
    },
    interval: {
      _configInfo: {
        description: 'Milliseconds between broadcast heartbeats for a cluster member.',
        types: 'integer',
        required: true
      }
    },
    timeout: {
      _configInfo: {
        description: 'Milliseconds since the last received heartbeat when a cluster member is presumed dead.',
        types: 'integer',
        required: true
      }
    }
  },
  localClusterMemberId: {
    _configInfo: {
      description: 'The cluster member ID for this process.',
      types: 'string',
      required: true
    }
  },
  redisPrefix: {
    _configInfo: {
      description: 'A prefix used for channels and keys in Redis.',
      types: 'string',
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
  this.allChannel = this.config.redisPrefix + 'all';

  // If the channel emits, then emit from this instance.
  this.config.communication.subscribeRedisClient.on('message', function (channel, json) {
    var data;
    try {
      data = JSON.parse(json);
    } catch (e) {
      self.thywill.log.error(e);
    }
    if (data && data.taskName) {
      // Messages to others are sent to all, but with an 'ignoreIfOriginator' flag.
      if (!data.ignoreIfOriginator || data.clusterMemberId !== self.config.localClusterMemberId) {
        self.emit(data.taskName, data);
      }
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
  // thread to try to ensure that the intervals and time checks runs as much
  // on time as possible.
  this.thywill.on('thywill.ready', function () {
    self.launchHeartbeatProcess();
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
  data = data || {};
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
  data = data || {};
  data.taskName = taskName;
  data.clusterMemberId = this.config.localClusterMemberId;
  this.config.communication.publishRedisClient.publish(this.allChannel, JSON.stringify(data));
};

/**
 * @see Cluster#sendToOthers
 */
p.sendToOthers = function (taskName, data) {
  var self = this;
  data = data || {};
  data.ignoreIfOriginator = true;
  this.sendToAll(taskName, data);
};

//-----------------------------------------------------------
// Methods: Heartbeat process.
//-----------------------------------------------------------

/**
 * Fork a new process to run the heartbeat and heartbeat monitor.
 */
p.launchHeartbeatProcess = function () {
  var self = this;
  // Set up the heartbeat process arguments by converting them to JSON and
  // then a base64 encoded string.
  var heartbeatProcessArguments = {
    clusterMemberIds: this.config.clusterMemberIds,
    heartbeatInterval: this.config.heartbeat.interval,
    heartbeatTimeout: this.config.heartbeat.timeout,
    localClusterMemberId: this.config.localClusterMemberId,
    redisPort: this.config.communication.publishRedisClient.port,
    redisHost: this.config.communication.publishRedisClient.host,
    redisOptions: this.config.communication.publishRedisClient.options,
    redisPrefix: this.config.redisPrefix
  };

  heartbeatProcessArguments = JSON.stringify(heartbeatProcessArguments);
  heartbeatProcessArguments = new Buffer(heartbeatProcessArguments, 'utf8').toString('base64');

  this.heartbeatProcess = childProcess.fork(
    path.join(__dirname, 'redisClusterHeartbeat.js'),
    [heartbeatProcessArguments],
    {
      // Pass over all of the environment.
      env: process.ENV,
      silent: false
    }
  );
  // Listen for messages from the heartbeat child process.
  this.heartbeatProcess.on('message', function (message) {
    self.heartbeatProcessMessage(message);
  });

  // Helper functions added to the child process to manage shutdown.
  this.heartbeatProcess.onUnexpectedExit = function (code, signal) {
    self.thywill.log.error('RedisCluster: heartbeat process terminated with code: ' + code);
    process.exit(1);
  }
  this.heartbeatProcess.shutdown = function () {
    this.removeListener('exit', this.onUnexpectedExit);
    this.kill('SIGTERM');
  }

  // Make sure the child process dies along with this parent process, as far as
  // is possible. I believe a SIGKILL to this process is going to leave the
  // child heartbeat processes hanging for a little while on trying to send the
  // last message over the channel to the now-vanished parent.
  //
  // This combination of items works under most circumstances; e.g. running
  // ordinarily, running as child process in test code, running under a monitor
  // process, etc.
  process.once('SIGTERM', function () {
    self.heartbeatProcess.shutdown();
  });
  process.once('exit', function () {
    self.heartbeatProcess.shutdown();
  });
  // Kind of ugly, but works.
  process.once('uncaughtException', function (error) {
    // If this was the last of the listeners, then shut down the child and
    // rethrow. Our assumption here is that any other code listening for an
    // uncaught exception is going to do the sensible thing and call
    // process.exit().
    if (process.listeners('uncaughtException').length === 0) {
      self.heartbeatProcess.shutdown();
      throw error;
    }
  });

  // If the child process dies, then we have a problem, and need to die also.
  this.heartbeatProcess.on('exit', this.heartbeatProcess.onUnexpectedExit);
};

/**
 * Invoked when a message is sent from the heartbeat process.
 *
 * @param {object} message
 *   A message from the forked heartbeat process.
 */
p.heartbeatProcessMessage = function (message) {
  switch (message.type) {
    case 'log':
      this.thywill.log[message.level](message.message);
      break;

    case 'up':
      if (this.heartbeatStatus[message.clusterMemberId] === this.clusterMemberStatus.DOWN) {
        this.heartbeatStatus[message.clusterMemberId] = this.clusterMemberStatus.UP;
        this.thywill.log.warn('RedisCluster: ' + message.clusterMemberId + ' is up.');
        this.emit(this.eventNames.CLUSTER_MEMBER_UP, {
          clusterMemberId: message.clusterMemberId
        });
      } else if (this.heartbeatStatus[message.clusterMemberId] === this.clusterMemberStatus.UNKNOWN) {
        this.heartbeatStatus[message.clusterMemberId] = this.clusterMemberStatus.UP;
      }
      break;

    case 'down':
      this.heartbeatStatus[message.clusterMemberId] = this.clusterMemberStatus.DOWN;
      this.thywill.log.warn('RedisCluster: ' + message.clusterMemberId + ' is down. ' + message.sinceLast + 'ms since last heartbeat.');
      this.emit(this.eventNames.CLUSTER_MEMBER_DOWN, {
        clusterMemberId: message.clusterMemberId
      });
      break;
  }
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = RedisCluster;
