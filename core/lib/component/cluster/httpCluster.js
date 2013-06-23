/**
 * @fileOverview
 * HttpCluster class definition.
 */

var util = require("util");
var path = require("path");
var async = require("async");
var express = require("express");
var http = require("http");
var request = require("request");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A Cluster implementation that uses HTTP requests for communication
 * between cluster members. Each cluster member sets up its own HTTP server,
 * distinct from anything created by the ClientInterface implementation.
 *
 * If using HttpCluster, make sure that firewalls are set up to allow
 * access to its ports from each cluster member.
 *
 * Each HttpCluster instance queries the others with regular HTTP requests
 * to check on status. Unlike RedisCluster, these checks run in the main
 * Node.js process, and so can be lagged if applications are doing anything
 * computationally expensive that ties up the process so as to prevent it from
 * answering rapidly.
 *
 * Timeout and interval settings should be set with this in mind;
 * experimentation is a good idea.
 *
 * @see Cluster
 */
function HttpCluster() {
  HttpCluster.super_.call(this);
  // Convenience reference.
  this.paths = HttpCluster.PATHS;
}
util.inherits(HttpCluster, Thywill.getBaseClass("Cluster"));
var p = HttpCluster.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

HttpCluster.CONFIG_TEMPLATE = {
  clusterMembers: {
    _configInfo: {
      description: "The cluster member data, with cluster member IDs as keys.",
      types: "object",
      required: true
    }
  },
  upCheck: {
    _configInfo: {
      description: "Wrapper for configuration for checking status of other cluster members.",
      types: "object",
      required: true
    },
    consecutiveFailedChecks: {
      _configInfo: {
        description: "How many consecutive failures in order to consider a server down?",
        types: "integer",
        required: true
      }
    },
    interval: {
      _configInfo: {
        description: "Milliseconds between up checks for a cluster member.",
        types: "integer",
        required: true
      }
    },
    requestTimeout: {
      _configInfo: {
        description: "Milliseconds for timeout of an up check.",
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
  taskRequestTimeout: {
    _configInfo: {
      description: "Milliseconds for timeout of a task request.",
      types: "integer",
      required: true
    }
  }
};

HttpCluster.PATHS = {
  TASK: "/task",
  UP_CHECK: "/alive"
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
  this.clusterMemberIds = Object.keys(this.config.clusterMembers);

  this.clusterMemberCurrentStatus = {};
  this.clusterMemberFailedCheckCounts = {};
  // Cluster member status starts out UNKNOWN - no alerting happens unless
  // status switches from UP to DOWN or vice versa. A switch from UNKNOWN
  // to one of those two does nothing.
  this.clusterMemberIds.forEach(function (clusterMemberId, index, array) {
    self.clusterMemberCurrentStatus[clusterMemberId] = self.clusterMemberStatus.UNKNOWN;
    self.clusterMemberFailedCheckCounts[clusterMemberId] = 0;
  });

  // ----------------------------------------------------
  // Set up the Express server
  // ----------------------------------------------------

  this.app = express();
  // A minimum set of middleware.
  this.app.use(express.bodyParser());
  // Up check route.
  this.app.get(this.paths.UP_CHECK, function (req, res, next) {
    res.send(200, "Alive.");
  });
  // Task delivery route.
  this.app.post(this.paths.TASK, function (req, res, next) {
    res.send(200, "Acknowledged.");
    // Body should just be JSON, which is parsed out into req.body by the
    // middleware.
    if (req.body && req.body.taskName) {
      self.emit(req.body.taskName, req.body);
    }
  });

  // Catch all.
  this.app.all("*", function (req, res, next) {
    res.send(404, "Invalid.");
  });

  // Launch the server, but only after all setup is complete.
  this.thywill.on("thywill.ready", function () {
    var port = self.config.clusterMembers[self.config.localClusterMemberId].port;
    self.server = http.createServer(self.app).listen(port);
  });

  // ----------------------------------------------------
  // Run up checks against other cluster members.
  // ----------------------------------------------------

  // Only start running up checks after all setup is complete. We run checks
  // as a series of setTimeout() calls rather than setInterval() to allow the
  // process to proceed at its own pace, and adjust for lag to response for the
  // other cluster member or lateness to get to the request by this cluster
  // member.
  this.thywill.on("thywill.ready", function () {
    // Start the up checks running against the other cluster members.
    self.clusterMemberIds.forEach(function (clusterMemberId, index, array) {
      if (clusterMemberId !== self.config.localClusterMemberId) {
        setTimeout(function () {
          self._runUpCheck(clusterMemberId);
        }, self.config.upCheck.interval);
      }
    });
  });

  // ----------------------------------------------------
  // Finish up.
  // ----------------------------------------------------

  this._announceReady(this.NO_ERRORS);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Cluster#getClusterMemberIds
 */
p.getClusterMemberIds = function () {
  return this.clusterMemberIds;
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
  return this.clusterMemberCurrentStatus[clusterMemberId];
};

/**
 * @see Cluster#isDesignatedHandlerFor
 */
p.isDesignatedHandlerFor = function (clusterMemberId, callback) {
  // A simplistic implementation that doesn't account for multiple cluster
  // members falling over. The handler is just the next one along in the array
  // of cluster members.
  var index = this.clusterMemberIds.indexOf(clusterMemberId) + 1;
  if (index === this.clusterMemberIds.length) {
    index = 0;
  }
  var isDesignatedHandler = (index === this.clusterMemberIds.indexOf(this.getLocalClusterMemberId()));
  callback(this.NO_ERRORS, isDesignatedHandler);
};

/**
 * @see Cluster#sendTo
 */
p.sendTo = function (clusterMemberId, taskName, data) {
  data = data || {};
  if (!this.config.clusterMembers[clusterMemberId]) {
    return;
  }

  data.taskName = taskName;
  data.clusterMemberId = this.config.localClusterMemberId;

  var self = this;
  var url = "http://" +
    this.config.clusterMembers[clusterMemberId].host +
    ":" + this.config.clusterMembers[clusterMemberId].port +
    this.paths.TASK;
  var options = {
    method: "POST",
    url: url,
    json: data,
    timeout: this.config.taskRequestTimeout
  };

  request(options, function (error, response, body) {
    if (error) {
      // If it's ECONNREFUSED, then the other cluster isn't listening, i.e. we
      // assume it's down. This is expected and shouldn't be logged. Any other
      // sort of error we do want to know about, however.
      if (error.code !== "ECONNREFUSED") {
        self.thywill.log.error(error);
      }
    } else if (response.statusCode !== 200) {
      self.thywill.log.error(new Error("Status code: " + response.statusCode));
    }
  });
};

/**
 * @see Cluster#sendToAll
 */
p.sendToAll = function (taskName, data) {
  data = data || {};
  data.taskName = taskName;
  data.clusterMemberId = this.config.localClusterMemberId;
  this.sendToOthers(taskName, data);
  this.emit(data.taskName, data);
};

/**
 * @see Cluster#sendToOthers
 */
p.sendToOthers = function (taskName, data) {
  data = data || {};
  var self = this;
  this.clusterMemberIds.forEach(function (clusterMemberId, index, array) {
    if (clusterMemberId !== self.config.localClusterMemberId) {
      self.sendTo(clusterMemberId, taskName, data);
    }
  });
};

//-----------------------------------------------------------
// Methods: Up Checks
//-----------------------------------------------------------

/**
 * Start running a sequence of up checks against one of the cluster
 * members.
 *
 * @param {string} clusterMemberId
 *   A cluster member ID.
 */
p._runUpCheck = function (clusterMemberId) {
  var self = this;
  var url = "http://" +
    this.config.clusterMembers[clusterMemberId].host +
    ":" + this.config.clusterMembers[clusterMemberId].port +
    this.paths.UP_CHECK;
  var options = {
    url: url,
    timeout: this.config.upCheck.requestTimeout
  };
  request(options, function (error, response, body) {
    if (error) {
      // If it's ECONNREFUSED, then the other cluster isn't listening, i.e. we
      // assume it's down. This is expected and shouldn't be logged. Any other
      // sort of error we do want to know about, however.
      if (error.code !== "ECONNREFUSED") {
        self.thywill.log.error(error);
      }
      self._upCheckFailure(clusterMemberId);
    }
    // This isn't expected. We should get an error or a 200 response.
    else if (response.statusCode !== 200) {
      //self.thywill.log.error(new Error("Unexpected status code: " + response.statusCode));
      self._upCheckFailure(clusterMemberId);
    }
    // Success, it's up.
    else {
      self._upCheckSuccess(clusterMemberId);
    }

    // Rerun the check after the intervaL.
    setTimeout(function () {
      self._runUpCheck(clusterMemberId);
    }, self.config.upCheck.interval);
  });
};

/**
 * Invoked when an up check fails.
 *
 * @param {string} clusterMemberId
 *   ID of the failed cluster member.
 */
p._upCheckFailure = function (clusterMemberId) {
  this.clusterMemberFailedCheckCounts[clusterMemberId]++;
  // Count this as a failure if we've hit the limit. Going past the limit can
  // be ignored.
  if (this.clusterMemberFailedCheckCounts[clusterMemberId] === this.config.upCheck.consecutiveFailedChecks) {
    // Only send out the notice if we're moving from up to down, not from
    // unknown to down.
    if (this.clusterMemberCurrentStatus[clusterMemberId] === this.clusterMemberStatus.UP) {
      this.clusterMemberCurrentStatus[clusterMemberId] = this.clusterMemberStatus.DOWN;
      this.thywill.log.warn("HttpCluster: " + clusterMemberId + " is down.");
      this.emit(this.eventNames.CLUSTER_MEMBER_DOWN, {
        clusterMemberId: clusterMemberId
      });
    } else if (this.clusterMemberCurrentStatus[clusterMemberId] === this.clusterMemberStatus.UNKNOWN) {
      this.clusterMemberCurrentStatus[clusterMemberId] = this.clusterMemberStatus.DOWN;
    }
  }
};

/**
 * Invoked when an up check succeeds.
 *
 * @param {string} clusterMemberId
 *   ID of the successfully checked cluster member.
 */
p._upCheckSuccess = function (clusterMemberId) {
  // Reset the failure count.
  this.clusterMemberFailedCheckCounts[clusterMemberId] = 0;
  // Notify if we're moving from down to up, but not for unknown to up.
  if (this.clusterMemberCurrentStatus[clusterMemberId] === this.clusterMemberStatus.DOWN) {
    this.clusterMemberCurrentStatus[clusterMemberId] = this.clusterMemberStatus.UP;
    this.thywill.log.warn("HttpCluster: " + clusterMemberId + " is up.");
    this.emit(this.eventNames.CLUSTER_MEMBER_UP, {
      clusterMemberId: clusterMemberId
    });
  } else if (this.clusterMemberCurrentStatus[clusterMemberId] === this.clusterMemberStatus.UNKNOWN) {
    this.clusterMemberCurrentStatus[clusterMemberId] = this.clusterMemberStatus.UP;
  }
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = HttpCluster;
