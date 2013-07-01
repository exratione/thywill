/**
 * @fileOverview
 * Application class definition.
 */

var util = require('util');
var async = require('async');
var Thywill = require('thywill');

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for applications running on Thywill.
 *
 * When Thywill starts up, the following functions are invoked in order:
 *
 * application._defineBootstrapResources()
 * application._setup()
 * application._setupListeners()
 *
 * Only the first two of these have to be implemented by a child class.
 *
 * @param {string} id
 *   An ID uniquely identifying this application.
 */
function Application (id) {
  Application.super_.call(this);
  if (!id) {
    throw new Error('Application class constructor requires an id parameter');
  }
  this.componentType = 'application';
  this.id = id;
}
util.inherits(Application, Thywill.getBaseClass('Component'));
var p = Application.prototype;

//-----------------------------------------------------------
// Methods: sending messages and channels.
//-----------------------------------------------------------

/**
 * Send a message, usually to one specific client.
 *
 * @param {Client|string} client
 *   Client instance or connection ID that will recieve the message.
 * @param {mixed|Message} message
 *   The message data.
 */
p.sendToConnection = function (client, message) {
  this.thywill.clientInterface.sendToConnection(this.id, client, message);
};

/**
 * Send a message to all the active connections associated with a session. This
 * can only be used if a clientTracker component is configured.
 *
 * @param {Client|string} client
 *   Client instance or session ID that will recieve the message.
 * @param {mixed|Message} message
 *   The message data.
 */
p.sendToSession = function (client, message) {
  this.thywill.clientInterface.sendToSession(this.id, client, message);
};

/**
 * Send a message to all the active connections subscribed to a channel.
 *
 * @param {string} channelId
 *   Unique ID for the channel that will recieve the message.
 * @param {mixed|Message} message
 *   The message data.
 * @param {Client|string|array} [excludeClients]
 *   Client instances or connection IDs to exclude from the broadcast.
 */
p.sendToChannel = function (channelId, message, excludeClients) {
  this.thywill.clientInterface.sendToChannel(this.id, channelId, message, excludeClients);
};

/**
 * Subscribe one or more connections to one or more channels.
 *
 * @param {Client|string|array} connectionIds
 *   The Clients instances or connection IDs to be subscribed.
 * @param {string|array} channelIds
 *   One or more channel identifiers.
 * @param {function} callback
 *   Of the form function (error).
 */
p.subscribe = function (clients, channelIds, callback) {
  this.thywill.clientInterface.subscribe(clients, channelIds, callback);
};

/**
 * Unsubscribe one or more connections from one or more channels.
 *
 * @param {Client|string|array} connectionIds
 *   The Clients instances or connection IDs to be unsubscribed.
 * @param {string|array} channelIds
 *   One or more channel identifiers.
 * @param {function} callback
 *   Of the form function (error).
 */
p.unsubscribe = function (clients, channelIds, callback) {
  this.thywill.clientInterface.unsubscribe(clients, channelIds, callback);
};

//-----------------------------------------------------------
// Methods: resources.
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
 *   '/file/system/path/to/file.css': {
 *     clientPath: '/path/to/file.css',
 *     encoding: encoding,
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
// Methods: setup
//-----------------------------------------------------------

/**
 * Set up the listeners that ensure the various notification functions in this
 * instance are invoked at the right time.
 *
 * @param {function} callback
 *   Of the form function (error).
 */
p._setupListeners = function (callback) {
  var self = this;
  var clientInterface = this.thywill.clientInterface;
  var clientTracker = this.thywill.clientTracker;

  // The all-important listener for messages from clients.
  clientInterface.on(clientInterface.events.FROM_CLIENT, function (client, applicationId, message) {
    if (applicationId === self.id) {
      self.receivedFromClient(client, message);
    }
  });

  // If a clientTracker is configured, then listen to its events rather than
  // those of the clientInterface.
  if (clientTracker) {
    clientTracker.on(clientTracker.events.CLUSTER_MEMBER_DOWN, function () {
      self.clusterMemberDown.apply(self, arguments);
    });
    clientTracker.on(clientTracker.events.CONNECTION, function () {
      self.connection.apply(self, arguments);
    });
    clientTracker.on(clientTracker.events.CONNECTION_TO, function () {
      self.connectionTo.apply(self, arguments);
    });
    clientTracker.on(clientTracker.events.DISCONNECTION, function () {
      self.disconnection.apply(self, arguments);
    });
    clientTracker.on(clientTracker.events.DISCONNECTION_FROM, function () {
      self.disconnectionFrom.apply(self, arguments);
    });
  }
  // Otherwise listen to the clientInterface for connection and disconnection
  // events for the local cluster member process only.
  else {
    clientInterface.on(clientInterface.events.CONNECTION, function () {
      self.connection.apply(self, arguments);
    });
    clientInterface.on(clientInterface.events.DISCONNECTION, function () {
      self.disconnection.apply(self, arguments);
    });
  }

  callback();
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
 *   Of the form function (error).
 */
p._defineBootstrapResources = function (callback) {
  callback();
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
  callback();
};

/**
 * Called when a message is received from a client.
 *
 * @param {Client} client
 *   Client instance.
 * @param {Message} message
 *   Instance of the Message class.
 */
p.receivedFromClient = function (client, message) {};

/**
 * Called when a client connects or reconnects to this cluster member process.
 *
 * @param {Client} client
 *   Client instance.
 * @param {Object} session
 *   The session. This will be null if the clientInterface component is
 *   configured not to use sessions.
 */
p.connection = function (client, session) {};

/**
 * Called when a client connects or reconnects to any cluster member
 * process.
 *
 * Only invoked if the optional clientTracker component is configured.
 *
 * @param {string} clusterMemberId
 *   ID of the cluster member that has the new connection.
 * @param {Client} client
 *   Client instance.
 */
p.connectionTo = function (clusterMemberId, client) {};

/**
 * Called when a client disconnects from this cluster member process.
 *
 * @param {Client} client
 *   Client instance.
 */
p.disconnection = function (client) {};

/**
 * Called when a client disconnects from any cluster member process.
 *
 * Only invoked if the optional clientTracker component is configured.
 *
 * @param {string} clusterMemberId
 *   ID of the cluster member that has the new connection.
 * @param {Client} client
 *   Client instance.
 */
p.disconnectionFrom = function (clusterMemberId, client) {};

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
 * The application will not get disconnectionFrom() notices for any of the
 * connectionIds provided via this method.
 *
 * Only invoked if the optional clientTracker component is configured.
 *
 * @param {string} clusterMemberId
 *   ID of the cluster member that failed.
 * @param {object} connectionData
 *   A copy of the connection data for the cluster member prior to its failure,
 *   listing session IDs and connection IDs.
 */
p.clusterMemberDown = function (clusterMemberId, connectionData) {};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Application;
