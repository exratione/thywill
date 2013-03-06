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
 *
 * @param {string} id
 *   An ID uniquely identifying this application.
 */
function Application (id) {
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
// Methods: sending
//-----------------------------------------------------------

/**
 * Send a message, usually to one specific client.
 *
 * @param {ServerMessage} message
 *   Instance of the ServerMessage class.
 */
p.send = function (message) {
  this.thywill.clientInterface.send(message);
};

/**
 * A shortcut way of sending a message with default addressing and other
 * metadata. It goes to the client side of this application.
 *
 * @param {mixed} data
 *   The data to be passed to the client.
 * @param {string} connectionId
 *   The ID of the client connection to send to.
 * @param {string} [type]
 *   Optionally, set the message type.
 */
p.sendTo = function (data, connectionId, type) {
  var messageManager = this.thywill.messageManager;
  var message = messageManager.createMessage(data);
  message.setConnectionId(connectionId);
  message.setFromApplication(this.id);
  message.setToApplication(this.id);
  message.setDestination(messageManager.destinations.CLIENT);
  message.setOrigin(messageManager.origins.SERVER);
  if (type) {
    message.setType(type);
  }
  this.send(message);
};

//-----------------------------------------------------------
// Methods: resources
//-----------------------------------------------------------

/**
 * Define a resource to be loaded immediately on client connection.
 *
 * @param {Resource} resource
 *   A Resource instance.
 * @param {function} callback
 *   Of the form function (error, storedResource) {}, where error === null on
 *   success and storedResource is the provided resource object with any
 *   amendments that might have been made by the store.
 */
p.storeBootstrapResource = function (resource, callback) {
  this.thywill.clientInterface.storeBootstrapResource(resource, callback);
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
 *   attribute to the passed filePath.
 * @param {function} callback
 *   Of the form function (error, resource) where error === null on success.
 */
p.storeBootstrapResourceFromFile = function (filePath, attributes, callback) {
  var self = this;
  // Add some attributes.
  attributes.originFilePath = filePath;
  // Create the resource and pass it back out in the callback.
  this.thywill.resourceManager.createResourceFromFile(
    attributes.originFilePath,
    attributes,
    function (error, resource) {
      if (error) {
        callback(error);
      } else {
        self.storeBootstrapResource(resource, callback);
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
 *   The manifest object.
 * @param {function} callback
 *   Of the form function (error) where error === null on success.
 */
p.storeBootstrapResourcesFromManifest = function (manifest, callback) {
  var self = this;
  // Turn the manifest into an array so it can be run through async.forEach().
  var attributesArray = [];
  for (var originFilePath in manifest) {
    manifest[originFilePath].originFilePath = originFilePath;
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
 * @param {function} callback
 *   Of the form function (error) {}, where error === null on success.
 */
p._defineBootstrapResources = function (callback) {
  throw new Error("Not implemented.");
};

/**
 * This method is invoked when the application is first registered on Thywill
 * server startup. It should be used to perform any setup that relies on the
 * Thywill components being in place and ready.
 *
 * @param {function} callback
 *   Of the form function (error) {}, where error === null on success.
 */
p._setup = function (callback) {
  throw new Error("Not implemented.");
};

/**
 * Called when a message is received from a client.
 *
 * @param {Message} message
 *   Instance of the Message class.
 */
p.received = function (message) {
  throw new Error("Not implemented.");
};

/**
 * Called when a client connects or reconnects to this cluster member process.
 *
 * @param {string} connectionId
 *   Unique ID of the connection.
 * @param {string} sessionId
 *   Unique ID of the session associated with this connection - one session
 *   might have multiple concurrent connections.
 * @param {Object} session
 *   The session. This will be null if the clientInterface component is
 *   configured not to use sessions.
 */
p.connection = function (connectionId, sessionId, session) {
  throw new Error("Not implemented.");
};

/**
 * Called when a client connects or reconnects to any cluster member
 * process.
 *
 * @param {string} clusterMemberId
 *   ID of the cluster member that has the new connection.
 * @param {string} connectionId
 *   Unique ID of the connection.
 * @param {string} sessionId
 *   Unique ID of the session associated with this connection - one session
 *   might have multiple concurrent connections.
 */
p.connectionTo = function (clusterMemberId, connectionId, sessionId) {
  throw new Error("Not implemented.");
};

/**
 * Called when a client disconnects from this cluster member process.
 *
 * @param {string} connectionId
 *   Unique ID of the connection.
 * @param {string} sessionId
 *   Unique ID of the session associated with this connection - one session
 *   might have multiple concurrent connections.
 */
p.disconnection = function (connectionId, sessionId) {
  throw new Error("Not implemented.");
};

/**
 * Called when a client disconnects from any cluster member process.
 *
 * @param {string} clusterMemberId
 *   ID of the cluster member that has the new connection.
 * @param {string} connectionId
 *   Unique ID of the connection.
 * @param {string} sessionId
 *   Unique ID of the session associated with this connection - one session
 *   might have multiple concurrent connections.
 */
p.disconnectionFrom = function (clusterMemberId, connectionId, sessionId) {
  throw new Error("Not implemented.");
};

/**
 * Called when on of the other cluster members fails, and thus it can be
 * assumed that all of its clients have disconnected.
 *
 * Note that in most application setups this will result in a flurry of
 * reconnections to other cluster members by the disconnected clients, and the
 * dead cluster member itself will restart quite quickly.
 *
 * Bear this in mind when considering how to react; e.g. anything that takes
 * too much time to loop through the disconnected items will quickly be
 * overtaken by events.
 *
 * @param {string} clusterMemberId
 *   ID of the cluster member that failed.
 * @param {object} connectionData
 *   A copy of the connection data for the cluster prior to its failure,
 *   listing session IDs and connection IDs.
 */
p.clusterMemberDown = function (clusterMemberId, connectionData) {
  throw new Error("Not implemented");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Application;
