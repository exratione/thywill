/**
 * @fileOverview
 * ServerMessage class definition.
 */

var util = require("util");
var clone = require("clone");
var Message = require("./message");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A ServerMessage instance wraps data for delivery from server to client.
 *
 * Construct messages using MessageManager implementations.
 */
function ServerMessage () {
  ServerMessage.super_.call(this);
}
util.inherits(ServerMessage, Message);
var p = ServerMessage.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

ServerMessage.ORIGINS = {
  SERVER: "s",
  CLIENT: "c"
};
ServerMessage.DESTINATIONS = ServerMessage.ORIGINS;

// The server message metadata expands on the message metadata with parameters
// that need only exist on the server, or shouldn't be exposed to the client.
ServerMessage.METADATA = clone(Message.METADATA);
// The name of a channel, indicating that a messages is to be published
// rather than sent to a single client.
ServerMessage.METADATA.CHANNEL_ID = "chid";
// The ID of a specific client connection, either as sender or recipient.
// If CHANNEL_ID is set, then CONNECTION_ID implies an originating client
// that should be excluded from receiving the published message.
ServerMessage.METADATA.CONNECTION_ID = "cid";
// Whether the message is delivered to server or client.
ServerMessage.METADATA.DESTINATION = "dest";
// Whether the message originated from server or client.
ServerMessage.METADATA.ORIGIN = "orig";

ServerMessage.TYPES = Message.TYPES;

//-----------------------------------------------------------
// Methods: metadata convenience getters and setters.
//-----------------------------------------------------------

p.getChannelId = function () {
  return this.getMetadata(ServerMessage.METADATA.CHANNEL_ID);
};
p.setChannelId = function (channelId) {
  this.setMetadata(ServerMessage.METADATA.CHANNEL_ID, channelId);
};

p.getConnectionId = function () {
  return this.getMetadata(ServerMessage.METADATA.CONNECTION_ID);
};
p.setConnectionId = function (connectionId) {
  this.setMetadata(ServerMessage.METADATA.CONNECTION_ID, connectionId);
};

p.getDestination = function () {
  return this.getMetadata(ServerMessage.METADATA.DESTINATION);
};
p.setDestination = function (destination) {
  this.setMetadata(ServerMessage.METADATA.DESTINATION, destination);
};

p.getOrigin = function () {
  return this.getMetadata(ServerMessage.METADATA.ORIGIN);
};
p.setOrigin = function (origin) {
  this.setMetadata(ServerMessage.METADATA.ORIGIN, origin);
};

//-----------------------------------------------------------
// Methods: utilities
//-----------------------------------------------------------

/**
 * Create a Message instance from this suitable for sending down to the client.
 * This essentially strips out metadata we don't want the client to see.
 *
 * @return {Message}
 *   A Message instance.
 */
p.createClientMessage = function () {
  var clientMessage = new Message();
  clientMessage.setData(this.getData());
  for (var key in Message.METADATA) {
    var metadataKey = Message.METADATA[key];
    var metadataValue = this.getMetadata(metadataKey);
    if (metadataValue) {
      clientMessage.setMetadata(metadataKey, metadataValue);
    }
  }
  return clientMessage;
};

/**
 * Determine whether this message is valid: it has data and the required
 * metadata is populated.
 *
 * @return {boolean}
 *   True if this instance is a valid message.
 */
p.isValid = function () {
  // Call the superclass validitity check.
  if (!this.constructor.super_.prototype.isValid.call(this)) {
    return false;
  }

  // Is the origin valid?
  var origin = this.getOrigin();
  if (!origin) {
    return false;
  }
  var validOrigin = Object.keys(ServerMessage.ORIGINS).some(function (key, index, array) {
    return (ServerMessage.ORIGINS[key] === origin);
  });
  if (!validOrigin) {
    return false;
  }

  // Is the destination valid?
  var destination = this.getDestination();
  if (!destination) {
    return false;
  }
  var validDestination = Object.keys(ServerMessage.DESTINATIONS).some(function (key, index, array) {
    return (ServerMessage.DESTINATIONS[key] === destination);
  });
  if (!validDestination) {
    return false;
  }

  // A message from the client has to have a connection ID.
  if (origin === ServerMessage.ORIGINS.CLIENT) {
    if(!this.getConnectionId()) {
      return false;
    }
  }
  // A message to the client has to have either a connection ID or a channel ID.
  if (destination === ServerMessage.DESTINATIONS.CLIENT) {
    if(!this.getConnectionId() && !this.getChannelId()) {
      return false;
    }
  }

  return true;
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = ServerMessage;
