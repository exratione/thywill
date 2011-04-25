
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
  this.instances = {};
};
var p = ComponentFactory.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.getComponent = function(componentType, config, callback) {
  // maintain only a single instance of each component
  if( this.instances[componentType] && !config ) {
    return this.instances[componentType];
  }
  
  // if there is no instance configured, then set it up.
  if( !config[componentType] || !config[componentType].component ) {
    console.log("thywill: missing " + componentType + " component definition in configuration."); 
    process.exit(1);
  }
  try {
    this.instances[componentType] = require("./" + componentType + "/" + config[componentType].component + "/" + config[componentType].component);
  } catch( e ) {
    console.log("thywill: unsupported Component: " + config[componentType].component); 
    process.exit(1); 
  }
  // Note that the returned instance may not yet be finished with its configuration. When the 
  // component is done and ready for use, it will emit an event and the callback function will be invoked.
  this.instances[componentType]._configure(config[componentType], callback);
  return this.instances[componentType];
};

p.getApplicationInterface = function(config, callback) {
  return this.getComponent("applicationInterface", config, callback); 
};
p.getClientInterface = function(config, callback) {
  return this.getComponent("clientInterface", config, callback);
};
p.getDatabase = function(config, callback) {
  return this.getComponent("database", config, callback);
};
p.getLog = function(config, callback) {
  return this.getComponent("log", config, callback);
};

//-----------------------------------------------------------
//Exports - Instantiated Object
//-----------------------------------------------------------

module.exports = new ComponentFactory();