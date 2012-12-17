#!/usr/bin/env node

/**
 * @fileOverview
 * A script to launches a Thywill server process running the Echo example
 * application.
 */

var Thywill = require("thywill");
var Echo = require("../lib/echo");

// Load the Thywill core configuration.
var thywillConfig = require("./thywillConfig");

// Instantiate an application object.
var echo = new Echo("echo");

// Optionally, define and start a server. For example:
// var express = require("express");
// var http = require("http");
// var app = express();
// var server = http.createServer(app).listen(thywillConfig.thywill.launch.port);
// Or just set it to null and Thywill will create its own bare-bones
// HTTPServer listening on the port defined in the configuration.
var server = null;

// And off we go: launch a Thywill instance to run the the application.
Thywill.launch(thywillConfig, echo, server, function (error, thywill, server) {
  if (error) {
    console.log("Thywill launch failed with error: " + error.toString());
    process.exit(1);
  } else {
    console.log("Thywill is ready to run the example application.");
  };
});
