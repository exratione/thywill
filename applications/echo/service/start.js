#!/usr/bin/env node

/**
 * @fileOverview 
 * An script that launches an example Thywill HTTP server, using a very simple
 * configuration and a proof of concept application. All this does is present
 * a little UI and echo messages back to the client.
 * 
 * When running, open up a browser and navigate to /thywill on the server to
 * see it in action.
 */

var fs = require("fs");
var path = require("path");
var Thywill = require("thywill");
var Echo = require("../lib/echo");

// Load the Thywill core configuration.
var thywillConfig = require("./thywillConfig");

// Instantiate an application object.
var echo = new Echo("echo");

// Optionally, define and start a server. For example:
// var express = require("express");
// var application = express.createApplication();
// var server = application.listen(10080);
// Or just set it to null and Thywill will create its own bare-bones 
// HTTPServer.
var server = null;

// And off we go: launch a Thywill instance to run the the Echo application.
Thywill.launch(thywillConfig, echo, server, function (thywill, server, error) { 
  if (error) {
    console.log("Thywill launch failed with error: " + error);
    process.exit(1);
  } else {
    console.log("Thywill is ready to run the example Echo application.");
  };
});
