/**
 * @fileOverview
 * InMemoryResourceManager class definition.
 */

var util = require("util");
var Thywill = require("thywill");
var Resource = require("../resource");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A trivial synchronous in-memory resource manager.
 */
function InMemoryResourceManager() {
  InMemoryResourceManager.super_.call(this);
  this.data = {};
};
util.inherits(InMemoryResourceManager, Thywill.getBaseClass("ResourceManager"));
var p = InMemoryResourceManager.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

InMemoryResourceManager.CONFIG_TEMPLATE = null;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

/**
 * @see Component#_configure
 */
p._configure = function (thywill, config, callback) {
  // Minimal configuration - all we're doing here is storing it for posterity.
  this.thywill = thywill;
  this.config = config; 
  this.readyCallback = callback;
  
  // There are no asynchronous initialization functions here or in the 
  // superclasses. So we can just call them and forge ahead without having
  // to wait around or check for completion.
  this._announceReady(this.NO_ERRORS);
};

/**
 * @see Component#_prepareForShutdown
 */
p._prepareForShutdown = function (callback) {
  // Nothing needed here.
  callback.call(this);
};
  
//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see ResourceManager#createResource
 */
p.createResource = function(data, attributes) {
  // If we have a string rather than null or a Buffer, then convert it into a
  // Buffer.
  if (typeof data === "string") {
    data = new Buffer(data, attributes.encoding);
  };
  return new Resource(data, attributes);
};

/**
 * @see ResourceManager#store
 */
p.store = function (key, resource, callback) {
  this.data[key] = resource;
  resource.stored = true;
  if (resource.clientPath && resource.servedBy === this.servedBy.THYWILL) {
    this.addClientPathServedByThywill(resource.clientPath);
  }
  callback(this.NO_ERRORS);
};

/**
 * @see ResourceManager#remove
 */
p.remove = function (key, callback) {
  var resource = null;
  var error = this.NO_ERRORS;
  if (this.data[key]) {
    resource = this.data[key];
    if (resource.clientPath && resource.servedBy === this.servedBy.THYWILL) {
      this.removeClientPathServedByThywill(resource.clientPath);
    }
    delete this.data[key];
  } 
  callback(error, resource);
};

/**
 * @see ResourceManager#load
 */
p.load = function (key, callback) {
  if (this.data[key]) { 
    callback(this.NO_ERRORS, this.data[key]);
  } else {
    callback(this.NO_ERRORS, null);
  }
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = InMemoryResourceManager;
