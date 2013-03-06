/**
 * @fileOverview
 * Chat class definition, a trivial example application.
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
 * A trivial example application. This application pairs users into one on one
 * chats.
 *
 * The config object has the following form:
 *
 * {
 *   redis: {
 *     // A redis client instance.
 *     client: object
 *     // A prefix to apply to all keys.
 *     prefix: string
 *   }
 * }
 *
 * @param {string} id
 *   The application ID.
 * @param {object} config
 *   Configuration.
 */
function Chat (id, config) {
  Chat.super_.call(this, id);
  this.config = config;
}
util.inherits(Chat, Thywill.getBaseClass("Application"));
var p = Chat.prototype;

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
      var originFilePath = path.resolve(__dirname, "../client/js/chatClient.js");
      var data = fs.readFileSync(originFilePath, encoding);
      // A little templating to insert the application ID.
      data = self.thywill.templateEngine.render(data, {
        applicationId: self.id,
        uiTemplateId: "chat-template-ui",
        messageTemplateId: "chat-template-message"
      });
      // Create and store the resource.
      var resource = self.thywill.resourceManager.createResource(data, {
        clientPath: "/chat/js/chatClient.js",
        encoding: encoding,
        minified: false,
        originFilePath: originFilePath,
        type: self.thywill.resourceManager.types.JAVASCRIPT,
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
  this.queueKey = this.config.redis.prefix + "queue";
  // Each server is responsible for keeping track of local connections that
  // are paired, so that if the other connection disconnects, then the local
  // connection is notified.
  this.pairedWithLocalConnections = {};
  callback(this.NO_ERRORS);
};

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see Application#receive
 */
p.received = function (message) {
  var self = this;
  var data = message.getData();

  // This is a chat message going from user A to user B with data of the form:
  // {
  //   action: "message"
  //   // The typed text message.
  //   message: string
  //   // Who it's going to.
  //   toCid: string
  // }
  if (data.action === "message") {
    var outgoingData = {
      action: "message",
      message: data.message,
      fromCid: message.getConnectionId()
    };
    var outgoingMessage = this.thywill.messageManager.createMessage(outgoingData, data.toCid, this.id);
    this.send(outgoingMessage);
  }
  // This user kicked the current chat partner.
  else if (data.action === "kick") {
    this.unpairClientsViaKick(message.getConnectionId(), function (error) {
      if (error) {
        self.thywill.log.error(error);
      }
    });
  }
  // The client is looking for a chat partner.
  else if (data.action === "findPartner") {
    this.checkQueue(message.getConnectionId, function (error) {
      if (error) {
        self.thywill.log.error(error);
      }
    });
  }
};

/**
 * One client has disconnected, so disband the chat and send the remaining
 * client looking for a new partner. Call this even for disconnects occurring
 * prior to pairing of chat partners, as it will clean up the queue as well.
 *
 * @param {string} connectionId
 *   The disconnected client.
 * @param {function} callback
 *   Of the form function (error).
 */
p.unpairClientsViaDisconnect = function (connectionId, callback) {
  var self = this;
  var otherConnectionId;

  var fns = {
    findOtherClientConnectionId: function (asyncCallback) {
      self.config.redis.client.hget(self.pairsKey, connectionId, function (error, value) {
        otherConnectionId = value;
        asyncCallback(error);
      });
    },
    informOtherClient: function (asyncCallback) {
      if (otherConnectionId) {
        var outgoingData = {
          action: "disconnected"
        };
        var outgoingMessage = self.thywill.messageManager.createMessage(
          outgoingData, otherConnectionId, self.id
        );
        self.send(outgoingMessage);
      }
      asyncCallback();
    },
    removeRecords: function (asyncCallback) {
      // A disconnect can occur at all points in the process, so clean up the
      // queue as well.
      var multi = self.config.redis.client.multi()
        .hdel(self.pairsKey, connectionId)
        .srem(self.queueKey, connectionId);
      if (otherConnectionId) {
        multi.hdel(self.pairsKey, otherConnectionId);
      }
      multi.exec(asyncCallback);
    },
    // Send this client back to the queue for another partner.
    checkQueueForOtherClient: function (asyncCallback) {
      if (otherConnectionId) {
        // Impose a short delay, give recognition and the front end a chance.
        setTimeout(function () {
          self.checkQueue(otherConnectionId, asyncCallback);
        }, 2000);
      } else {
        asyncCallback();
      }
    }
  };

  async.series(fns, callback);
};


/**
 * One client has kicked another, so disband the chat. The clients will then
 * have to send separate requests for new partners to be found.
 *
 * @param {string} connectionId
 *   The client who kicked the other client.
 * @param {function} callback
 *   Of the form function (error).
 */
p.unpairClientsViaKick = function (connectionId, callback) {
  var self = this;
  var kickedConnectionId = this.pairedWithLocalConnections[connectionId];
  delete this.pairedWithLocalConnections[connectionId];
  // The kicked connection ID is usually connected to one of the other server
  // processes, but might be connected to this one. So try to remove anyway.
  delete this.pairedWithLocalConnections[kickedConnectionId];

  // Tell the kicked connection, if it exists - which it should, but you can't
  // be too careful.
  if (kickedConnectionId) {
    var outgoingData = {
      action: "kicked"
    };
    var outgoingMessage = self.thywill.messageManager.createMessage(
      outgoingData, kickedConnectionId, self.id
    );
    self.send(outgoingMessage);
  }

  callback();
};

/**
 * Set up two clients to chat to one another.
 *
 * @param {string} localConnectionId
 *   ID of a connection to this server process.
 * @param {string} otherConnectionId
 *   ID of a connection from the queue that may or may not be local.
 * @param {function} callback
 *   Of the forum function (error).
 */
p.pairClients = function (localConnectionId, otherConnectionId, callback) {
  var self = this;
  this.thywill.log.debug("Chat: Pairing " + localConnectionId + " with " + otherConnectionId);

  function setClientToChat(connectionId, chatWithConnectionId) {
    var data = {
      action: "startChat",
      cid: chatWithConnectionId
    };
    var message = self.thywill.messageManager.createMessage(data, connectionId, self.id);
    self.send(message);
  }
  setClientToChat(localConnectionId, otherConnectionId);
  setClientToChat(otherConnectionId, localConnectionId);

  // Add a record of who is paired up to clients connected to this process -
  // note that it's possible that both are local.
  this.pairedWithLocalConnections[otherConnectionId] = localConnectionId;
  this.thywill.cluster.clientIsConnectedLocally(otherConnectionId, function (error, isConnected) {
    if (isConnected) {
      this.pairedWithLocalConnections[localConnectionId] = otherConnectionId;
    }
  });
};

/**
 * Check the queue to see if there is a waiting connection to pair up with
 * this new connection.
 *
 * @param {string} localConnectionId
 *   ID of a connection to this server process.
 * @param {function} callback
 *   Of the forum function (error).
 */
p.checkQueue = function (localConnectionId, callback) {
  var self = this;
  // See if there's a connection in the queue.
  this.config.redis.client.spop(this.queueKey, function (error, otherConnectionId) {
    if (error) {
      callback(error);
      return;
    }
    // If there is a waiting connection, then pair them up.
    if (otherConnectionId) {
      // Is this connection ID still online? In some cases we're going to have
      // zombie connections in the queue - e.g. a server process fell over,
      // some of this code exploded, etc.
      self.thywill.clientInterface.clientIsConnected(otherConnectionId, function (error, isConnected) {
        if (error) {
          callback(error);
          return;
        }
        // If the connection is still live, then pair these up.
        if (isConnected) {
          self.pairClients(localConnectionId, otherConnectionId, callback);
        }
        // Otherwise we recurse and go look for another connection - there
        // shouldn't be many zombies, and they'll get cleared this way.
        else {
          self.checkQueue(localConnectionId, callback);
        }
      });
    }
    // Otherwise we add the new connection to the queue to wait.
    else {
      self.config.redis.client.sadd(self.queueKey, localConnectionId, callback);
    }
  });
};

/**
 * @see Application#connection
 */
p.connection = function (connectionId, sessionId, session) {
  var self = this;
  this.thywill.log.debug("Chat: Client connected: " + connectionId);



  // See if we can pair this client up with another one.
  this.checkQueue(connectionId, function (error) {
    if (error) {
      self.thywill.log.error(error);
    }
  });
};

/**
 * @see Application#connectionTo
 */
p.connectionTo = function (clusterMemberId, connectionId, sessionId) {
  // We don't need to know about connections to other servers.
};

/**
 * @see Application#disconnection
 */
p.disconnection = function (connectionId, sessionId) {
  this.thywill.log.debug("Chat: Client disconnected: " + connectionId);
};

/**
 * @see Application#disconnectionFrom
 */
p.disconnectionFrom = function (clusterMemberId, connectionId, sessionId) {
  var self = this;
  // Check to see whether this client was connected to a local client.
  this.unpairClientsViaDisconnect(connectionId, function (error) {
    if (error) {
      self.thywill.log.error(error);
    }
  });
};

/**
 * @see Application#clusterMemberDown
 */
p.clusterMemberDown = function (clusterMemberId, connectionData) {


};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Chat;
