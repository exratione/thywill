
// require from node.js
var fs = require("fs");
var path = require("path");

// require from thywill
var log = require("server/log");
var app = require("server/application-interface");
var client = require("server/client-interface");
var database = require("server/database");

// parse the configuration
var config; 
try {
  //var configPath = process.env.THYWILL ? path.join(process.env.THYWILL, "config/thywill.json") : "./config/thywill.json";
  var configPath = "./config/thywill.json";
  var data = new String(fs.readFileSync(name));
  config = JSON.parse(data);
} catch (e) {
  console.log("Error loading configuration file." + e);
  process.exit(1);
}

var thywill = function() {
	
	
};



exports.thywill = thywill;