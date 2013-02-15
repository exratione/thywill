/**
 * @fileOverview
 * A script to launch a Thywill server process running the Echo example
 * application.
 */

var Thywill = require("thywill");
var Echo = require("../lib/echo");

// Load the Thywill core configuration.
var config = require("./thywillConfig");

// Instantiate an application object.
var echo = new Echo("echo");

// Create a server and add it to the clientInterface configuration.
var http = require("http");
config.clientInterface.server.server = http.createServer().listen(10080);

// Add a trivial catch-all listener. Only really necessary because this is an
// example and there is no other functionality or framework associated with
// this server instance.
config.clientInterface.server.server.on("request", function (req, res) {
  res.statusCode = 404;
  res.end("No such resource.");
});

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
