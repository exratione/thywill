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

// Instantiate an application object.
var shapes = new Shapes("shapes");

// Set up an Express server.
var express = require("express");
var http = require("http");
var application = express.createApplication();
var server = http.createServer(app).listen(thywillConfig.thywill.launch.port);

// And off we go: launch a Thywill instance to run the the application.
Thywill.launch(thywillConfig, shapes, server, function (error, thywill, server) { 
  if (error) {
    console.log("Thywill launch failed with error: " + error.toString());
    process.exit(1);
  } else {
    console.log("Thywill is ready to run the example application.");
  };
});
