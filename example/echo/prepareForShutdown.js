#!/usr/bin/env node

/*
 * Tell the server to gracefully prepare for shutdown, but do not end the process.
 */

console.log("Instructing server to prepare for shutdown");

var http = require("http");
var fs = require("fs");
var path = require("path");

var filepath = path.resolve(__dirname, "./thywillConfig.json");
var config = JSON.parse(fs.readFileSync(filepath, "utf-8"));

var options = {
  host: "localhost",
  port: config.thywill.prepareForShutdown.port,
  path: config.thywill.prepareForShutdown.path,
  method: "HEAD"
};

var request = https.request(options, function(response) {
  console.log("Server completed preparations for shutdown");
});
request.end();
request.on("error", function(error) {
  throw error;
});