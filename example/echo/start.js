#!/usr/bin/env node

/*
 * An example of a thywill HTTP server, using a very simple configuration and a proof of concept application.
 * All this does is echo messages back to the client.
 * 
 * When running, navigate to /thywill on the server to see it in action.
 */

var express = require("express");
var ThywillClass = require("thywill");
var EchoAppClass = require("../lib/apps/echo");

/*
 * Start up an HTTP server. Note that this will need sufficient privileges to 
 * bind to the privileged port 80. E.g. you are running the script while logged
 * in as root or through sudo via something like:
 * 
 * sudo /full/path/to/node /full/path/to/simpleExample.js
 */ 
var server = express.createServer();
server.listen(80);

/*
 * Then define your application object and callback function:
 */
var echoApp = new EchoAppClass("my echo application");
var callback = function(error) { 
  if( error ) {
    console.log("Error while launching thywill.js: " + error);
  } else {
    console.log("thywill.js is ready.");
  };
};

/*
 * Create and configure the thywill instance.
 */ 
var thywill = new ThywillClass();
thywill.configureFromFile("./thywillConfig.json");

/*
 * Start thywill running. This is an asynchronous call. 
 * 
 * We can either pass thywill.startup() a callback function that will be invoked when startup is complete,
 *  or we can listen for the "thywill.ready" event elsewhere in our code. Here we are passing a callback.
 * 
 * The callback has the form function(error) {}, where error == Component.NO_ERROR == null on a successful startup.
 */
thywill.startup(server, echoApp, callback);

/*
 * Drop the permissions of the process now that all ports are bound by switching ownership
 * to another user who still has sufficient permissions to access the needed scripts.
 * 
 * Replace the username below with your lower-permissions node user is it is not "node"
 */
process.setgid("node");
process.setuid("node");


