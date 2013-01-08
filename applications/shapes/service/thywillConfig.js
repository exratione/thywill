/**
 * @fileOverview
 * A core configuration file for Thywill. See the base configuration for
 * documentation of all of the various options. The parameters set here
 * are a fraction of those available.
 */

var config = require("../../../serverConfig/thywill/baseThywillConfig");

// Every example application process should run on a different port.
config.thywill.launch.port = 10081;
config.thywill.adminInterface.port = 20081;

// An example application should have its own base path and Socket.IO
// namespace.
config.clientInterface.baseClientPath = "/shapes";
config.clientInterface.namespace = "/shapes";

// Using Express sessions.
config.clientInterface.sessions = {
  type: "express",
  // The rest of the sessions configuration is set in start.js, as that is
  // where Express is set up and configured.
  app: null,
  store: null,
  cookieKey: null,
  cookieSecret: null
};

// Note that the client resource has no leading /. These must otherwise match.
config.clientInterface.socketClientConfig.resource = "shapes/socket.io";
config.clientInterface.socketConfig.global.resource = "/shapes/socket.io";
// Resource minification settings.
config.clientInterface.minifyCss = false;
config.clientInterface.minifyJavascript = false;

// Set an appropriate log level for an example application.
config.log.level = "debug";

// Base paths to use when defining new resources for merged CSS and Javascript.
config.minifier.cssBaseClientPath = "/shapes/css";
config.minifier.jsBaseClientPath = "/shapes/js";

// Specify use of an EmberStore component. Since this is in extras, the component
// is optional: only created and initialized at all because it appears here.
config.emberStore = {
  // Specify the in-memory implementation.
  implementation: {
    type: "extra",
    name: "inMemoryEmberStore"
  }
};

/*
// Use the linkedFileResourceManager in place of the default in-memory
// implementation, allowing Nginx to serve resources as static files.
config.resourceManager = {
  implementation: {
    type: "core",
    name: "linkedFileResourceManager"
  },
  // The filesystem directory to which resources are written.
  baseDirectory: "/home/node/thywill-static",
  // A base path prepended to provided resource paths.
  baseClientPath: "/thywill-static"
};
*/

//-----------------------------------------------------------
//Exports - Configuration
//-----------------------------------------------------------

module.exports = config;
