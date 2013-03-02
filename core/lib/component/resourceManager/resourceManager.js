/**
 * @fileOverview
 * ResourceManager class definition.
 */

var fs = require("fs");
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
}
util.inherits(ResourceManager, Thywill.getBaseClass("Component"));
var p = ResourceManager.prototype;

//-----------------------------------------------------------
// Methods.
//-----------------------------------------------------------

/**
 * Obtain a new Resource object. The object returned in the callback function
 * is not stored.
 *
 * @param {string} path
 *   An absolute path to a file.
 * @param {Object} attributes
 *   Other attributes of this resource - see the Resource class
 *   for more information.
 * @param {Function} callback
 *   Of the form function (error, resource), where error === null on success
 *   and resource is the new Resource instance.
 *
 * @see Resource
 */
p.createResourceFromFile = function (path, attributes, callback) {
  var self = this;
  fs.readFile(path, null, function (error, buffer) {
    var resource = null;
    if (!error) {
      resource = self.createResource(buffer, attributes);
    }
    callback(error, resource);
  });
};

/**
 * Obtain a new Resource object. The object returned is not stored.
 *
 * @param {Buffer|string|null} data
 *   A Buffer instance containing the resource data, or a string. A string will
 *   be used to create a Buffer with the encoding provided in the attributes
 *   object. This can be null for resources that don't need to have data in
 *   memory.
 * @param {Object} [attributes]
 *   Other attributes of this resource - see the Resource class
 *   for more information.
 *
 * @see Resource
 */
p.createResource = function (data, attributes) {
  // If we have a string rather than null or a Buffer, then convert it into a
  // Buffer.
  if (typeof data === "string") {
    var encoding;
    if (attributes && attributes.encoding) {
      encoding = attributes.encoding;
    } else {
      encoding = "utf8";
    }
    data = new Buffer(data, encoding);
  }
  return new Resource(data, attributes);
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
 * Store a Resource object.
 *
 * @param {string} key
 *   The key by which the stored resource can be retrieved.
 * @param {Resource} resource
 *   A Resource instance.
 * @param {function} callback
 *   Of the form function (error), where error === null on success.
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
 *   Of the form function (error, resource), where error === null on success and
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
 *   Of the form function (error, resource), where error === null on success and
 *   resource is the item stored, or null if no item is found.
 */
p.load = function (key, callback) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ResourceManager;
