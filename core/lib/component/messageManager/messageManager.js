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

  // Convenience copy of the Message origins and destinations types; it's
  // usually easier if you don't have to load the Message class.
  this.origins = Message.ORIGINS;
  this.destinations = Message.DESTINATIONS;
}
util.inherits(MessageManager, Thywill.getBaseClass("Component"));
var p = MessageManager.prototype;

//-----------------------------------------------------------
// Methods to be implemented by subclasses.
//-----------------------------------------------------------

/**
 * Obtain a new Message object.
 *
 * {
 *   // The body of the message.
 *   data: object
 *   // The ID of the specific client connecton, whether sender or recipient.
 *   connectionId: string
 *   // Whether the message originated from server or client.
 *   origin: Message.ORIGINS.CLIENT || Message.ORIGINS.SERVER
 *   // Whether the message is delivered to server or client.
 *   destination: Message.DESTINATIONS.CLIENT || Message.DESTINATIONS.SERVER
 *   // The ID of the originating application.
 *   fromApplicationId: string
 *   // If not null, the message is flagged for delivery to this application
 *   // only.
 *   toApplicationId: string
 * }
 *
 * @param {Object} params
 *   Message parameters.
 * @return {Message}
 *   A Message instance.
 */
p.createMessage = function (params) {
  throw new Error("Not implemented.");
};

//-----------------------------------------------------------
// Exports - Class Constructor
//-----------------------------------------------------------

module.exports = MessageManager;
