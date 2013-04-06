/**
 * @fileOverview
 * Display class definition, a trivial example application.
 */

var util = require("util");
var path = require("path");
var fs = require("fs");

var async = require("async");
var Thywill = require("thywill");
var bootstrapManifest = require("./bootstrapManifest");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A trivial example application.
 *
 * This application relays the cross-talk between clustered server
 * processes down to the clients, where it is displayed.
 */
function Display (id) {
  Display.super_.call(this, id);

  // The channel used to broadcast display data.
  this.channelId = "display";
}
util.inherits(Display, Thywill.getBaseClass("Application"));
var p = Display.prototype;

//-----------------------------------------------------------
// Initialization
//-----------------------------------------------------------

/**
 * @see Application#_defineBootstrapResources
 */
p._defineBootstrapResources = function (callback) {
  var self = this;
  // Text encoding throughout.
  var encoding = "utf8";

  // An array of functions load up bootstrap resources.
  var fns = [
    // Add resources from files listed in the bootstrap manifest.
    function (asyncCallback) {
      self.storeBootstrapResourcesFromManifest(bootstrapManifest, asyncCallback);
    },
    // Add the Echo client Javascript separately, as it needs to be rendered
    // as a template.
    function (asyncCallback) {
      // Load the file.
      var originFilePath = path.resolve(__dirname, "../client/js/displayClient.js");
      var data = fs.readFileSync(originFilePath, encoding);

      // A little templating.
      var clusterMembers = self.thywill.cluster.getClusterMemberIds().map(function (clusterMemberId, index, array) {
        return {
          id: clusterMemberId
        };
      });
      clusterMembers = JSON.stringify(clusterMembers);
      data = self.thywill.templateEngine.render(data, {
        applicationId: self.id,
        clusterMembers: clusterMembers,
        uiTemplateId: "display-template-ui",
        textTemplateId: "display-template-text",
        connectionTemplateId: "display-template-connection"
      });

      // Create and store the resource.
      var resource = self.thywill.resourceManager.createResource(data, {
        clientPath: "/display/js/displayClient.js",
        encoding: encoding,
        originFilePath: originFilePath,
        weight: 50
      });
      self.storeBootstrapResource(resource, asyncCallback);
    }
  ];
  async.series(fns, callback);
};

/**
 * @see Application#_setup
 */
p._setup = function (callback) {
  var self = this;

  // Start listening on generic cluster events.
  this.thywill.cluster.on(this.thywill.cluster.eventNames.CLUSTER_MEMBER_DOWN, function (data) {
    self.sendText(data.clusterMemberId + " is down.");
  });
  this.thywill.cluster.on(this.thywill.cluster.eventNames.CLUSTER_MEMBER_UP, function (data) {
    self.sendText(data.clusterMemberId + " is up.");
  });

  // Listen in on clientTracker-specific cluster events.
  this.thywill.cluster.on(this.thywill.clientTracker.clusterTask.connectionData, function (data) {
    self.sendText("Connection data delivered from " + data.clusterMemberId);
  });
  this.thywill.cluster.on(this.thywill.clientTracker.clusterTask.connectionDataRequest, function (data) {
    self.sendText("Request for connection data from " + data.clusterMemberId);
  });

  callback();
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Application#receive
 */
p.receivedFromClient = function (client, message) {
  // Not used in this application - the clients are passive listeners.
};

/**
 * Send a text message down to the clients for display.
 *
 * @param {string} text
 */
p.sendText = function (text) {
  this.publish({
    type: "text",
    text: text
  });
};

/**
 * Tell the clients that a user connected to this process.
 *
 * @param {string} connectionId
 */
p.sendConnectionNotice = function (connectionId) {
  this.publish({
    type: "connection",
    connectionId: connectionId
  });
};

/**
 * Give a specific client a list of current connections by cluster process.
 *
 * @param {object} connectionData
 */
p.sendConnectionList = function (connectionId) {
  var self = this;
  this.thywill.clientTracker.getConnectionData(function (error, data) {
    if (error) {
      self.thywill.log.error(error);
      return;
    }
    var connections = {};
    for (var clusterMemberId in data) {
      connections[clusterMemberId] = Object.keys(data[clusterMemberId].connections);
    }
    var messageData = {
      type: "connectionList",
      connections: connections
    };
    self.sendToConnection(connectionId, messageData);
  });
};

/**
 * Tell the clients that one or more users disconnected from this process.
 *
 * @param {string} connectionId
 */
p.sendDisconnectionNotice = function (connectionId) {
  this.publish({
    type: "disconnection",
    connectionId: connectionId
  });
};

/**
 * Publish this data to all clients.
 *
 * @param {object} data
 *   Data to send to the client.
 */
p.publish = function (data) {
  data.clusterMemberId = this.thywill.cluster.getLocalClusterMemberId();
  this.sendToChannel(this.channelId, data);
};

/**
 * @see Application#connection
 */
p.connection = function (client) {
  var self = this;
  var connectionId = client.getConnectionId();
  this.thywill.log.debug("Display: Client connected: " + connectionId);
  var fns = {
    // Every client is subscribed to the same channel, used to broadcast updates.
    subscribe: function (asyncCallback) {
      self.subscribe(client, self.channelId, asyncCallback);
    }
  };
  async.series(fns, function (error) {
    if (error) {
      self.thywill.log.error(error);
    }
    self.sendConnectionList(connectionId);
    self.sendConnectionNotice(connectionId);
  });
};

/**
 * @see Application#connectionTo
 */
p.connectionTo = function (clusterMemberId, client) {
  if (clusterMemberId !== this.thywill.cluster.getLocalClusterMemberId()) {
    this.sendText(client.getConnectionId() + " connected to " + clusterMemberId + ".");
  }
};

/**
 * @see Application#disconnection
 */
p.disconnection = function (client) {
  var connectionId = client.getConnectionId();
  this.thywill.log.debug("Display: Client disconnected: " + connectionId);
  this.sendDisconnectionNotice(connectionId);
};

/**
 * @see Application#disconnectionFrom
 */
p.disconnectionFrom = function (clusterMemberId, client) {
  if (clusterMemberId !== this.thywill.cluster.getLocalClusterMemberId()) {
    this.sendText(client.getConnectionId() + " disconnected from " + clusterMemberId + ".");
  }
};

/**
 * @see Application#clusterMemberDown
 */
p.clusterMemberDown = function (clusterMemberId, connectionData) {
  var self = this;
  // If the designated handler, update the remaining clients with the list
  // of now-disconnected connection IDs. The clients will all be reconnecting
  // (or already reconnected) to another process, but those will be using new
  // connection IDs and will be correctly handled.
  this.thywill.cluster.isDesignatedHandlerFor(clusterMemberId, function (error, isDesignatedHandler) {
    if (error) {
      self.thywill.log.error(error);
    }
    if (isDesignatedHandler) {
      var connections = {};
      connections[clusterMemberId] = Object.keys(connectionData.connections);
      var data = {
        type: "disconnectionList",
        connections: connections
      };
      self.sendToChannel(self.channelId, data);
    }
  });
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Display;
