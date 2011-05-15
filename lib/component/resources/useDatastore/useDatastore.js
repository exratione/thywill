
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
  var self = this;
  var fns = [];
  for( var i = 0, length = this.bootstrapResourcePaths.length; i < length; i++ ) {
    fns.push(function(asyncCallback) {
      self.getResource(this.bootstrapResourcePaths[i], asyncCallback);
    });
  }
  // the 2nd and later parameters of all asyncCallbacks (which here will be resource objects)
  // are passed as an array to callback(error, [resource, resource...]), with error == null on success.
  async.parallel(fns, callback);
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