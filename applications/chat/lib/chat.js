/**
 * @fileOverview
 * Chat class definition, a trivial example application.
 */

var crypto = require("crypto");
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
        messageTemplateId: "chat-template-message",
        disconnectMessageTemplateId: "chat-template-disconnect-message",
        reconnectMessageTemplateId: "chat-template-reconnect-message",
        channelTemplateId: "chat-template-channel"
      });
      // Create and store the resource.
      var resource = self.thywill.resourceManager.createResource(data, {
        clientPath: "/chat/js/chatClient.js",
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
  this.queueKey = this.config.redis.prefix + "queue";
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

  // This is a chat message for the channel that this user is joined to.
  // {
  //   action: "message"
  //   // The typed text message.
  //   message: string
  // }
  if (data.action === "message") {
    this.publishMessageToCurrentChannel(message);
  }
  // This user kicked the current chat partner.
  else if (data.action === "kick") {
    this.thywill.log.debug("Session " + message.getSessionId() + " kicked its chat partner.");
    this.unpairClientSessionsViaKick(message.getSessionId(), function (error) {
      if (error) {
        self.thywill.log.error(error);
      }
    });
  }
  // The client is looking for a chat partner.
  else if (data.action === "findPartner") {
    this.thywill.log.debug("Session " + message.getSessionId() + " requests a new chat partner.");
    this.checkQueue(message.getSessionId(), function (error) {
      if (error) {
        self.thywill.log.error(error);
      }
    });
  }
};

/**
 * Publish the contents of this message to the channel that the client is
 * subscribed to - i.e. sent it to the paired user in the channel.
 *
 * @param {ServerMessage} message
 */
p.publishMessageToCurrentChannel = function (message) {
  var self = this;
  this.thywill.channelManager.getChannelIdsForSession(message.getSessionId(), function (error, channelIds) {
    if (error) {
      self.thywill.log(error);
      return;
    }

    // Should only be one channel we're sending to here.
    if (channelIds.length) {
      var outgoingData = {
        action: "message",
        message: message.getData().message
      };
      var messageManager = self.thywill.messageManager;
      var outgoingMessage = messageManager.createMessageToChannel(outgoingData, channelIds[0], self.id);
      self.send(outgoingMessage);
    }
  });
};

/**
 * One client has kicked another, so disband the chat. The clients will then
 * have to send separate requests for new partners to be found.
 *
 * @param {string} sessionId
 *   Session ID for the client who issued the kick.
 * @param {function} callback
 *   Of the form function (error).
 */
p.unpairClientSessionsViaKick = function (sessionId, callback) {
  var self = this;
  var channelId;
  var sessionIds;

  var fns = {
    // Find which channels this session belongs to - it should only be one.
    loadChannelIds: function (asyncCallback) {
      // Check to see if this client is already set up with a chat channel.
      self.thywill.channelManager.getChannelIdsForSession(sessionId, function (error, channelIds) {
        if (!error) {
          // If there are no channels, why are we here? Get out by calling the main callback.
          if (!channelIds.length) {
            self.thywill.log.warn("No channel when processing a kick issued by session:" + sessionId);
            callback();
            return;
          } else {
            channelId = channelIds[0];
          }
        }
        asyncCallback(error);
      });
    },
    // Clear session IDs from the channel, and find the session that needs to
    // be kicked. Should only be one.
    clearChannel: function (asyncCallback) {
      self.thywill.channelManager.clear(channelId, function (error, removedSessionIds) {
        if (!error) {
          // Remove the ID of the session issuing the kick.
          sessionIds = removedSessionIds.filter(function (id, index, array) {
            return (id !== sessionId);
          });
        }
        asyncCallback(error);
      });
    },
    // Send out the kick notices.
    sendKickMessages: function (asyncCallback) {
      var outgoingData = {
        action: "kicked"
      };
      sessionIds.forEach(function (id, index, array) {
        var outgoingMessage = self.thywill.messageManager.createMessageToSession(
          outgoingData, id, self.id
        );
        self.send(outgoingMessage);
      });
    }
  };

  async.series(fns, callback);
};

/**
 * Set up two client sessions to chat to one another.
 *
 * @param {string} localSessionId
 *   Session ID of a connection to this server process.
 * @param {string} otherSessionId
 *   Session ID from the queue that may or may not be local.
 * @param {function} callback
 *   Of the form function (error).
 */
p.pairClientSessions = function (localSessionId, otherSessionId, callback) {
  var self = this;
  this.thywill.log.debug("Chat: Pairing " + localSessionId + " with " + otherSessionId);

  // Create a channel and add these sessions to it. Ensure the channel name
  // is the same whichever way around the two sessions are.
  var str = [localSessionId, otherSessionId].sort().join();
  var channelId = crypto.createHash("md5").update(str).digest("hex");
  this.thywill.channelManager.addSessionIds(channelId, [localSessionId, otherSessionId], function (error) {
    if (error) {
      self.thywill.log.error(error);
      return;
    }
    self.setClientToChat(localSessionId, channelId);
    self.setClientToChat(otherSessionId, channelId);
  });
};

/**
 * Tell the connected clients for a session that a chat is started.
 *
 * @param {string} sessionId
 *   Session ID of to tell to start chatting.
 * @param {string} channelId
 *   The channel for the chat.
 */
p.setClientToChat = function (sessionId, channelId) {
  var data = {
    action: "startChat",
    channelId: channelId
  };
  var message = this.thywill.messageManager.createMessageToSession(data, sessionId, this.id);
  this.send(message);
};

/**
 * Check the queue to see if there is a waiting connection to pair up with this
 * new connection. If so, then create a new channel via the channelManager
 * and assign the sessions for both connections to it.
 *
 * @param {string} localSessionId
 *   Session ID of a connection to this server process.
 * @param {function} callback
 *   Of the forum function (error).
 */
p.checkQueue = function (localSessionId, callback) {
  var self = this;
  // See if there's a session in the queue.
  this.config.redis.client.spop(this.queueKey, function (error, otherSessionId) {
    if (error) {
      callback(error);
      return;
    }
    // If there is a waiting session, then pair them up.
    if (otherSessionId && otherSessionId !== localSessionId) {
      // Is this session still online?
      self.thywill.clientInterface.sessionIsConnected(otherSessionId, function (error, isConnected) {
        if (error) {
          callback(error);
          return;
        }
        // If the connection is still live, then pair these up.
        if (isConnected) {
          self.pairClientSessions(localSessionId, otherSessionId, callback);
        }
        // Otherwise we recurse and go look for another connection - there
        // shouldn't be many zombies, and they'll get cleared this way.
        else {
          self.checkQueue(localSessionId, callback);
        }
      });
    }
    // Otherwise we add the new connection to the queue to wait.
    else {
      self.config.redis.client.sadd(self.queueKey, localSessionId, callback);
    }
  });
};

/**
 * A session connects and has an existing channel. If this the only connection
 * for the session, then inform the chat partner that this session has
 * reconnected.
 *
 * @param {string} channelId
 *   The channel for the chat.
 * @param {string} sessionId
 *   Session ID of to tell to start chatting.
 */
p.notifyOfReconnectionIfNecessary = function (channelId, sessionId) {
  var self = this;
  var sessionIds = [];

  var fns = {
    // If this session has other connections, we don't have to do anything
    // here. But we do have to at least check that.
    getSessionConnections: function (asyncCallback) {
      self.thywill.clientInterface.connectionIdsForSession(sessionId, function (error, connectionIds) {
        if (error) {
          asyncCallback(error);
        } else if (connectionIds.length === 1) {
          asyncCallback();
        } else {
          // If no error and this is not the only connection, then finish here
          // and do nothing - no need to notify.
        }
      });
    },
    // Get the session ID for the other client in the chat.
    findOtherClientSessionId: function (asyncCallback) {
      self.thywill.channelManager.getSessionIds(channelId, function (error, loadedSessionIds) {
        if (!error) {
          // Remove the ID of the connecting session.
          sessionIds = loadedSessionIds.filter(function (id, index, array) {
            return (id !== sessionId);
          });
        }
        asyncCallback(error);
      });
    },
    // Tell the other client session about the reconnection by this session.
    informOtherClient: function (asyncCallback) {
      var outgoingData = {
        action: "reconnected"
      };
      sessionIds.forEach(function (id, index, array) {
        var outgoingMessage = self.thywill.messageManager.createMessageToSession(
          outgoingData, id, self.id
        );
        self.send(outgoingMessage);
      });
      asyncCallback();
    }
  };

  async.series(fns, function (error) {
    if (error) {
      self.thywill.log.error(error);
    }
  });
};

/**
 * @see Application#connection
 */
p.connection = function (connectionId, sessionId, session) {
  var self = this;
  // Check to see if this client is already set up with a chat channel.
  this.thywill.channelManager.getChannelIdsForSession(sessionId, function (error, channelIds) {
    if (error) {
      self.thywill.log(error);
    } else if (channelIds.length) {
      // The channelManager will ensure that this client connection is
      // resubscribed to receive messages via the channel.
      self.thywill.log.debug("Chat: Client session " + sessionId + " connected, already has a chat channel: " + channelIds[0]);
      // But we have to tell the client that the chat is on.
      self.setClientToChat(sessionId, channelIds[0]);
      // Notify other side of the conversation of a reconnection.
      self.notifyOfReconnectionIfNecessary(channelIds[0], sessionId);
    } else {
      self.thywill.log.debug("Chat: Client session " + sessionId + " connected, needs to be given a chat channel.");
      // See if we can pair this client up with another one.
      self.checkQueue(sessionId, function (error) {
        if (error) {
          self.thywill.log.error(error);
        }
      });
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
  var self = this;
  var channelId;
  var sessionIds = [];

  var fns = {
    // If this session has other connections, we don't have to do anything
    // here. But we do have to at least check that.
    checkSessionStillConnected: function (asyncCallback) {
      self.thywill.clientInterface.sessionIsConnected(sessionId, function (error, isConnected) {
        if (error) {
          asyncCallback(error);
        } else if (!isConnected) {
          self.thywill.log.debug("Chat: Client session " + sessionId + " disconnected last connection: " + connectionId);
          asyncCallback();
        } else {
          // If no error and showing as connected, just end here and don't
          // continue. The user closed one of multiple browser panes and is
          // still connected.
          self.thywill.log.debug("Chat: Client session " + sessionId + " disconnected one of its established connections: " + connectionId);
        }
      });
    },
    // Find which channels this session belongs to - it should only be one.
    loadChannelIds: function (asyncCallback) {
      self.thywill.channelManager.getChannelIdsForSession(sessionId, function (error, channelIds) {
        if (error) {
          asyncCallback(error);
          return;
        }
        // Only bother continuing with the async callback if this session is
        // in a channel.
        if (channelIds.length) {
          channelId = channelIds[0];
          asyncCallback();
        }
      });
    },
    // Get the session ID for the other client in the chat.
    findOtherClientSessionId: function (asyncCallback) {
      self.thywill.channelManager.getSessionIds(channelId, function (error, loadedSessionIds) {
        if (!error) {
          // Remove the ID of the disconnecting session.
          sessionIds = loadedSessionIds.filter(function (id, index, array) {
            return (id !== sessionId);
          });
        }
        asyncCallback(error);
      });
    },
    // Tell the other client session about the disconnection by this session.
    informOtherClient: function (asyncCallback) {
      var outgoingData = {
        action: "disconnected"
      };
      sessionIds.forEach(function (id, index, array) {
        var outgoingMessage = self.thywill.messageManager.createMessageToSession(
          outgoingData, id, self.id
        );
        self.send(outgoingMessage);
      });
      asyncCallback();
    }
  };

  async.series(fns, function (error) {
    if (error) {
      self.thywill.log.error(error);
    }
  });
};

/**
 * @see Application#disconnectionFrom
 */
p.disconnectionFrom = function (clusterMemberId, connectionId, sessionId) {
  // We don't need to know about disconnections from other cluster members.
};

/**
 * @see Application#clusterMemberDown
 */
p.clusterMemberDown = function (clusterMemberId, connectionData) {
  // We don't do anything here; the clients will all reconnect to different processes,
  // and the channelManager will ensure they're still subscribed and matched to the
  // appropriate chat channel.
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = Chat;
