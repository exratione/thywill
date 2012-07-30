/**
 * @fileOverview
 * ResourceManager class definition.
 */

var util = require("util");
var Thywill = require("thywill");
var Resource = Thywill.getBaseClass("Resource");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for resource managers, used to generate and store resources
 * in Thywill - meaning data to be served to a client.
 */
function ResourceManager() {
  ResourceManager.super_.call(this);
  this.componentType = "resourceManager";
  // Convenience copy of the Resource types; resourceManager.createResource()
  // needs the type, and it's easier if you don't have to go load the Resource
  // class to get the type definitions.
  this.types = Resource.TYPES;
};
util.inherits(ResourceManager, Thywill.getBaseClass("Component"));
var p = ResourceManager.prototype;

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
 * Obtain a new Resource object. The object returned is not stored.
 * 
 * @param {string} type
 *   One of the defined resource types.
 * @param {number} weight
 *   An ordering weight: larger values go last.
 * @param {string} path
 *   The resource path.
 * @param {string} data
 *   The body of the resource.
 * @param {Object} attributes
 *   Other attributes of this resource.
 * @return {Resource}
 *   A Resource instance.
 */
p.createResource = function(type, weight, path, data, attributes) {
  throw new Error("Not implemented.");
};

/**
 * Store a Resource object.
 * 
 * @param {string} key
 *   The key by which the stored resource can be retrieved.
 * @param {Resource} resource
 *   A Resource instance.
 * @param {Function} callback
 *   Of the form function (error), where error == null on success.
 */
p.store = function (key, resource, callback) {
  throw new Error("Not implemented.");
};

/**
 * Pass the object associated with the key, or null if no such object, to the
 * callback. Remove the object from the resourceManager.
 * 
 * @param {string} key
 *   The key under which a resource was earlier stored.
 * @param {Function} callback
 *   Of the form function (error, resource), where error == null on success and
 *   resource is the item stored, or null if no item is found.
 */
p.remove = function (key, callback) {
  throw new Error("Not implemented.");
};

/**
 * Load a stored resource.
 * 
 * @param {string} key
 *   The key under which a resource was earlier stored.
 * @param {Function} callback
 *   Of the form function (error, resource), where error == null on success and
 *   resource is the item stored, or null if no item is found.
 */
p.load = function (key, callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ResourceManager;