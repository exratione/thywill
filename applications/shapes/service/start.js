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

// Optionally, define and start a server. For example:
// var express = require("express");
// var application = express.createApplication();
// var server = application.listen(10080);
// Or just set it to null and Thywill will create its own bare-bones 
// HTTPServer listening on the port defined in the configuration.
var server = null;

// And off we go: launch a Thywill instance to run the the application.
Thywill.launch(thywillConfig, shapes, server, function (error, thywill, server) { 
  if (error) {
    console.log("Thywill launch failed with error: " + error);
    process.exit(1);
  } else {
    console.log("Thywill is ready to run the example application.");
  };
});
