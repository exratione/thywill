/**
 * @fileOverview
 * Cluster class definition.
 */

var util = require("util");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * Superclass for Cluster functionality.
 *
 * Communication between cluster member processes is managed by sending tasks,
 * and listening on the Cluster implementation instance for events emitted with
 * specific task names and data.
 *
 * e.g. Process A sends a task to process B:
 *
 * cluster.sendTo("B", "doThisThing", { thing: "stuff" });
 *
 * Process B listens for such tasks as follows:
 *
 * thywill.cluster.on("doThisThing", function (data) {
 *   // Do work here.
 * }
 *
 * A cluster implementation must emit events when other cluster members go
 * down or come up again. To listen on these events:
 *
 * thywill.cluster.on(thywill.cluster.eventNames.CLUSTER_MEMBER_DOWN, function (data) {
 *   console.log("Cluster process down: " + data.clusterMemberId);
 * });
 *
 * thywill.cluster.on(thywill.cluster.eventNames.CLUSTER_MEMBER_UP, function (data) {
 *   console.log("Cluster process up: " + data.clusterMemberId);
 * });
 *
 */
function Cluster() {
  Cluster.super_.call(this);
  this.componentType = "cluster";

  // Useful shortcuts.
  this.clusterMemberStatus = Cluster.CLUSTER_MEMBER_STATUS;
  this.eventNames = Cluster.EVENT_NAMES;
}
util.inherits(Cluster, Thywill.getBaseClass("Component"));
var p = Cluster.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

Cluster.EVENT_NAMES = {
  CLUSTER_MEMBER_DOWN: "thywill.cluster.down",
  CLUSTER_MEMBER_UP: "thywill.cluster.up"
};

Cluster.CLUSTER_MEMBER_STATUS = {
  DOWN: false,
  UNKNOWN: undefined,
  UP: true
};

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
 * Return the cluster member ID for this process.
 *
 * @return {string}
 */
p.getLocalClusterMemberId = function () {
  throw new Error("Not implemented.");
};

/**
 * Return the status of the cluster member, as seen by this cluster member.
 *
 * @param {string} clusterMemberId
 *   A cluster member ID.
 * @param {function} callback
 *   Of the form function (error, status).
 */
p.getClusterMemberStatus = function (clusterMemberId, callback) {
  throw new Error("Not implemented.");
};

/**
 * Is this process the designated handler for issues that the indicated cluster
 * member can't or shouldn't handle. E.g. cleanup that must happen immediately
 * on process failure, and cannot wait for the process itself to restart and
 * do that.
 *
 * Only one process is the designated handler for a given other process.
 *
 * This function exists because every cluster member is notified when one
 * member fails, but in some cases you don't want every remaining cluster
 * member to take action.
 *
 * @param {string} clusterMemberId
 *   The cluster member in need of handling.
 * @param {function} callback
 *   Of the form function (error, boolean).
 */
p.isDesignatedHandlerFor = function (clusterMemberId, callback) {
  throw new Error("Not implemented.");
};

/**
 * Send data that will be emitted by the Cluster instance on the specific
 * cluster member.
 *
 * @param {string} clusterMemberId
 *   The specified destination cluster member.
 * @param {string} taskName
 *   The name of the event that will be emitted.
 * @param {mixed} data
 *   Data that will be emitted with the event.
 */
p.sendTo = function (clusterMemberId, taskName, data) {
  throw new Error("Not implemented.");
};

/**
 * Send data that will be emitted by the Cluster instance in all cluster
 * members.
 *
 * @param {string} taskName
 *   The name of the event that will be emitted.
 * @param {mixed} data
 *   Data that will be emitted with the event.
 */
p.sendToAll = function (taskName, data) {
  throw new Error("Not implemented.");
};

/**
 * Send data that will be emitted by the Cluster instance in all cluster
 * members other than this one.
 *
 * @param {string} taskName
 *   The name of the event that will be emitted.
 * @param {mixed} data
 *   Data that will be emitted with the event.
 */
p.sendToOthers = function (taskName, data) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Cluster;
