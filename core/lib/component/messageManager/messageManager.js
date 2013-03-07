/**
 * @fileOverview
 * MessageManager class definition.
 */

var util = require("util");
var clone = require("clone");
var Thywill = require("thywill");
var Message = require("./message");
var ServerMessage = require("./serverMessage");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * The superclass for resource managers, used to generate and store resources
 * in Thywill - meaning data to be served to a client.
 */
function MessageManager() {
  MessageManager.super_.call(this);
  this.componentType = "messageManager";

  // Convenience copies; it's usually easier if you don't have to load the
  // Message class.
  this.origins = ServerMessage.ORIGINS;
  this.destinations = ServerMessage.DESTINATIONS;
  this.metadata = ServerMessage.METADATA;
  this.types = ServerMessage.TYPES;
}
util.inherits(MessageManager, Thywill.getBaseClass("Component"));
var p = MessageManager.prototype;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * Obtain a client Message instance corresponding to the provided ServerMessage
 * instance.
 *
 * @param {ServerMessage} message
 *   A ServerMessage instance.
 * @return {Message}
 *   A Message instance.
 */
p.convertServerMessageToClientMessage = function (message) {
  return message.createClientMessage();
};

/**
 * Obtain a client Message instance corresponding to the provided ServerMessage
 * instance.
 *
 * @param {Message|object} message
 *   A Message instance or raw object with the same internal structure.
 * @param {object} additionalMetadata
 *   The required extra metadata to make a valid server message.
 * @return {ServerMessage}
 *   A ServerMessage instance.
 */
p.convertClientMessageToServerMessage = function (message, additionalMetadata) {
  additionalMetadata = additionalMetadata || {};
  // Add only the listed metadata from the original message - prevent other
  // things sneaking past.
  //
  // Using internals rather than methods because this may or may not be a
  // Message instance - it might just be an object with the same properties.
  if (message._ && typeof message._ === "object") {
    for (var key in Message.METADATA) {
      var metadataKey = Message.METADATA[key];
      if (message._[metadataKey]) {
        additionalMetadata[metadataKey] = message._[metadataKey];
      }
    }
  }
  return this.createServerMessage(message.data, additionalMetadata);
};

/**
 * Obtain a new Message object.
 *
 * @param {mixed} data
 *   The message data.
 * @param {Object} [metadata]
 *   Message metadata: type, addressing, etc. This is optional, and can be
 *   set later on the message instance directly.
 * @return {Message}
 *   A Message instance.
 */
p.createClientMessage = function (data, metadata) {
  var message = new Message();
  message.setData(data);
  message.setMetadata(metadata);
  return message;
};

/**
 * Obtain a new ServerMessage object. There are two ways of calling this
 * method:
 *
 * createServerMessage(data, metadata);
 * createServerMessage(data, connectionId, applicationId);
 *
 * In the latter case, the message will have metadata set to be delivered to
 * the specified client connection and application.
 *
 * @return {ServerMessage}
 *   A ServerMessage instance.
 */
p.createServerMessage = function () {
  var message = new ServerMessage();
  message.setData(arguments[0]);
  if (arguments.length < 3) {
    message.setMetadata(arguments[1]);
  } else {
    message.setConnectionId(arguments[1]);
    message.setFromApplication(arguments[2]);
    message.setToApplication(arguments[2]);
    message.setOrigin(this.origins.SERVER);
    message.setDestination(this.destinations.CLIENT);
  }
  return message;
};

/**
 * Obtain a new ServerMessage object set to go out to a channel rather than a
 * specific client.
 *
 * @param {mixed} data
 *   The data to be delivered.
 * @param {string} channelId
 *   The ID of the channel to publish to.
 * @param {string} applicationId
 *   The application that sends this message.
 * @return {ServerMessage}
 *   A ServerMessage instance.
 */
p.createServerMessageToChannel = function (data, channelId, applicationId) {
  var message = new ServerMessage();
  message.setData(data);
  message.setChannelId(channelId);
  message.setFromApplication(applicationId);
  message.setToApplication(applicationId);
  message.setOrigin(this.origins.SERVER);
  message.setDestination(this.destinations.CLIENT);
  return message;
};

/**
 * @see MessageManager#createServerMessage
 */
p.createMessage = p.createServerMessage;

/**
 * @see MessageManager#createServerMessageToChannel
 */
p.createMessageToChannel = p.createServerMessageToChannel;

/**
 * Create a reply Message instance addressed to the sender of the provided
 * message.
 *
 * @param {mixed} data
 *   The message data.
 * @param {ServerMessage} message
 *   A message. Metadata from this message will be used.
 * @return {ServerMessage}
 *   A ServerMessage instance.
 */
p.createReplyServerMessage = function (data, message) {
  var reply = new ServerMessage();
  reply.setData(data);

  // Sort out reversing addressing in the metadata. For all the other values
  // we reuse the metadata in the existing message.
  reply.setMetadata(clone(message.getMetadata()));
  reply.setToApplication(message.getFromApplication());
  reply.setFromApplication(message.getToApplication());
  reply.setOrigin(message.getDestination());
  reply.setDestination(message.getOrigin());

  return reply;
};

/**
 * @see MessageManager#createReplyServerMessage
 */
p.createReplyMessage = p.createReplyServerMessage;

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = MessageManager;
