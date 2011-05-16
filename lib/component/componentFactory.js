
var async = require("async");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * The factory class for obtaining configured singleton instances of the various components.
 */
function ComponentFactory() {
  this.server = null;
  
  // components
  this.appInterface = null;
  this.clientInterface = null;
  this.log = null;
  this.datastore = null;
  this.template = null;
  this.resources = null;
};
var p = ComponentFactory.prototype;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

/*
 * Initialize the components and register applications in the necessary order. Later components may 
 * make use of earlier ones in the ordering in their initialization. The order is:
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
p._initialize = function(applications, config, callback) {
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
 * callback - function(err) where err == null on success.
 */
p._initializeComponent = function(componentType, config, callback) {
  // maintain only a single instance of each component
  if( this[componentType] ) {
    return this[componentType];
  }
  
  // if there is no instance configured, then set it up.
  if( !config[componentType] || !config[componentType].component ) {
    throw new Error("thywill: missing " + componentType + " component definition in configuration."); 
  }

  var path = "./" + componentType + "/" + config[componentType].component + "/" + config[componentType].component;
  try {
    require.resolve(path);
  } catch (e) {
    throw new Error("thywill: unsupported component '" + config[componentType].component + "' of type '" + componentType + "'");  
  }
  var ComponentConstructor = require(path);
  this[componentType] = new ComponentConstructor();
  
  // Note that the returned instance may not yet be finished with its configuration. When the 
  // component is done and ready for use, it will emit an event and the callback function will be invoked.
  this[componentType]._configure(config[componentType], callback);
};

//-----------------------------------------------------------
// Exports - Instantiated Object
//-----------------------------------------------------------

module.exports = new ComponentFactory();