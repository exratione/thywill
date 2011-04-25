
var fs = require("fs");
var path = require("path");
var util = require("util");
var factory = require("./component/componentFactory");
var Component = require("./component/component");

//-----------------------------------------------------------
//Class Definition
//-----------------------------------------------------------

/*
 * The main controlling class for thywill. Usage:
 * 
 * var thwyill = require("thywill");
 * thywill.configureFromFile();
 * thywill.startup(callbackInvokedWhenReady);
 * 
 * Or alternately:
 * 
 * var thwyill = require("thywill");
 * thywill.configureFromFile();
 * thywill.on("thywill.ready", function() {
 *    ...
 * }).startup();
 * 
 */
function Thywill() {
  Thywill.super_.call(this);  
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
var p = Thywill.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/*
 * Configuration methods - all synchronous
 */

p.configureFromObject = function(obj) {
  this.config = obj;
};

p.configureFromJSON = function(json) {
  try {
    this.config = JSON.parse(data);
  } catch (e) {
    console.log("thywill: error parsing configuration JSON: " + e);    
    process.exit(1);
  }
};

p.configureFromFile = function(path) {
  if( !path ) {
    path = "./config/thywill.json";
  }
  var data;
  try {
    data = new String(fs.readFileSync(path));
  } catch (e) {
    console.log("thywill: error loading configuration file: " + e); 
    process.exit(1);
  }    
  this.config = this.configureFromJSON(data);
};

/*
 * Startup methods - asynchronous.
 */

/*
 * Returns true if all the components are ready for use.
 */
p.isReady = function() {
  return (this.logReady && this.databaseReady && this.applicationInterfaceReady && this.clientInterfaceReady);
};

/*
 * Inform this object that a component is ready.
 */
p._componentReady = function(componentName) {
  this[componentName + "Ready"] = true;
  if( this.isReady() ) {
    this.emit("thywill.ready");
    if( this.readyCallback ) {
      this.readyCallback(this);
    }
  }
};

/*
 * Start thywill: set up its components, and invoke the callback function when ready to go.
 */
p.startup = function(callback) {
  this.readyCallback = callback;
  var self = this; 
  
  this.applicationInterface = factory.getApplicationInterface(this.config, function() { self._componentReady("applicationInterface"); });
  this.clientInterface = factory.getClientInterface(this.config, function() { self._componentReady("clientInterface"); });
  
  // tell the applicationInterface and clientInterface about each other
  this.applicationInterface.setClientInterface(this.clientInterface);
  this.clientInterface.setApplicationInterface(this.applicationInterface);
  
  this.log = factory.getLog(this.config, function() { self._componentReady("log"); });
  this.database = factory.getDatabase(this.config, function() { self._componentReady("database"); });
};

//-----------------------------------------------------------
//Exports - Instantiated Object
//-----------------------------------------------------------

module.exports = new Thywill();