/**
 * @fileOverview
 * A script to launch a Thywill server process running the Calculations
 * example application.
 */

var Thywill = require("thywill");
var Calculations = require("../lib/calculations");
var MemoryStore = require("socket.io/lib/stores/memory");

// Load the Thywill core configuration.
var config = require("./thywillConfig");

// Instantiate an application object.
var calculations = new Calculations("calculations");

// Create a server and add it to the clientInterface configuration.
var http = require("http");
config.clientInterface.server.server = http.createServer().listen(10082);

// Create a MemoryStore for Socket.IO.
config.clientInterface.socketConfig.global.store = new MemoryStore();

// Add a trivial catch-all listener. Only really necessary because this is an
// example and there is no other functionality or framework associated with
// this server instance.
config.clientInterface.server.server.on("request", function (req, res) {
  res.statusCode = 404;
  res.end("No such resource.");
});

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
