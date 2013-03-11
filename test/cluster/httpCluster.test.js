/**
 * @fileOverview
 * Vows tests for the RedisCluster component.
 *
 * These are cluster tests using Express, Redis, and multiple Thywill
 * processes.
 */

var clone = require("clone");
var tools = require("../lib/tools");
var clusterConfig = require("../config/clusterTestThywillConfig");

var config = clone(clusterConfig);

config.cluster = {
  implementation: {
    type: "core",
    name: "httpCluster"
  },
  // The cluster has two members.
  clusterMembers: {
    "alpha": {
      host: "127.0.0.1",
      port: 20091
    },
    "beta": {
      host: "127.0.0.1",
      port: 20092
    }
  },
  upCheck: {
    consecutiveFailedChecks: 2,
    interval: 200,
    requestTimeout: 500
  },
  // The local member name is filled in later.
  localClusterMemberId: undefined,
  taskRequestTimeout: 500
};

// Obtain a test suit that launches Thywill.
var suite = tools.createVowsSuiteForCluster("Cluster: cluster/httpCluster", {
  config: config,
  applications: null,
  useExpress: true,
  useRedis: true
});
tools.addBatches(suite, "cluster", "cluster");

//-----------------------------------------------------------
// Exports - Vows test suite
//-----------------------------------------------------------

module.exports.suite = suite;
