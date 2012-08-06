/**
 * @fileOverview
 * A core configuration file for Thywill. See the base configuration for
 * documentation of all of the various options. The parameters set here
 * are a fraction of those available.
 */

var config = require("../../../serverConfig/thywill/baseThywillConfig");

// Every example application process should run on a different port.
config.thywill.launch.port = 10080;
config.thywill.adminInterface.port = 20080;

// An example application should have its own base path and Socket.IO
// namespace.
config.clientInterface.basePath = "/echo";
config.clientInterface.namespace = "/echo";
// Note that the client resource has no leading /. These must otherwise match.
config.clientInterface.socketClientConfig.resource = "echo/socket.io";
config.clientInterface.socketConfig.global.resource = "/echo/socket.io";
// Resource minification settings.
config.clientInterface.minifyCss = false;
config.clientInterface.minifyJavascript = false;

// Set an appropriate log level for an example application.
config.log.level = "debug";

// Base paths to use when defining new resources for merged CSS and Javascript.
config.minifier.cssBasePath = "/echo/css";
config.minifier.jsBasePath = "/echo/js";

//-----------------------------------------------------------
//Exports - Configuration
//-----------------------------------------------------------

module.exports = config; 
