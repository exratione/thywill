#!/usr/bin/env node

/**
 * @fileOverview
 * A script to launches a Thywill server process running the Shapes example
 * application.
 */

var Thywill = require("thywill");
var Shapes = require("../lib/shapes");

// Load the Thywill core configuration.
var config = require("./thywillConfig");

// Create an Express application.
var express = require("express");
var http = require("http");
var app = express();

// Create a session store, and set it in the Thywill config so that Express
// sessions can be assigned to websocket connections. This is only a
// MemoryStore - not much use past demonstrations. You'd probably want to
// be using a RedisStore.
config.clientInterface.sessions.store = new express.session.MemoryStore();
// Thywill also needs access to the session cookie secret and key.
config.clientInterface.sessions.cookieSecret = "some long random string";
config.clientInterface.sessions.cookieKey = "sid";

// Add minimal configuration to the Express application: just the cookie and
// session middleware.
app.use(express.cookieParser(config.clientInterface.sessions.cookieSecret));
app.use(express.session({
  cookie: {
    httpOnly: true
  },
  key: config.clientInterface.sessions.cookieKey,
  secret: config.clientInterface.sessions.cookieSecret,
  store: config.clientInterface.sessions.store
}));

// Middleware and routes might be added here or after Thywill launches. Either
// way is just fine and won't interfere with Thywill's use of Express to serve
// resources. e.g. adding a catch-all here is acceptable:
app.all("*", function (req, res, next) {
  res.statusCode = 404;
  res.send("No such resource.");
});

// Instantiate an application object.
var shapes = new Shapes("shapes", app);

// Start the server that we'll pass to Thywill.
var server = http.createServer(app).listen(10081);

// Add the server and Express application to the clientInterface configuration.
config.clientInterface.server = {
  app: app,
  server: server
};

// And off we go: launch a Thywill instance to run the the application.
Thywill.launch(config, shapes, function (error, thywill) {
  if (error) {
    if (error instanceof Error) {
      error = error.stack;
    }
    console.error("Thywill launch failed with error: " + error);
    process.exit(1);
  } else {
    thywill.log.info("Thywill is ready to run the Shapes example application.");
  }
});
