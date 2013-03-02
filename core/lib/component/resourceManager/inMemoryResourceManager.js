/**
 * @fileOverview
 * InMemoryResourceManager class definition.
 */

var util = require("util");
var Thywill = require("thywill");
var Resource = require("./resource");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A trivial synchronous in-memory resource manager.
 */
function InMemoryResourceManager () {
  InMemoryResourceManager.super_.call(this);
  // Resources are stashed away as properties of this object.
  this.data = {};
}
util.inherits(InMemoryResourceManager, Thywill.getBaseClass("ResourceManager"));
var p = InMemoryResourceManager.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

InMemoryResourceManager.CONFIG_TEMPLATE = null;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see ResourceManager#store
 */
p.store = function (key, resource, callback) {
  this.data[key] = resource;
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
