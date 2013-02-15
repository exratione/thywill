/**
 * @fileOverview
 * Tell a Thywill server to gracefully prepare for shutdown.
 */

var Thywill = require("thywill");

// Load the Thywill core configuration and start preparation for shutdown.
var thywillConfig = require("./thywillConfig");
Thywill.prepareForShutdown(thywillConfig, function (error) {
  // Do nothing; errors will already be logged.
  //
  // The callback exists to ensure that we wait for completion before returning
  // from this script.
  process.exit(0);
});
