/**
 * @fileOverview
 * MessageManager class definition.
 */

var util = require("util");
var Thywill = require("thywill");
var Message = require("./message");

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
  this.origins = Message.ORIGINS;
  this.destinations = Message.DESTINATIONS;
  this.metadata = Message.METADATA;
  this.types = Message.TYPES;
}
util.inherits(MessageManager, Thywill.getBaseClass("Component"));
var p = MessageManager.prototype;

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

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
p.createMessage = function (data, metadata) {
  throw new Error("Not implemented.");
};

/**
 * Create a reply Message instance addressed to the sender of the provided
 * message.
 *
 * @param {mixed} data
 *   The message data.
 * @param {Message} message
 *   A message. Metadata from this message will be used.
 * @return {Message}
 *   A Message instance.
 */
p.createReplyMessage = function (data, message) {
  throw new Error("Not implemented.");
};


//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = MessageManager;
