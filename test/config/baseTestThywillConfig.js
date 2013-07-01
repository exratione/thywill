/**
 * @fileOverview
 * A base configuration for testing Thywill.
 *
 * This uses in-memory implementations and does not require a Redis server to
 * be present.
 */

var config = require('../../serverConfig/thywill/baseThywillConfig');

// The port to listen on.
config.thywill.ports = {
  alpha: 10079
};

// Local cluster member ID, to match up to the port.
config.cluster.localClusterMemberId = 'alpha';

//-----------------------------------------------------------
// Exports - Configuration
//-----------------------------------------------------------

module.exports = config;
