
var fs = require("fs");
var path = require("path");
var util = require("util");
var async = require("async");

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
 * var callback = function(error) { ... callback code here ... }
 * 
 * Then to start things running, either this:
 * 
 * var ThwyillClass = require("thywill");
 * var thywill = new ThywillClass();
 * thywill.configureFromFile().startup(server, echoApp, callback);
 * 
 * Or this:
 * 
 * var ThwyillClass = require("thywill");
 * var thywill = new ThywillClass();
 * thywill.configureFromFile().on("thywill.ready", callback).startup(server, echoApp);
 * 
 * There are other configuration methods if you'd like to use JSON, an object, or a file at a specific path.
 */
function Thywill() {
  Thywill.super_.call(this, null);  
  this.componentType = "thywill";
  this.unregisteredApplications = {};
  this.server = null;
  
  // components
  this.appInterface = null;
  this.clientInterface = null;
  this.log = null;
  this.datastore = null;
  this.template = null;
  this.resources = null;
  
};
util.inherits(Thywill, Component);
var p = Thywill.prototype;

//-----------------------------------------------------------
// Configuration - Synchronous Methods
//-----------------------------------------------------------

p.configureFromObject = function(obj) {
  this.config = obj;
  return this;
};

p.configureFromJSON = function(json) {
  this.config = JSON.parse(json);
  return this;
};

p.configureFromFile = function(filepath) {
  if( !filepath ) {
    filepath = "../config/thywill.json";
  }
  filepath = path.resolve(__dirname, filepath);
  this.configureFromJSON(fs.readFileSync(filepath, "utf-8"));
  return this;
};

//-----------------------------------------------------------
// Startup - Asynchronous Methods
//-----------------------------------------------------------

/*
 * Start thywill: set up the configured components and then register applications.
 * 
 * server - a server object from http.createServer().
 * applications - a single application or array of application objects to be registered.
 * callback - of the form function(error) {}, called on completion of setup, with error == null on success.
 */
p.startup = function(server, applications, callback) {
  if( !this.config ) {
    this.announceReady("Thywill.startup(): not configured. Use one of the configuration functions before calling startup()."); 
    return;
  }
  
  var self = this; 
  this.readyCallback = callback;
  this.server = server;
  this._initializeComponents(applications, this.config, function(error) {
    self._announceReady(error);
  });
};

/*
 * Initialize the components and register applications in the necessary order. Later components may 
 * thereby make use of earlier ones in the ordering in their initialization. The order is:
 * 
 * log
 * datastore
 * resources
 * template 
 * appInterface
 * applications     - which set various resources
 * clientInterface  - which needs to know about all the resources
 * 
 * applications - an array of objects of classes derived from Application
 * config - configuration object
 * callback - function(error), where error == null on success
 */
p._initializeComponents = function(applications, config, callback) {
  var self = this;
  var fns = [
   function(asyncCallback) {
     self._initializeComponent("log", config, asyncCallback);      
   },
   function(asyncCallback) {
     self._initializeComponent("datastore", config, asyncCallback);      
   },
   function(asyncCallback) {
     self._initializeComponent("resources", config, asyncCallback);      
   },
   function(asyncCallback) {
     self._initializeComponent("template", config, asyncCallback);      
   },
   function(asyncCallback) {
     self._initializeComponent("appInterface", config, asyncCallback);      
   },
  ];
  
  // add two loops through the applications array, if we have one, to 
  // the list of functions to call.
  if( applications ) {
    if ( !(applications instanceof Array) ) {
      applications = [applications];
    }
    fns.push(
      function(asyncCallback) {
        async.forEach(
          applications,
          function(application, innerAsyncCallback) {
            self.appInterface._registerApplication(application, innerAsyncCallback);
          },
          asyncCallback
        );
      }
    );
    fns.push(
      function(asyncCallback) {
        async.forEach(
          applications,
          function(application, innerAsyncCallback) {
            application._defineClientResources(innerAsyncCallback);
          },
          asyncCallback
        );
      }
    );
  }

  // and finish by adding the clientInterface initialization
  fns.push(function(asyncCallback) {
    self._initializeComponent("clientInterface", config, asyncCallback);      
  });
  
  // Call the array of functions in order, each starting after the prior has finished, and
  // invoke the original callback function at the end.
  async.series(fns, callback);
};

/*
 * Create and initialize a component, and return the singleton instance of that component.
 * 
 * callback - function(error) where error == null on success.
 */
p._initializeComponent = function(componentType, config, callback) {
  // maintain only a single instance of each component
  if( ComponentFactory[componentType] ) {
    return ComponentFactory[componentType];
  }
  
  // if there is no instance configured, then set it up.
  if( !config[componentType] || !config[componentType].component ) {
    callback.call(this, "Thywill._initializeComponent: missing " + componentType + " component definition in configuration."); 
    return;
  }

  var path = "./" + componentType + "/" + config[componentType].component + "/" + config[componentType].component;
  try {
    require.resolve(path);
  } catch (e) {
    callback.call(this, "Thywill._initializeComponent: unsupported component '" + config[componentType].component + "' of type '" + componentType + "'");
    return;
  }
  var ComponentConstructor = require(path);
  ComponentFactory[componentType] = new ComponentConstructor();
  
  // Note that the returned instance may not yet be finished with its configuration. When the 
  // component is done and ready for use, it will emit an event and the callback function will be invoked.
  ComponentFactory[componentType]._configure(this, config[componentType], callback);
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Thywill;