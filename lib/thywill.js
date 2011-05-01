
var fs = require("fs");
var path = require("path");
var util = require("util");
var Component = require("./component/component");

//-----------------------------------------------------------
//Class Definition
//-----------------------------------------------------------

/*
 * The main controlling class for thywill. Usage:
 * 
 * var thwyill = require("thywill");
 * thywill.configureFromFile();
 * thywill.startup(myApplication, callbackInvokedWhenReady);
 * 
 * Or alternately:
 * 
 * var thwyill = require("thywill");
 * thywill.configureFromFile();
 * thywill.on("thywill.ready", function() {
 *    ...
 * }).startup();
 * thywill.registerApplication(myApplication);
 * 
 */
function Thywill() {
  Thywill.super_.call(this);  
  this.componentType = "thywill";
  
  this.log = null;
  this.database = null;
  this.applicationInterface = null;
  this.clientInterface = null;
  
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

//-----------------------------------------------------------
// Startup - Asynchronous Methods
//-----------------------------------------------------------

p._announceReady = function() {
  this.ready = true;
  this.emit("thywill.ready");
  if( this.readyCallback ) {
    this.readyCallback();
  }
};

/*
 * Start thywill: set up the configured components and then register applications.
 * 
 * callback - a callback function invoked when thywill is ready.
 * applications - a single application or array of application objects to be registered
 */
p.startup = function(applications, callback) {
  if( !this.config ) {
    this.configureFromFile();
  }
  if( applications ) {
    if ( !applications instanceof Array ) {
      applications = [applications];
    }
    var len = applications.length;
    for( var i = 0; i < length; i++ ) {
      this.unregisteredApplications[applications[i].id] = applications[i];
    }
  }
  
  this.readyCallback = callback;
  var self = this; 
  this.factory.initializeComponent("applicationInterface", this.config, function() { self._componentReady(); });
  this.factory.initializeComponent("clientInterface", this.config, function() { self._componentReady(); });
  this.factory.initializeComponent("log", this.config, function() { self._componentReady(); });
  this.factory.initializeComponent("database", this.config, function() { self._componentReady(); });
};

/*
 * Callback for component initialization: when all components are initialized, then 
 * the applications are registered.
 */
p._componentReady = function() {
  if(
    this.factory.isComponentReady("database") 
    && this.factory.isComponentReady("log") 
    && this.factory.isComponentReady("clientInterface") 
    && this.factory.isComponentReady("applicationInterface") 
  ) {
    // now that the components are set up, register the applications.
    var self = this;
    for( id in this.unregisteredApplications ) {
      this.factory.applicationInterface._registerApplication(this.unregisteredApplications[id], function() {
        self._applicationRegistered(id);
      });
    }
  }
};

/*
 * Callback for application registration.
 */
p._applicationRegistered = function(id) {
  delete this.unregisteredApplications[id];
  if( !Object.keys(this.unregisteredApplications).length ) {
    // registration of applications is complete, and this is the last startup step, so announce readiness.
    this._announceReady();
  }
};

//-----------------------------------------------------------
//Exports - Instantiated Object
//-----------------------------------------------------------

module.exports = new Thywill();