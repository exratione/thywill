/**
 * @fileOverview
 * NoCluster class definition.
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A Cluster implementation for single process backends or multiple process
 * backends that don't need to be cluster-aware.
 *
 * @see Cluster
 */
function NoCluster() {
  NoCluster.super_.call(this);
}
util.inherits(NoCluster, Thywill.getBaseClass("Cluster"));
var p = NoCluster.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

NoCluster.CONFIG_TEMPLATE = {
  localClusterMemberId: {
    _configInfo: {
      description: "The cluster member ID for this process.",
      types: "string",
      required: true
    }
  }
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Cluster#getClusterMemberIds
 */
p.getClusterMemberIds = function () {
  return [this.config.localClusterMemberId];
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
p.getClusterMemberStatus = function (clusterMemberId) {
  if (clusterMemberId === this.config.localClusterMemberId) {
    return this.clusterMemberStatus.UP;
  } else {
    return this.clusterMemberStatus.UNKNOWN;
  }
};

/**
 * @see Cluster#sendTo
 */
p.sendTo = function (clusterMemberId, taskName, data) {
  if (clusterMemberId === this.config.localClusterMemberId) {
    data.taskName = taskName;
    data.clusterMemberId = this.config.localClusterMemberId;
    this.emit(taskName, data);
  }
};

/**
 * @see Cluster#sendToAll
 */
p.sendToAll = function (taskName, data) {
  data.taskName = taskName;
  data.clusterMemberId = this.config.localClusterMemberId;
  this.emit(taskName, data);
};

/**
 * @see Cluster#sendToOthers
 */
p.sendToOthers = function (taskName, data) {
  // There are no others.
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = NoCluster;
