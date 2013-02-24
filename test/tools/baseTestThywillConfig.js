/**
 * @fileOverview
 * A base configuration for testing Thywill.
 */

var config = require("../../serverConfig/thywill/baseThywillConfig");

// The port to listen on.
config.thywill.port = 10079;

//-----------------------------------------------------------
// Exports - Configuration
//-----------------------------------------------------------

module.exports = config;
