/**
 * @fileOverview
 * This script runs the RedisCluster heartbeat.
 *
 * It is launched by RedisCluster to run in a separate process.
 *
 * This is done to ensure that cluster heartbeats run on time no matter
 * what is going on in the main Thywill process. Thus heartbeats can be
 * modestly fast - bearing in mind that they run via Redis pub/sub and are
 * thus subject to any latency that might arise there.
 */

var cluster = require("cluster");
var redis = require("redis");
var Thywill = require("thywill");
var ThywillCluster = Thywill.getBaseClass("Cluster");

// --------------------------------------------------
// Functions
// --------------------------------------------------

/**
 * Send a message back to the parent process.
 *
 * @param {mixed} data
 *   The data to send as a message.
 */
function sendMessage (data) {
  process.send(JSON.stringify(data));
}

/**
 * Send a message that will get written to the log in the parent process.
 *
 * @param {Error|string} message
 *   The log message.
 * @param {string} level
 *   The log level, one of those supported by Thywill.
 */
function sendLog (message, level) {
  if (message instanceof Error) {
    message = message.stack;
  }
  sendMessage({
    type: "log",
    level: level,
    message: message
  });
}

// Various log level shortcuts.
var log = {
  debug: function (message) {
    sendLog(message, "debug");
  },
  info: function (message) {
    sendLog(message, "info");
  },
  warn: function (message) {
    sendLog(message, "warn");
  },
  error: function (message) {
    sendLog(message, "error");
  }
};

/**
 * When a cluster member state changes, send an update.
 *
 * @return {string} clusterMemberId
 *   ID of the cluster member that changed status.
 * @return {number} sinceLast
 *   Milliseconds since last heartbeat.
 */
function sendDown (clusterMemberId, sinceLast) {
  sendMessage({
    type: "down",
    clusterMemberId: clusterMemberId,
    sinceLast: sinceLast
  });
}

/**
 * When a cluster member state changes, send an update.
 *
 * @return {string} clusterMemberId
 *   ID of the cluster member that changed status.
 * @return {string} status
 *   The new status.
 */
function sendUp (clusterMemberId) {
  sendMessage({
    type: "up",
    clusterMemberId: clusterMemberId
  });
}

// --------------------------------------------------
// Arguments
// --------------------------------------------------

// Arguments arrive as a base64 encoded JSON string.
// {
//   clusterMemberIds: array,
//   heartbeatInterval: number,
//   heartbeatTimeout: number,
//   localClusterMemberId: string,
//   redisPort: number,
//   redisHost: string,
//   redisOptions: object,
//   redisPrefix: string
// };
var args = new Buffer(process.argv[2], "base64").toString("utf8");
args = JSON.parse(args);

// --------------------------------------------------
// Redis Connections
// --------------------------------------------------

var subscribeRedisClient = redis.createClient(args.redisPort, args.redisHost, args.redisOptions);
var publishRedisClient = redis.createClient(args.redisPort, args.redisHost, args.redisOptions);
// Dummy instance to use for protecting these clients. This is somewhat hacky and fragile.
var thywill = new Thywill();
thywill.log = log;
thywill.protectRedisClient(subscribeRedisClient);
thywill.protectRedisClient(publishRedisClient);

// --------------------------------------------------
// Heartbeat
// --------------------------------------------------

var heartbeatChannel = args.redisPrefix + "heartbeat";
var heartbeatTimestamps = {};
var heartbeatStatus = {};
// Cluster member status starts out UNKNOWN - no alerting happens unless
// status switches from UP to DOWN or vice versa. A switch from UNKNOWN
// to one of those two does nothing.
args.clusterMemberIds.forEach(function (clusterMemberId, index, array) {
  heartbeatStatus[clusterMemberId] = ThywillCluster.CLUSTER_MEMBER_STATUS.UNKNOWN;
});

// Set a process to detect failed heartbeats by timeout.
var heartbeatCheckIntervalId = setInterval(function () {
  // We only check timestamps that have previously arrived - properties of
  // the timestamps object aren't set until the first heartbeat from a given
  // cluster member. This makes things less confused during startup of
  // multiple processes.
  for (var clusterMemberId in heartbeatTimestamps) {
    // Only bother checking those that are marked up.
    if (heartbeatStatus[clusterMemberId] !== ThywillCluster.CLUSTER_MEMBER_STATUS.UP) {
      return;
    }
    var sinceLast = Date.now() - heartbeatTimestamps[clusterMemberId];
    if (sinceLast > args.heartbeatTimeout) {
      heartbeatStatus[clusterMemberId] = ThywillCluster.CLUSTER_MEMBER_STATUS.DOWN;
      sendDown(clusterMemberId, sinceLast);
    }
  }
}, args.heartbeatInterval);

// Emit heartbeats at an interval.
var lastHeartbeat;
var lagDelay = 1.5 * args.heartbeatInterval;
var heartbeatIntervalId = setInterval(function () {
  var timestamp = Date.now();
  if (lastHeartbeat) {
    var since = timestamp - lastHeartbeat;
    if (since > lagDelay) {
      log.debug(
        "RedisClusterHeartbeat: heartbeat interval is lagging: " +
        since + "ms since last and should be " + args.heartbeatInterval + "ms."
      );
    }
  }
  lastHeartbeat = timestamp;
  publishRedisClient.publish(heartbeatChannel, args.localClusterMemberId);
}, args.heartbeatInterval);

// Listen for heartbeats from other cluster members and update the local
// timestamps and status accordingly.
subscribeRedisClient.subscribe(heartbeatChannel);
subscribeRedisClient.on("message", function (channel, clusterMemberId) {
  // Ignore the heartbeat for this process.
  if (clusterMemberId === args.localClusterMemberId) {
    return;
  }

  heartbeatTimestamps[clusterMemberId] = Date.now();
  // If that cluster member was in down or unknown status, then note the status change.
  if (heartbeatStatus[clusterMemberId] !== ThywillCluster.CLUSTER_MEMBER_STATUS.UP) {
    heartbeatStatus[clusterMemberId] = ThywillCluster.CLUSTER_MEMBER_STATUS.UP;
    sendUp(clusterMemberId);
  }
});
