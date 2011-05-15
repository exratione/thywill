
var fs = require("fs");
var path = require("path");
var util = require("util");
var Component = require("./component/component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * The main controlling class for thywill. To use this, first create your server:
 * 
 * var http = require("http");
 * var server = http.createServer(function(req, res) { ... server code here ... });
 * server.listen(80);
 * 
 * Then define your application object and callback function:
 * 
 * var echoAppClass = require("./lib/apps/echo");
 * var echoApp = new echoAppClass("my app ID");
 * var callback = function() { ... callback code here ... }
 * 
 * Then to start things running, either this:
 * 
 * var thwyill = require("thywill");
 * thywill.configureFromFile();
 * thywill.startup(server, echoApp, callback);
 * 
 * Or this:
 * 
 * var thwyill = require("thywill");
 * thywill.configureFromFile();
 * thywill.on("thywill.ready", callback).startup(server, echoApp);
 * 
 * There are other configuration methods if you'd like to use JSON, an object, or a file at a specific path.
 */
function Thywill() {
  Thywill.super_.call(this);  
  this.componentType = "thywill";
  this.unregisteredApplications = {};
};
util.inherits(Thywill, Component);
var p = Thywill.prototype;

//-----------------------------------------------------------
// Configuration - Synchronous Methods
//-----------------------------------------------------------

p.configureFromObject = function(obj) {
  this.config = obj;
};

p.configureFromJSON = function(json) {
  this.config = JSON.parse(json);
};

p.configureFromFile = function(filepath) {
  if( !filepath ) {
    filepath = path.resolve(__dirname, "../config/thywill.json");
  }
  this.configureFromJSON(new String(fs.readFileSync(filepath)));
};

//-----------------------------------------------------------
// Startup - Asynchronous Methods
//-----------------------------------------------------------

p._announceReady = function(error) {
  if( error ) {
    throw new Error("thywill: setup failed with error: " + error);
  } else {
    this.ready = true;
    this.emit("thywill.ready");
    if( this.readyCallback ) {
      this.readyCallback();
    }
  }
};

/*
 * Start thywill: set up the configured components and then register applications.
 * 
 * server - a server object from http.createServer()
 * applications - a single application or array of application objects to be registered
 * callback - called on successful completion of the startup process
 */
p.startup = function(server, applications, callback) {
  if( !this.config ) {
    throw new Error("thywill: not configured. Use one of the configuration functions before calling startup()."); 
  }
  
  this.readyCallback = callback;
  var self = this; 
  this.factory.server = server;
  this.factory._initialize(applications, function(error) {
    self._announceReady(error);
  });
};

//-----------------------------------------------------------
// Exports - Singleton
//-----------------------------------------------------------

module.exports = new Thywill();