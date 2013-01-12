/**
 * @fileOverview
 * A base configuration for testing Thywill.
 */

var config = require("../../serverConfig/thywill/baseThywillConfig");

// Run on ports that won't collide with any of the other configuration.
config.thywill.adminInterface.port = 40080;

//-----------------------------------------------------------
// Exports - Configuration
//-----------------------------------------------------------

module.exports = config;
