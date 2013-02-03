/**
 * @fileOverview
 * Cluster class definition.
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

function Cluster() {
  Cluster.super_.call(this);
  this.componentType = "cluster";
}
util.inherits(Cluster, Thywill.getBaseClass("Component"));
var p = Cluster.prototype;

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
 * Return an array of cluster member IDs.
 *
 * @return {array}
 */
p.getClusterMemberIds = function () {
  throw new Error("Not implemented.");
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
  throw new Error("Not implemented.");
};

/**
 * Send data that will be emitted by the Cluster instance in all cluster
 * members.
 *
 * @param {string} taskName
 * @param {mixed} data
 */
p.sendToAll = function (taskName, data) {
  throw new Error("Not implemented.");
};

/**
 * Send data that will be emitted by the Cluster instance in all cluster
 * members other than this one.
 *
 * @param {string} taskName
 * @param {mixed} data
 */
p.sendToOthers = function (taskName, data) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Cluster;
