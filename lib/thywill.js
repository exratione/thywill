
var fs = require("fs");
var path = require("path");
var util = require("util");
var factory = require("./component/componentFactory");
var Component = require("./component/component");

//-----------------------------------------------------------
//Class Definition
//-----------------------------------------------------------

function Thywill() {

  this.componentType = "thywill";
  
  this.log = null;
  this.database = null;
  this.applicationInterface = null;
  this.clientInterface = null;
  
  this.logReady = false;
  this.databaseReady = false;
  this.applicationInterfaceReady = false;
  this.clientInterfaceReady = false;
  
};
util.inherits(Thywill, Component);

//-----------------------------------------------------------
//Methods
//-----------------------------------------------------------

/*
 * Configuration methods - all synchronous
 */

Thywill.prototype.configureFromObject = function(obj) {
  this.config = obj;
};

Thywill.prototype.configureFromJSON = function(json) {
  try {
    this.config = JSON.parse(data);
  } catch (e) {
    console.log("Error parsing configuration file JSON: " + e);    
    process.exit(1);
  }
};

Thywill.prototype.configureFromFile = function(path) {
  if( !path ) {
    path = "./config/thywill.json";
  }
  var data;
  try {
    data = new String(fs.readFileSync(path));
  } catch (e) {
    console.log("Error loading configuration file: " + e); 
    process.exit(1);
  }    
  this.config = this.configureFromJSON(data);
};

/*
 * Startup methods - which are asynchronous.
 */

Thywill.prototype.isReady = function() {
  return (this.logReady && this.databaseReady && this.applicationInterfaceReady && this.clientInterfaceReady);
};

Thywill.prototype.componentReady = function(component) {
  this[component + "Ready"] = true;
  if( this.isReady() ) {
    this.emit("thywill.ready");
    this.readyCallback(this);
  }
};

Thywill.prototype.startup = function(callback) {
  if(callback) {
    this.readyCallback = callback;
  }
  this.log = factory.getLog(this.config);
  this.applicationInterface = factory.getApplicationInterface(this.config);
  this.clientInterface = factory.getClientInterface(this.config);
  this.database = factory.getDatabase(this.config);
};

//-----------------------------------------------------------
//Exports - Instantiated Object
//-----------------------------------------------------------

var thywill = new Thywill();

/*
 * Listening for readiness events emitted by components is one option to determine when startup is done: equally,
 * these functions could have been passed as second arguments to the factory methods in thywill.startup().
 */  
thywill.on("thywill.log.ready", function() { this.componentReady("log"); });
thywill.on("thywill.database.ready", function() { this.componentReady("database"); });
thywill.on("thywill.applicationInterface.ready", function() { this.componentReady("applicationInterface"); });
thywill.on("thywill.clientInterface.ready", function() { this.componentReady("clientInterface"); });

module.exports = thywill;