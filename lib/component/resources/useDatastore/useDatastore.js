
var util = require("util");
var async = require("async");
var Resources = require("../resources");
var Component = require("../../component");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/*
 * Store resources in the thywill datastore.
 */
function UseDatastore() {
  UseDatastore.super_.call(this);
  this.bootstrapResourcePaths = [];
};
util.inherits(UseDatastore, Resources);
var p = UseDatastore.prototype;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

p._configure = function(config, callback) {

  // Minimal configuration - all we're doing here is storing it for posterity.
  this.config = config; 
  this.readyCallback = callback;
  
  // There are no asynchronous initialization functions here or in the superclasses.
  // So we can just call them and forge ahead without having to wait around or check
  // for completion.
  this._announceReady(Component.NO_ERRORS);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

p.defineBootstrapResource = function(resource, callback) {
  var self = this;
  this.factory.datastore.store(resource.path, resource, function(error) {
    if( !error ) {
      self.bootstrapResourcePaths.push(resource.path);
    } 
    callback(error);
  });
};

p.getBootstrapResources = function(callback) {
  // this will pass each element of bootstrapResourcePaths into the 
  // function(path, asyncCallback). The 2nd arguments passed to asyncCallback
  // are assembled into an array to pass to the final callback - which will be
  // called as callback(error, [resource, resource...]
  async.concat(
    this.bootstrapResourcePaths,
    function(path, asyncCallback) {
      self.getResource(path, asyncCallback);
    },
    callback
  );
};

p.defineResource = function(resource, callback) {
  this.factory.datastore.store(resource.path, resource, callback);
};

p.getResource = function(path, callback) {
  this.factory.datastore.load(path, callback);
};
  
//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = UseDatastore;