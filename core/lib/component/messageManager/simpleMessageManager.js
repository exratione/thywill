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
// Initialization
//-----------------------------------------------------------

/**
 * @see Component#_configure
 */
p._configure = function (thywill, config, callback) {
  // Minimal configuration - all we're doing here is storing it for posterity.
  this.thywill = thywill;
  this.config = config;
  this.readyCallback = callback;

  // There are no asynchronous initialization functions here or in the
  // superclasses. So we can just call them and forge ahead without having
  // to wait around or check for completion.
  this._announceReady(this.NO_ERRORS);
};

/**
 * @see Component#_prepareForShutdown
 */
p._prepareForShutdown = function (callback) {
  // Nothing needed here.
  callback();
};

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
p.createReplyMessage = function (data, message, overrideMetadata) {
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

  // Set any overrides to the metadata.
  for (var property in overrideMetadata) {
    reply.setMetadata(property, overrideMetadata[property]);
  }
  return reply;
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = SimpleMessageManager;
