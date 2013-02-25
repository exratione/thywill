/**
 * @fileOverview
 * A script to launch a Thywill server process running the Calculations
 * example application.
 */

var http = require("http");
var MemoryStore = require("socket.io/lib/stores/memory");
var config = require("../../../serverConfig/thywill/baseThywillConfig");
var Calculations = require("../lib/calculations");
var Thywill = require("thywill");

// ------------------------------------------------------
// Adapt the base configuration for this example.
// ------------------------------------------------------

// An example application should have its own base path and Socket.IO
// namespace.
config.clientInterface.baseClientPath = "/calculations";
config.clientInterface.namespace = "/calculations";
// Create a server and add it to the clientInterface configuration.
config.clientInterface.server.server = http.createServer().listen(10082);

// Note that the client resource has no leading /. These must otherwise match.
config.clientInterface.socketClientConfig.resource = "calculations/socket.io";
config.clientInterface.socketConfig.global.resource = "/calculations/socket.io";
// Create a MemoryStore for Socket.IO.
config.clientInterface.socketConfig.global.store = new MemoryStore();

// Resource minification settings.
config.clientInterface.minifyCss = true;
config.clientInterface.minifyJavascript = true;

// Set an appropriate log level for an example application.
config.log.level = "debug";

// Base paths to use when defining new resources for merged CSS and Javascript.
config.minifier.cssBaseClientPath = "/calculations/css";
config.minifier.jsBaseClientPath = "/calculations/js";

// ------------------------------------------------------
// Other odds and ends.
// ------------------------------------------------------

// Add a trivial catch-all listener. Only really necessary because this is an
// example and there is no other functionality or framework associated with
// this server instance.
config.clientInterface.server.server.on("request", function (req, res) {
  res.statusCode = 404;
  res.end("No such resource.");
});

// Instantiate an application object.
var calculations = new Calculations("calculations");

// ------------------------------------------------------
// Launch Thywill.
// ------------------------------------------------------

// And off we go: launch a Thywill instance to run the the application.
Thywill.launch(config, calculations, function (error, thywill) {
  if (error) {
    if (error instanceof Error) {
      error = error.stack;
    }
    console.error("Thywill launch failed with error: " + error);
    process.exit(1);
  } else {
    thywill.log.info("Thywill is ready to run the Calculations example application.");
  }
});
