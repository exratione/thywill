/**
 * @fileOverview
 * A core configuration file for Thywill. See the base configuration for
 * documentation of all of the various options. The parameters set here
 * are a fraction of those available.
 */

var config = require("../../../serverConfig/thywill/baseThywillConfig");

// An example application should have its own base path and Socket.IO
// namespace.
config.clientInterface.baseClientPath = "/echo";
config.clientInterface.namespace = "/echo";
// Note that the client resource has no leading /. These must otherwise match.
config.clientInterface.socketClientConfig.resource = "echo/socket.io";
config.clientInterface.socketConfig.global.resource = "/echo/socket.io";
// Resource minification settings.
config.clientInterface.minifyCss = true;
config.clientInterface.minifyJavascript = false;

// Set the http.Server instance in the start script, not here.
config.clientInterface.server.server = null;
// Set the Socket.IO store instance in the start script as well.
config.clientInterface.socketConfig.global.store = null;

// Set an appropriate log level for an example application.
config.log.level = "debug";

// Base paths to use when defining new resources for merged CSS and Javascript.
config.minifier.cssBaseClientPath = "/echo/css";
config.minifier.jsBaseClientPath = "/echo/js";

//-----------------------------------------------------------
//Exports - Configuration
//-----------------------------------------------------------

module.exports = config;
