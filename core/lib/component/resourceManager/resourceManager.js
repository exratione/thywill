/**
 * @fileOverview
 * ResourceManager class definition.
 */

var fs = require("fs");
var pathUtils = require("path");
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
  // Convenience copies of Resource static values.
  this.types = Resource.TYPES;
  this.defaultType = Resource.DEFAULT_TYPE;
  this.typeByExtension = Resource.TYPE_BY_EXTENSION;
}
util.inherits(ResourceManager, Thywill.getBaseClass("Component"));
var p = ResourceManager.prototype;

//-----------------------------------------------------------
// Methods.
//-----------------------------------------------------------

/**
 * @see Component#_getDependencies
 */
p._getDependencies = function () {
  return {
    components: [
      "log",
      "cluster",
      "cacheManager"
    ]
  };
};

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
  // Check to see if we're defaulting the type based on a file extension. Look
  // at the originFilePath, then the filePath, and then the clientPath if that
  // doesn't exist.
  //
  // Any of these paths might not actually have a file extension, hence we
  // check all three.
  var extension;
  if (!attributes.type) {
    if (attributes.originFilePath) {
      extension = pathUtils.extname(attributes.originFilePath);
      attributes.type = this.typeByExtension[extension];
    }
    // If that didn't get a useful type, then check the filePath.
    if (!attributes.type && attributes.filePath) {
      extension = pathUtils.extname(attributes.filePath);
      attributes.type = this.typeByExtension[extension];
    }
    // Lastly try the clientPath.
    if (!attributes.type && attributes.clientPath) {
      extension = pathUtils.extname(attributes.clientPath);
      attributes.type = this.typeByExtension[extension];
    }
    // Last of all, default if we've failed to identify a type.
    attributes.type = attributes.type || this.defaultType;
  }

  // Generate the Resource instance.
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
