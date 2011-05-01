
//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * The factory class for obtaining configured singleton instances of the various components.
 * 
 * Usage of the factory methods is as follows. Initially call with parameters to initially 
 * configure the component object. e.g.:
 * 
 * var appInterface = factory.getApplicationInterface(configObject, alert("done!"));
 * 
 * Then call without parameters to get the configured component object. e.g.:
 * 
 * var appInterface = factory.getApplicationInterface();
 */
function ComponentFactory() {
  this.applicationInterface = null;
  this.clientInterface = null;
  this.log = null;
  this.database = null;
};
var p = ComponentFactory.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/*
 * Create and initialize a component, and return the singleton instance of that component.
 */
p.initializeComponent = function(componentType, config, callback) {
  // maintain only a single instance of each component
  if( this[componentType] ) {
    return this[componentType];
  }
  
  // if there is no instance configured, then set it up.
  if( !config[componentType] || !config[componentType].component ) {
    throw new Error("thywill: missing " + componentType + " component definition in configuration."); 
  }
  try {
    this[componentType] = require("./" + componentType + "/" + config[componentType].component + "/" + config[componentType].component);
  } catch( e ) {
    throw new Error("thywill: unsupported Component: " + config[componentType].component);  
  }
  // Note that the returned instance may not yet be finished with its configuration. When the 
  // component is done and ready for use, it will emit an event and the callback function will be invoked.
  this[componentType]._configure(config[componentType], callback);
};

p.isComponentReady = function(componentType) {
  return ( this[componentType] && this[componentType].ready );
};

//-----------------------------------------------------------
// Exports - Instantiated Object
//-----------------------------------------------------------

module.exports = new ComponentFactory();