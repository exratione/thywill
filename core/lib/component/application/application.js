/**
 * @fileOverview
 * Application class definition.
 */

var util = require("util");
var async = require("async");
var Thywill = require("thywill");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for applications running on Thywill.
 */
function Application(id) {
  Application.super_.call(this);
  if (!id) {
    throw new Error("Application class constructor requires an id parameter");
  }
  this.componentType = "application";
  this.id = id;
}
util.inherits(Application, Thywill.getBaseClass("Component"));
var p = Application.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * Send a message, usually to one specific client.
 *
 * @param {Message} message
 *   Instance of the Message class.
 */
p.send = function (message) {
  this.thywill.clientInterface.send(message);
};

/**
 * A utility function for creating and storing a bootstrap resource directly
 * from a file, loading its contents into memory.
 *
 * @param {string} filePath
 *   An absolute path to the file to be loaded.
 * @param {Object} attributes
 *   An attributes object for creating a resource - see the Resource class for
 *   more information. This method automatically sets the originFilePath
 *   attribute to the passed filePath and the isGenerated  attribute to false
 *   (as the attribute data isn't altered).
 * @param {Function} callback
 *   Of the form function (error) where error = null on success.
 */
p.storeBootstrapResourceFromFile = function (filePath, attributes, callback) {
  var self = this;
  // Add some attributes.
  attributes.originFilePath = filePath;
  attributes.isGenerated = false;
  // Create the resource and pass it back out in the callback.
  this.thywill.resourceManager.createResourceFromFile(
    attributes.originFilePath,
    attributes,
    function (error, resource) {
      if (error) {
        callback.call(self, error);
      } else {
        self.thywill.clientInterface.storeBootstrapResource(resource, callback);
      }
    }
  );
};

/**
 * Create bootstrap resources from a manifest object. The manifest object
 * should be of the following form, listing off files and resource
 * attributes. The contents of each file will be loaded into memory:
 *
 * {
 *   "/file/system/path/to/file.css": {
 *     clientPath: "/path/to/file.css",
 *     encoding: encoding,
 *     minified: false,
 *     type: resourceManager.types.CSS,
 *     weight: 0,
 *     ... other attributes
 *   },
 *   ...
 * }
 *
 * @param {Object} manifest
 * @param {Function} callback
 *   Of the form function (error) where error = null on success.
 */
p.storeBootstrapResourcesFromManifest = function (manifest, callback) {
  var self = this;
  // Turn the manifest into an array so it can be run through async.forEach().
  var attributesArray = [];
  for (var originFilePath in manifest) {
    manifest[originFilePath].originFilePath = originFilePath;
    manifest[originFilePath].isGenerated = false;
    attributesArray.push(manifest[originFilePath]);
  }

  async.forEach(
    attributesArray,
    function (attributes, asyncCallback) {
      self.storeBootstrapResourceFromFile(attributes.originFilePath, attributes, asyncCallback);
    },
    callback
  );
};

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
 * This method is invoked when the application is first registered on Thywill
 * server startup. It should be used to define the resources that will be
 * loaded by a client immediately on connection. These will typically include
 * third party libraries and the core Javascript client code that starts an
 * application running, renders a user interface, and so on.
 *
 * These bootstrap resources are defined via the resourceManager and
 * clientInterface components:
 *
 * var resource = this.thywill.resourceManager.createResource(type, ...);
 * this.thywill.clientInterface.storeBootstrapResource(resource, callback);
 *
 * @param {Function} callback
 *   Of the form function (error) {}, where error == null on success.
 */
p._defineBootstrapResources = function (callback) {
  throw new Error("Not implemented.");
};

/**
 * Called when a message is received from a client.
 *
 * @param {Message} message
 *   Instance of the Message class.
 */
p.receive = function (message) {
  throw new Error("Not implemented.");
};

/**
 * Called when a client connects or reconnects.
 *
 * @param {string} sessionId
 *   Unique ID of the session.
 */
p.connection = function (sessionId) {
  throw new Error("Not implemented.");
};

/**
 * Called when a client disconnects.
 *
 * @param {string} sessionId
 *   Unique ID of the session.
 */
p.disconnection = function (sessionId) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Application;
