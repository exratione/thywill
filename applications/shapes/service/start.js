#!/usr/bin/env node

/**
 * @fileOverview
 * A script to launches a Thywill server process running the Shapes example
 * application.
 */

var Thywill = require("thywill");
var Shapes = require("../lib/shapes");

// Load the Thywill core configuration.
var thywillConfig = require("./thywillConfig");

// Set up an Express server.
var express = require("express");
var http = require("http");
var app = express();

// Create a session store, and set it in the Thywill config so that Express
// sessions can be assigned to websocket connections.
//
// Here this is only a MemoryStore - you would probably want something more
// useful, such as a Redis-backed store.
thywillConfig.clientInterface.sessions.store = new express.session.MemoryStore();
// Thywill also needs access to the session cookie secret and key.
thywillConfig.clientInterface.sessions.cookieSecret = "some long random string";
thywillConfig.clientInterface.sessions.cookieKey = "sid";
// And the Express application itself.
thywillConfig.clientInterface.sessions.app = app;

// Add minimal configuration to the Express application.
// Start with cookie and session middleware.
app.use(express.cookieParser(thywillConfig.clientInterface.sessions.cookieSecret));
app.use(express.session({
  key: thywillConfig.clientInterface.sessions.cookieKey,
  secret: thywillConfig.clientInterface.sessions.cookieSecret,
  store: thywillConfig.clientInterface.sessions.store
}));

// Other middleware might be added here or after Thywill launches, either way
// is just fine.

// Instantiate an application object.
var shapes = new Shapes("shapes", app);

// Start the server that we'll pass to Thywill.
var server = http.createServer(app).listen(thywillConfig.thywill.launch.port);

// And off we go: launch a Thywill instance to run the the application.
Thywill.launch(thywillConfig, shapes, server, function (error, thywill, server) {
  if (error) {
    if (error instanceof Error) {
      error = error.stack;
    }
    console.error("Thywill launch failed with error: " + error);
    process.exit(1);
    return;
  }

  thywill.log.info("Thywill is ready to run the Shapes example application.");

  // Now add your Express routes. You have to add them after Thywill launches,
  // as it will add a few Express routes itself, and they must be added prior
  // to any catch-all you might define.

  // Adding app.get(...), app.post(...), etc would happen here.

  // Finish up with a catch-all 404 route.
  app.all("*", function (req, res, next) {
    res.statusCode = 404;
    res.send("Not found.");
  });
});
