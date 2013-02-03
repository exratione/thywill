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
 * A Cluster implementation for single processes - i.e. there is no cluster.
 * Useful for stubbing out and testing cluster code, or otherwise acting as
 * a placeholder.
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
 * Return an array of IDs for the members of this cluster.
 *
 * @return {array}
 */
p.getClusterMemberIds = function () {
  return [this.config.localClusterMemberId];
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
  if (clusterMemberId === this.config.localClusterMemberId) {
    this.emit(taskName, data);
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
  this.emit(taskName, data);
};

/**
 * Send data that will be emitted by the Cluster instance in all cluster
 * members other than this one.
 *
 * @param {string} taskName
 * @param {mixed} data
 */
p.sendToOthers = function (taskName, data) {
  // There are no others.
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = NoCluster;
