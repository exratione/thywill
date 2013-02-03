/**
 * @fileOverview
 * SimpleMessageManager class definition, a message manager implementation.
 */

var util = require("util");
var clone = require("clone");
var Thywill = require("thywill");
var Message = require("./message");

//-----------------------------------------------------------
// Class Definition
//-----------------------------------------------------------

/**
 * @class
 * A trivial synchronous in-memory resource manager.
 */
function SimpleMessageManager () {
  SimpleMessageManager.super_.call(this);
  this.data = {};
}
util.inherits(SimpleMessageManager, Thywill.getBaseClass("MessageManager"));
var p = SimpleMessageManager.prototype;

//-----------------------------------------------------------
// "Static" parameters
//-----------------------------------------------------------

SimpleMessageManager.CONFIG_TEMPLATE = null;

//-----------------------------------------------------------
// Methods
//-----------------------------------------------------------

/**
 * @see MessageManager#createMessage
 */
p.createMessage = function (data, metadata) {
  var message = new Message();
  message.setData(data);
  message.setMetadata(metadata);
  return message;
};

/**
 * @see MessageManager#createReplyMessage
 */
p.createReplyMessage = function (data, message) {
  var reply = new Message();
  reply.setData(data);

  // Sort out reversing addressing in the metadata.
  var metadata = clone(message.getMetadata());
  var to = metadata[Message.METADATA.TO_APPLICATION];
  var from = metadata[Message.METADATA.FROM_APPLICATION];
  metadata[Message.METADATA.FROM_APPLICATION] = to;
  metadata[Message.METADATA.TO_APPLICATION] = from;
  var origin = metadata[Message.METADATA.ORIGIN];
  var destination = metadata[Message.METADATA.DESTINATION];
  metadata[Message.METADATA.ORIGIN] = destination;
  metadata[Message.METADATA.DESTINATION] = origin;
  reply.setMetadata(metadata);

  return reply;
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = SimpleMessageManager;
