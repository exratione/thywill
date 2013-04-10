/**
 * @fileOverview
 * A script to launch a Thywill server process running the Echo example
 * application.
 */

var http = require("http");
var MemoryStore = require("socket.io/lib/stores/memory");
var config = require("../../../serverConfig/thywill/baseThywillConfig");
var Echo = require("../lib/echo");
var Thywill = require("thywill");

// ------------------------------------------------------
// Adapt the base configuration for this example.
// ------------------------------------------------------

// An example application should have its own base path and Socket.IO
// namespace.
config.clientInterface.baseClientPath = "/echo";
config.clientInterface.namespace = "/echo";
// Create a server and add it to the clientInterface configuration.
config.clientInterface.server.server = http.createServer().listen(10080);

// Note that the client resource has no leading /. These must otherwise match.
config.clientInterface.socketClientConfig.resource = "echo/socket.io";
config.clientInterface.socketConfig.global.resource = "/echo/socket.io";
// Create a MemoryStore for Socket.IO.
config.clientInterface.socketConfig.global.store = new MemoryStore();

// Resource minification settings.
config.clientInterface.minifyCss = true;
config.clientInterface.minifyJavascript = true;

// Set an appropriate log level for an example application.
config.log.level = "debug";

// Base paths to use when defining new resources for merged CSS and Javascript.
config.minifier.cssBaseClientPath = "/echo/css";
config.minifier.jsBaseClientPath = "/echo/js";

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
var echo = new Echo("echo");

// ------------------------------------------------------
// Launch Thywill.
// ------------------------------------------------------

// And off we go: launch a Thywill instance to run the the application.
Thywill.launch(config, echo, function (error, thywill) {
  if (error) {
    if (error instanceof Error) {
      error = error.stack;
    }
    console.error("Thywill launch failed with error: " + error);
    process.exit(1);
  } else {
    thywill.log.info("Thywill is ready to run the Echo example application.");
  }
});
